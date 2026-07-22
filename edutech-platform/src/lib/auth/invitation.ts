import "server-only";

import { SchoolRole, UserStatus, type SchoolRole as SchoolRoleType } from "@/generated/prisma/enums";
import { writeAuditEvent } from "@/lib/audit";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/auth/opaque-token";
import { hashPassword, normalizeEmail } from "@/lib/auth/password";
import { can, type AuthorizationContext } from "@/lib/auth/policies";
import { permissions } from "@/lib/auth/permissions";
import { authRateLimits, checkAuthRateLimit, recordAuthAttempt } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { z } from "zod";

const invitationLifetimeMs = 7 * 24 * 60 * 60_000;
const schoolRoles = Object.values(SchoolRole) as SchoolRoleType[];

export type InvitationLifecycle = "pending" | "expired" | "revoked" | "accepted";

export function getInvitationLifecycle(
  invitation: { expiresAt: Date; acceptedAt: Date | null; revokedAt: Date | null },
  now = new Date(),
): InvitationLifecycle {
  if (invitation.acceptedAt) return "accepted";
  if (invitation.revokedAt) return "revoked";
  if (invitation.expiresAt.getTime() <= now.getTime()) return "expired";
  return "pending";
}

const invitationSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  roles: z
    .array(z.enum(schoolRoles as [SchoolRoleType, ...SchoolRoleType[]]))
    .min(1)
    .transform((roles) => [...new Set(roles)]),
});

export function parseInvitationInput(input: { email: unknown; roles: unknown }):
  | { success: true; data: { email: string; roles: SchoolRoleType[] } }
  | { success: false; error: "invalid" } {
  const result = invitationSchema.safeParse(input);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: "invalid" };
}

function parseRoleHints(value: unknown): SchoolRoleType[] {
  if (!Array.isArray(value)) return [];
  return value.filter((role): role is SchoolRoleType =>
    typeof role === "string" && schoolRoles.includes(role as SchoolRoleType),
  );
}

function canManageInvitations(actor: AuthorizationContext): actor is AuthorizationContext & { schoolId: string; membershipId: string } {
  return (
    can(actor, permissions.schoolUserInvite) &&
    can(actor, permissions.schoolRoleAssign) &&
    actor.schoolId !== null &&
    actor.membershipId !== null
  );
}

