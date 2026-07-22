import "server-only";

import { createHash, randomBytes } from "node:crypto";

import {
  MembershipStatus,
  SchoolStatus,
  UserStatus,
} from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { AuthorizationContext } from "@/lib/auth/policies";

export const sessionCookieName = "edutech.session-token";
export const sessionMaxAgeSeconds = 60 * 60 * 12;

export type AuthenticatedUser = Readonly<{
  id: string;
  email: string;
  displayName: string;
  mustChangePassword: boolean;
}>;

export type SchoolContextOption = Readonly<{
  membershipId: string;
  schoolId: string;
  schoolSlug: string;
  schoolName: string;
  roles: AuthorizationContext["schoolRoles"];
}>;

export type AuthenticatedSession = Readonly<{
  user: AuthenticatedUser;
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
  now = new Date(),
): Promise<{ token: string; expires: Date }> {
  const token = createOpaqueSessionToken();
  const expires = new Date(
    now.getTime() + sessionMaxAgeSeconds * 1_000,
  );

  await db.session.create({
    data: {
      sessionTokenHash: hashSessionToken(token),
      userId,
      expires,
    },
  });

  return { token, expires };
}

export async function revokeDatabaseSession(
  token: string,
): Promise<void> {
  await db.session.deleteMany({
    where: {
      sessionTokenHash: hashSessionToken(token),
    },
  });
}

export async function revokeAllUserSessions(
  userId: string,
): Promise<number> {
  const result = await db.session.deleteMany({
    where: { userId },
  });

  return result.count;
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
      expires: true,
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          mustChangePassword: true,
          status: true,
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
    },
  });

  if (!session) {
    return null;
  }

  if (
    session.expires.getTime() <= now.getTime() ||
    session.user.status !== UserStatus.ACTIVE
  ) {
    await db.session.deleteMany({
      where: {
        sessionTokenHash: tokenHash,
      },
    });

    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      mustChangePassword: session.user.mustChangePassword,
    },
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