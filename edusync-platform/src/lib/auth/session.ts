import "server-only";

import { createHash, randomBytes } from "node:crypto";

import {
  MembershipStatus,
  SchoolStatus,
  UserStatus,
  type UserAccountKind,
} from "@/generated/prisma/enums";
import { isDevModeEnabled } from "@/lib/auth/dev-mode";
import { db } from "@/lib/db";
import type { AuthorizationContext } from "@/lib/auth/policies";

export const sessionCookieName = "edusync.session-token";
export const sessionMaxAgeSeconds = 60 * 60 * 12;

export type AuthenticatedUser = Readonly<{
  id: string;
  email: string;
  displayName: string;
  mustChangePassword: boolean;
  accountKind: UserAccountKind;
}>;

export type SchoolContextOption = Readonly<{
  membershipId: string;
  schoolId: string;
  schoolSlug: string;
  schoolName: string;
  roles: AuthorizationContext["schoolRoles"];
}>;

export type AuthenticatedSession = Readonly<{
  sessionId: string;
  user: AuthenticatedUser;
  operatorUser: AuthenticatedUser | null;
  expires: Date;
  platformRoles: AuthorizationContext["platformRoles"];
  schoolContexts: readonly SchoolContextOption[];
}>;

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createOpaqueSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createDatabaseSession(
  userId: string,
  metadata: { userAgent?: string | null; ipHash?: string | null } = {},
  now = new Date(),
): Promise<{ id: string; token: string; expires: Date }> {
  const token = createOpaqueSessionToken();
  const expires = new Date(
    now.getTime() + sessionMaxAgeSeconds * 1_000,
  );

  const session = await db.session.create({
    data: {
      sessionTokenHash: hashSessionToken(token),
      userId,
      expires,
      userAgent: metadata.userAgent ?? null,
      ipHash: metadata.ipHash ?? null,
    },
    select: { id: true },
  });

  return { id: session.id, token, expires };
}

export async function revokeDatabaseSession(
  token: string,
  reason = "LOGOUT",
  now = new Date(),
): Promise<void> {
  await db.session.updateMany({
    where: {
      sessionTokenHash: hashSessionToken(token),
      revokedAt: null,
    },
    data: { revokedAt: now, revokeReason: reason },
  });
}

export async function revokeAllUserSessions(
  userId: string,
  reason = "REVOKE_ALL",
  now = new Date(),
): Promise<number> {
  const result = await db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: now, revokeReason: reason },
  });

  return result.count;
}

export async function revokeOtherUserSessions(
  userId: string,
  currentToken: string,
  now = new Date(),
): Promise<number> {
  const result = await db.session.updateMany({
    where: {
      userId,
      sessionTokenHash: { not: hashSessionToken(currentToken) },
      revokedAt: null,
    },
    data: { revokedAt: now, revokeReason: "REVOKE_OTHER" },
  });
  return result.count;
}

export async function listUserSessions(userId: string, now = new Date()) {
  return db.session.findMany({
    where: { userId, revokedAt: null, expires: { gt: now } },
    select: {
      id: true,
      createdAt: true,
      lastSeenAt: true,
      expires: true,
      userAgent: true,
      ipHash: true,
    },
    orderBy: { lastSeenAt: "desc" },
  });
}

export async function revokeUserSessionById(
  userId: string,
  sessionId: string,
  now = new Date(),
): Promise<boolean> {
  const result = await db.session.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: now, revokeReason: "USER_REVOKED" },
  });
  return result.count === 1;
}

export async function getDatabaseSession(
  token: string,
  now = new Date(),
): Promise<AuthenticatedSession | null> {
  const tokenHash = hashSessionToken(token);
  const session = await db.session.findUnique({
    where: {
      sessionTokenHash: tokenHash,
    },
    select: {
      id: true,
      expires: true,
      revokedAt: true,
      lastSeenAt: true,
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          mustChangePassword: true,
          status: true,
          accountKind: true,
          platformRoleAssignments: {
            select: {
              role: true,
            },
          },
          memberships: {
            where: {
              status: MembershipStatus.ACTIVE,
              school: {
                status: SchoolStatus.ACTIVE,
              },
            },
            select: {
              id: true,
              schoolId: true,
              school: {
                select: {
                  slug: true,
                  name: true,
                },
              },
              roleAssignments: {
                select: {
                  role: true,
                },
              },
            },
          },
        },
      },
      operatorUser: {
        select: {
          id: true,
          email: true,
          displayName: true,
          mustChangePassword: true,
          status: true,
          accountKind: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  const devModeInvalid =
    (session.user.accountKind === "DEV_OPERATOR" && !isDevModeEnabled()) ||
    (session.operatorUser !== null &&
      (!isDevModeEnabled() ||
        session.operatorUser.status !== UserStatus.ACTIVE ||
        session.operatorUser.accountKind !== "DEV_OPERATOR" ||
        session.user.accountKind !== "DEMO"));

  if (
    session.revokedAt !== null ||
    session.expires.getTime() <= now.getTime() ||
    session.user.status !== UserStatus.ACTIVE ||
    devModeInvalid
  ) {
    await db.session.updateMany({
      where: {
        sessionTokenHash: tokenHash,
      },
      data: {
        revokedAt: session.revokedAt ?? now,
        revokeReason:
          devModeInvalid
            ? "DEV_MODE_INVALID"
            : session.user.status !== UserStatus.ACTIVE
            ? "USER_INACTIVE"
            : "EXPIRED",
      },
    });

    return null;
  }

  if (now.getTime() - session.lastSeenAt.getTime() >= 5 * 60_000) {
    await db.session.updateMany({
      where: { sessionTokenHash: tokenHash, revokedAt: null },
      data: { lastSeenAt: now },
    });
  }

  return {
    sessionId: session.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      mustChangePassword: session.user.mustChangePassword,
      accountKind: session.user.accountKind,
    },
    operatorUser: session.operatorUser
      ? {
          id: session.operatorUser.id,
          email: session.operatorUser.email,
          displayName: session.operatorUser.displayName,
          mustChangePassword: session.operatorUser.mustChangePassword,
          accountKind: session.operatorUser.accountKind,
        }
      : null,
    expires: session.expires,
    platformRoles: session.user.platformRoleAssignments.map(
      ({ role }) => role,
    ),
    schoolContexts: session.user.memberships
      .filter(({ roleAssignments }) => roleAssignments.length > 0)
      .map((membership) => ({
        membershipId: membership.id,
        schoolId: membership.schoolId,
        schoolSlug: membership.school.slug,
        schoolName: membership.school.name,
        roles: membership.roleAssignments.map(({ role }) => role),
      })),
  };
}

export function selectSchoolAuthorizationContext(
  session: AuthenticatedSession,
  schoolSlug: string,
): AuthorizationContext | null {
  const schoolContext = session.schoolContexts.find(
    (context) => context.schoolSlug === schoolSlug,
  );

  if (!schoolContext) {
    return null;
  }

  return {
    userId: session.user.id,
    schoolId: schoolContext.schoolId,
    membershipId: schoolContext.membershipId,
    schoolRoles: schoolContext.roles,
    platformRoles: session.platformRoles,
  };
}

export function getPlatformAuthorizationContext(
  session: AuthenticatedSession,
): AuthorizationContext {
  return {
    userId: session.user.id,
    schoolId: null,
    membershipId: null,
    schoolRoles: [],
    platformRoles: session.platformRoles,
  };
}
