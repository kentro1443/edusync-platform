import "server-only";

import { randomUUID } from "node:crypto";

import { isDevOperatorAccount } from "@/lib/auth/dev-mode";
import type { AuthenticatedSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export class DevSwitchError extends Error {
  constructor() {
    super("Invalid development account switch");
    this.name = "DevSwitchError";
  }
}

export type DevSwitchAccountOption = Readonly<{
  id: string;
  displayName: string;
  email: string;
  roles: AuthenticatedSession["schoolContexts"][number]["roles"];
}>;

export type DevSwitchSchoolOption = Readonly<{
  id: string;
  slug: string;
  name: string;
  shortName: string;
  accounts: readonly DevSwitchAccountOption[];
}>;

function getDevOperator(session: AuthenticatedSession) {
  const operator =
    session.operatorUser ??
    (session.user.accountKind === "DEV_OPERATOR" ? session.user : null);

  if (!operator || !isDevOperatorAccount(operator.accountKind)) {
    throw new DevSwitchError();
  }

  return operator;
}

export async function listDevSwitchOptions(
  session: AuthenticatedSession,
): Promise<readonly DevSwitchSchoolOption[]> {
  getDevOperator(session);

  const schools = await db.school.findMany({
    where: {
      status: "ACTIVE",
      memberships: {
        some: {
          status: "ACTIVE",
          user: {
            status: "ACTIVE",
            accountKind: "DEMO",
          },
          roleAssignments: { some: {} },
        },
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      shortName: true,
      memberships: {
        where: {
          status: "ACTIVE",
          user: {
            status: "ACTIVE",
            accountKind: "DEMO",
          },
          roleAssignments: { some: {} },
        },
        select: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          roleAssignments: {
            select: { role: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return schools.map((school) => ({
    id: school.id,
    slug: school.slug,
    name: school.name,
    shortName: school.shortName,
    accounts: school.memberships
      .map((membership) => ({
        id: membership.user.id,
        displayName: membership.user.displayName,
        email: membership.user.email,
        roles: membership.roleAssignments.map(({ role }) => role),
      }))
      .sort((left, right) =>
        left.displayName.localeCompare(right.displayName, "vi"),
      ),
  }));
}

export async function switchDevSession(
  session: AuthenticatedSession,
  input: Readonly<{ targetUserId: string; schoolId: string }>,
): Promise<{ schoolSlug: string }> {
  const requestOperator = getDevOperator(session);
  const now = new Date();

  return db.$transaction(async (transaction) => {
    const activeSession = await transaction.session.findUnique({
      where: { id: session.sessionId },
      select: {
        id: true,
        userId: true,
        operatorUserId: true,
        expires: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            status: true,
            accountKind: true,
          },
        },
        operatorUser: {
          select: {
            id: true,
            status: true,
            accountKind: true,
          },
        },
      },
    });

    const persistedOperator =
      activeSession?.operatorUser ??
      (activeSession?.user.accountKind === "DEV_OPERATOR"
        ? activeSession.user
        : null);
    if (
      !activeSession ||
      activeSession.revokedAt !== null ||
      activeSession.expires.getTime() <= now.getTime() ||
      activeSession.userId !== session.user.id ||
      activeSession.operatorUserId !== (session.operatorUser?.id ?? null) ||
      !persistedOperator ||
      persistedOperator.id !== requestOperator.id ||
      persistedOperator.status !== "ACTIVE" ||
      !isDevOperatorAccount(persistedOperator.accountKind)
    ) {
      throw new DevSwitchError();
    }

    const targetMembership = await transaction.schoolMembership.findFirst({
      where: {
        schoolId: input.schoolId,
        userId: input.targetUserId,
        status: "ACTIVE",
        school: { status: "ACTIVE" },
        user: {
          status: "ACTIVE",
          accountKind: "DEMO",
        },
        roleAssignments: { some: {} },
      },
      select: {
        schoolId: true,
        school: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!targetMembership) {
      throw new DevSwitchError();
    }

    const result = await transaction.session.updateMany({
      where: {
        id: activeSession.id,
        userId: activeSession.userId,
        operatorUserId: activeSession.operatorUserId,
        revokedAt: null,
        expires: { gt: now },
      },
      data: {
        userId: input.targetUserId,
        operatorUserId: persistedOperator.id,
      },
    });

    if (result.count !== 1) {
      throw new DevSwitchError();
    }

    await transaction.auditEvent.create({
      data: {
        schoolId: targetMembership.schoolId,
        actorUserId: persistedOperator.id,
        actorType: "USER",
        action: activeSession.operatorUserId
          ? "DEV_IMPERSONATION_SWITCHED"
          : "DEV_IMPERSONATION_STARTED",
        entityType: "User",
        entityId: input.targetUserId,
        beforeJson: {
          userId: activeSession.userId,
        },
        afterJson: {
          userId: input.targetUserId,
          schoolId: targetMembership.schoolId,
        },
        requestId: randomUUID(),
      },
    });

    return { schoolSlug: targetMembership.school.slug };
  });
}

export async function exitDevSession(
  session: AuthenticatedSession,
  activeSchoolId: string | null = null,
): Promise<void> {
  const operator = getDevOperator(session);
  if (!session.operatorUser || operator.id !== session.operatorUser.id) {
    throw new DevSwitchError();
  }

  const auditedSchoolId = session.schoolContexts.some(
    ({ schoolId }) => schoolId === activeSchoolId,
  )
    ? activeSchoolId
    : null;
  const now = new Date();

  await db.$transaction(async (transaction) => {
    const result = await transaction.session.updateMany({
      where: {
        id: session.sessionId,
        userId: session.user.id,
        operatorUserId: operator.id,
        revokedAt: null,
        expires: { gt: now },
      },
      data: {
        userId: operator.id,
        operatorUserId: null,
      },
    });

    if (result.count !== 1) {
      throw new DevSwitchError();
    }

    await transaction.auditEvent.create({
      data: {
        schoolId: auditedSchoolId,
        actorUserId: operator.id,
        actorType: "USER",
        action: "DEV_IMPERSONATION_ENDED",
        entityType: "User",
        entityId: session.user.id,
        beforeJson: {
          userId: session.user.id,
          schoolId: auditedSchoolId,
        },
        afterJson: {
          userId: operator.id,
        },
        requestId: randomUUID(),
      },
    });
  });
}