export async function createSchoolInvitation(
  actor: AuthorizationContext,
  input: { email: unknown; roles: unknown },
  now = new Date(),
): Promise<{ success: true; id: string } | { success: false; error: "forbidden" | "invalid" | "member-exists" | "rate-limited" }> {
  if (!canManageInvitations(actor)) return { success: false, error: "forbidden" };
  const parsed = parseInvitationInput(input);
  if (!parsed.success) return parsed;
  const rateSubject = `${actor.schoolId}:${actor.userId}`;
  const limit = await checkAuthRateLimit("invitation", rateSubject, authRateLimits.invitation, now);
  if (!limit.allowed) return { success: false, error: "rate-limited" };

  const membership = await db.schoolMembership.findFirst({
    where: {
      schoolId: actor.schoolId,
      user: { normalizedEmail: parsed.data.email },
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (membership) return { success: false, error: "member-exists" };

  const token = createOpaqueToken();
  const expiresAt = new Date(now.getTime() + invitationLifetimeMs);
  const invitation = await db.$transaction(async (transaction) => {
    await transaction.invitation.updateMany({
      where: {
        schoolId: actor.schoolId,
        normalizedEmail: parsed.data.email,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: now },
    });
    const created = await transaction.invitation.create({
      data: {
        schoolId: actor.schoolId,
        email: parsed.data.email,
        normalizedEmail: parsed.data.email,
        tokenHash: hashOpaqueToken(token),
        roleHintsJson: parsed.data.roles,
        expiresAt,
        createdByUserId: actor.userId,
      },
      select: { id: true, school: { select: { name: true } } },
    });
    await transaction.emailOutbox.create({
      data: {
        schoolId: actor.schoolId,
        toAddress: parsed.data.email,
        templateKey: "SCHOOL_INVITATION",
        payloadJson: {
          schoolName: created.school.name,
          invitationUrl: `${env.APP_URL}/chap-nhan-loi-moi?token=${token}`,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });
    return created;
  });
  await recordAuthAttempt("invitation", rateSubject, authRateLimits.invitation, now);
  await writeAuditEvent({
    schoolId: actor.schoolId,
    actorUserId: actor.userId,
    action: "SCHOOL_INVITATION_CREATED",
    entityType: "Invitation",
    entityId: invitation.id,
    after: { email: parsed.data.email, roles: parsed.data.roles },
  });
  return { success: true, id: invitation.id };
}

export async function resendSchoolInvitation(
  actor: AuthorizationContext,
  invitationId: string,
  now = new Date(),
): Promise<boolean> {
  if (!canManageInvitations(actor)) return false;
  const rateSubject = `${actor.schoolId}:${actor.userId}`;
  const limit = await checkAuthRateLimit(
    "invitation",
    rateSubject,
    authRateLimits.invitation,
    now,
  );
  if (!limit.allowed) return false;
  const invitation = await db.invitation.findFirst({
    where: { id: invitationId, schoolId: actor.schoolId },
    select: { id: true, email: true, acceptedAt: true, revokedAt: true, school: { select: { name: true } } },
  });
  if (!invitation || invitation.acceptedAt || invitation.revokedAt) return false;
  const token = createOpaqueToken();
  const expiresAt = new Date(now.getTime() + invitationLifetimeMs);
  await db.$transaction([
    db.invitation.update({
      where: { id: invitation.id },
      data: {
        tokenHash: hashOpaqueToken(token),
        expiresAt,
        lastSentAt: now,
        sendCount: { increment: 1 },
      },
    }),
    db.emailOutbox.create({
      data: {
        schoolId: actor.schoolId,
        toAddress: invitation.email,
        templateKey: "SCHOOL_INVITATION",
        payloadJson: {
          schoolName: invitation.school.name,
          invitationUrl: `${env.APP_URL}/chap-nhan-loi-moi?token=${token}`,
          expiresAt: expiresAt.toISOString(),
        },
      },
    }),
  ]);
  await recordAuthAttempt(
    "invitation",
    rateSubject,
    authRateLimits.invitation,
    now,
  );
  await writeAuditEvent({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "SCHOOL_INVITATION_RESENT", entityType: "Invitation", entityId: invitation.id });
  return true;
}

export async function revokeSchoolInvitation(
  actor: AuthorizationContext,
  invitationId: string,
  now = new Date(),
): Promise<boolean> {
  if (!canManageInvitations(actor)) return false;
  const result = await db.invitation.updateMany({
    where: { id: invitationId, schoolId: actor.schoolId, acceptedAt: null, revokedAt: null },
    data: { revokedAt: now },
  });
  if (result.count !== 1) return false;
  await writeAuditEvent({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "SCHOOL_INVITATION_REVOKED", entityType: "Invitation", entityId: invitationId });
  return true;
}

export async function getInvitationByToken(token: string, now = new Date()) {
  if (!token || token.length > 512) return null;
  const invitation = await db.invitation.findUnique({
    where: { tokenHash: hashOpaqueToken(token) },
    select: {
      id: true,
      email: true,
      normalizedEmail: true,
      roleHintsJson: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      school: { select: { name: true } },
    },
  });
  if (!invitation || getInvitationLifecycle(invitation, now) !== "pending") return null;
  const existingUser = await db.user.findUnique({
    where: { normalizedEmail: invitation.normalizedEmail },
    select: { id: true, status: true },
  });
  return {
    id: invitation.id,
    email: invitation.email,
    schoolName: invitation.school.name,
    roles: parseRoleHints(invitation.roleHintsJson),
    existingAccount: existingUser?.status === UserStatus.ACTIVE,
  };
}

export async function acceptSchoolInvitation(
  token: string,
  input: { displayName?: string; password?: string; confirmPassword?: string },
  now = new Date(),
): Promise<{ success: true } | { success: false; error: "invalid" | "weak" | "mismatch" | "inactive-user" }> {
  const invitation = await getInvitationByToken(token, now);
  if (!invitation || invitation.roles.length === 0) return { success: false, error: "invalid" };
  const existing = await db.user.findUnique({
    where: { normalizedEmail: normalizeEmail(invitation.email) },
    select: { id: true, status: true },
  });
  if (existing && existing.status !== UserStatus.ACTIVE) return { success: false, error: "inactive-user" };

  let newUserData: { displayName: string; passwordHash: string } | null = null;
  if (!existing) {
    const displayName = input.displayName?.trim() ?? "";
    if (displayName.length < 2 || !input.password || input.password.length < 12) {
      return { success: false, error: "weak" };
    }
    if (input.password !== input.confirmPassword) return { success: false, error: "mismatch" };
    newUserData = { displayName, passwordHash: await hashPassword(input.password) };
  }

  const accepted = await db.$transaction(async (transaction) => {
    const claimed = await transaction.invitation.updateMany({
      where: {
        id: invitation.id,
        tokenHash: hashOpaqueToken(token),
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { acceptedAt: now },
    });
    if (claimed.count !== 1) return null;

    const user = existing
      ? existing
      : await transaction.user.create({
          data: {
            email: invitation.email,
            normalizedEmail: normalizeEmail(invitation.email),
            displayName: newUserData!.displayName,
            passwordHash: newUserData!.passwordHash,
            mustChangePassword: false,
          },
          select: { id: true, status: true },
        });
    const invitationRecord = await transaction.invitation.findUniqueOrThrow({
      where: { id: invitation.id },
      select: { schoolId: true },
    });
    const membership = await transaction.schoolMembership.upsert({
      where: { schoolId_userId: { schoolId: invitationRecord.schoolId, userId: user.id } },
      create: { schoolId: invitationRecord.schoolId, userId: user.id, status: "ACTIVE", joinedAt: now },
      update: { status: "ACTIVE", joinedAt: now, leftAt: null },
      select: { id: true },
    });
    await transaction.schoolRoleAssignment.createMany({
      data: invitation.roles.map((role) => ({ membershipId: membership.id, role })),
      skipDuplicates: true,
    });
    return { userId: user.id, schoolId: invitationRecord.schoolId, membershipId: membership.id };
  });
  if (!accepted) return { success: false, error: "invalid" };
  await writeAuditEvent({
    schoolId: accepted.schoolId,
    actorUserId: accepted.userId,
    action: "SCHOOL_INVITATION_ACCEPTED",
    entityType: "SchoolMembership",
    entityId: accepted.membershipId,
  });
  return { success: true };
}
