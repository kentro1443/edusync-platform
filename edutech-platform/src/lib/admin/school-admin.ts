import "server-only";

import { ParentStudentLinkStatus, type MembershipStatus } from "@/generated/prisma/enums";
import { writeAuditEvent } from "@/lib/audit";
import { parseMemberFilters, parseRoleSelection, parseSchoolSettings } from "@/lib/admin/validation";
import { getSchoolPermissions, hasPermission, permissions, type Permission } from "@/lib/auth/permissions";
import type { AuthorizationContext } from "@/lib/auth/policies";
import { db } from "@/lib/db";

export class AdminAuthorizationError extends Error {}
export class AdminValidationError extends Error {}

function requireSchoolPermission(
  actor: AuthorizationContext,
  permission: Permission,
): asserts actor is AuthorizationContext & { schoolId: string; membershipId: string } {
  if (
    actor.schoolId === null ||
    actor.membershipId === null ||
    !hasPermission(getSchoolPermissions(actor.schoolRoles), permission)
  ) {
    throw new AdminAuthorizationError("Forbidden school administration action.");
  }
}

export async function listSchoolMembers(
  actor: AuthorizationContext,
  input: { page?: unknown; pageSize?: unknown; query?: unknown; status?: unknown },
) {
  requireSchoolPermission(actor, permissions.schoolUserRead);
  const filters = parseMemberFilters(input);
  const where = {
    schoolId: actor.schoolId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.query
      ? {
          user: {
            OR: [
              { displayName: { contains: filters.query, mode: "insensitive" as const } },
              { normalizedEmail: { contains: filters.query.toLowerCase(), mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };
  const [total, members] = await db.$transaction([
    db.schoolMembership.count({ where }),
    db.schoolMembership.findMany({
      where,
      select: {
        id: true,
        status: true,
        joinedAt: true,
        createdAt: true,
        user: { select: { id: true, displayName: true, email: true, lastLoginAt: true } },
        roleAssignments: { select: { role: true }, orderBy: { role: "asc" } },
      },
      orderBy: [{ user: { displayName: "asc" } }, { id: "asc" }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);
  return {
    members,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export async function listSchoolInvitations(actor: AuthorizationContext) {
  requireSchoolPermission(actor, permissions.schoolUserRead);
  return db.invitation.findMany({
    where: { schoolId: actor.schoolId },
    select: {
      id: true,
      email: true,
      roleHintsJson: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      lastSentAt: true,
      sendCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getSchoolMembership(
  actor: AuthorizationContext,
  membershipId: string,
) {
  requireSchoolPermission(actor, permissions.schoolUserRead);
  return db.schoolMembership.findFirst({
    where: { id: membershipId, schoolId: actor.schoolId },
    select: {
      id: true,
      status: true,
      joinedAt: true,
      leftAt: true,
      createdAt: true,
      user: { select: { id: true, displayName: true, email: true, status: true, lastLoginAt: true } },
      roleAssignments: { select: { role: true }, orderBy: { role: "asc" } },
    },
  });
}

export async function setMembershipRoles(
  actor: AuthorizationContext,
  membershipId: string,
  input: unknown,
): Promise<void> {
  requireSchoolPermission(actor, permissions.schoolRoleAssign);
  const parsed = parseRoleSelection(input);
  if (!parsed.success) throw new AdminValidationError("At least one valid role is required.");
  const membership = await db.schoolMembership.findFirst({
    where: { id: membershipId, schoolId: actor.schoolId },
    select: { id: true, roleAssignments: { select: { role: true } } },
  });
  if (!membership) throw new AdminValidationError("Membership not found.");
  if (
    membership.id === actor.membershipId &&
    !parsed.roles.includes("SCHOOL_ADMIN")
  ) {
    throw new AdminValidationError("Cannot remove own school administrator role.");
  }
  await db.$transaction(async (transaction) => {
    await transaction.schoolRoleAssignment.deleteMany({ where: { membershipId: membership.id } });
    await transaction.schoolRoleAssignment.createMany({
      data: parsed.roles.map((role) => ({ membershipId: membership.id, role, assignedByUserId: actor.userId })),
    });
  });
  await writeAuditEvent({
    schoolId: actor.schoolId,
    actorUserId: actor.userId,
    action: "SCHOOL_MEMBERSHIP_ROLES_UPDATED",
    entityType: "SchoolMembership",
    entityId: membership.id,
    before: { roles: membership.roleAssignments.map(({ role }) => role) },
    after: { roles: parsed.roles },
  });
}

export async function setMembershipStatus(
  actor: AuthorizationContext,
  membershipId: string,
  status: Extract<MembershipStatus, "ACTIVE" | "SUSPENDED">,
  now = new Date(),
): Promise<void> {
  requireSchoolPermission(actor, permissions.schoolUserSuspend);
  if (membershipId === actor.membershipId) throw new AdminValidationError("Cannot change own membership status.");
  const membership = await db.schoolMembership.findFirst({
    where: { id: membershipId, schoolId: actor.schoolId },
    select: { id: true, status: true, userId: true },
  });
  if (!membership) throw new AdminValidationError("Membership not found.");
  await db.$transaction(async (transaction) => {
    await transaction.schoolMembership.update({
      where: { id: membership.id },
      data: {
        status,
        joinedAt: status === "ACTIVE" ? membership.status === "ACTIVE" ? undefined : now : undefined,
        leftAt: status === "SUSPENDED" ? now : null,
      },
    });
    if (status === "SUSPENDED") {
      await transaction.session.updateMany({
        where: { userId: membership.userId, revokedAt: null },
        data: { revokedAt: now, revokeReason: "MEMBERSHIP_SUSPENDED" },
      });
    }
  });
  await writeAuditEvent({
    schoolId: actor.schoolId,
    actorUserId: actor.userId,
    action: status === "ACTIVE" ? "SCHOOL_MEMBERSHIP_REACTIVATED" : "SCHOOL_MEMBERSHIP_SUSPENDED",
    entityType: "SchoolMembership",
    entityId: membership.id,
    before: { status: membership.status },
    after: { status },
  });
}

export async function listParentStudentLinks(actor: AuthorizationContext) {
  requireSchoolPermission(actor, permissions.schoolUserRead);
  return db.parentStudentLink.findMany({
    where: { schoolId: actor.schoolId },
    select: {
      id: true,
      relationshipType: true,
      status: true,
      startsAt: true,
      endsAt: true,
      parent: { select: { id: true, displayName: true, email: true } },
      student: { select: { id: true, displayName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listParentStudentCandidates(actor: AuthorizationContext) {
  requireSchoolPermission(actor, permissions.schoolUserRead);
  const memberships = await db.schoolMembership.findMany({
    where: {
      schoolId: actor.schoolId,
      status: "ACTIVE",
      roleAssignments: { some: { role: { in: ["PARENT_GUARDIAN", "STUDENT"] } } },
    },
    select: {
      user: { select: { id: true, displayName: true, email: true } },
      roleAssignments: { select: { role: true } },
    },
    orderBy: { user: { displayName: "asc" } },
  });
  return {
    parents: memberships
      .filter(({ roleAssignments }) => roleAssignments.some(({ role }) => role === "PARENT_GUARDIAN"))
      .map(({ user }) => user),
    students: memberships
      .filter(({ roleAssignments }) => roleAssignments.some(({ role }) => role === "STUDENT"))
      .map(({ user }) => user),
  };
}

export async function createParentStudentLink(
  actor: AuthorizationContext,
  input: { parentUserId: string; studentUserId: string; relationshipType: string },
  now = new Date(),
): Promise<string> {
  requireSchoolPermission(actor, permissions.schoolUserUpdate);
  if (input.parentUserId === input.studentUserId) throw new AdminValidationError("Parent and student must differ.");
  const memberships = await db.schoolMembership.findMany({
    where: {
      schoolId: actor.schoolId,
      status: "ACTIVE",
      userId: { in: [input.parentUserId, input.studentUserId] },
    },
    select: { userId: true, roleAssignments: { select: { role: true } } },
  });
  const parent = memberships.find((membership) => membership.userId === input.parentUserId);
  const student = memberships.find((membership) => membership.userId === input.studentUserId);
  if (
    !parent?.roleAssignments.some(({ role }) => role === "PARENT_GUARDIAN") ||
    !student?.roleAssignments.some(({ role }) => role === "STUDENT")
  ) {
    throw new AdminValidationError("Parent/student roles are required in the active school.");
  }
  const link = await db.parentStudentLink.upsert({
    where: {
      schoolId_parentUserId_studentUserId: {
        schoolId: actor.schoolId,
        parentUserId: input.parentUserId,
        studentUserId: input.studentUserId,
      },
    },
    create: {
      schoolId: actor.schoolId,
      parentUserId: input.parentUserId,
      studentUserId: input.studentUserId,
      relationshipType: input.relationshipType.trim().slice(0, 80) || "Phụ huynh",
      status: ParentStudentLinkStatus.ACTIVE,
      startsAt: now,
      visibilityPolicyJson: { attendance: true, appointments: true, counselingNotes: false },
    },
    update: { status: ParentStudentLinkStatus.ACTIVE, startsAt: now, endsAt: null },
    select: { id: true },
  });
  await writeAuditEvent({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "PARENT_STUDENT_LINK_CREATED", entityType: "ParentStudentLink", entityId: link.id });
  return link.id;
}

export async function revokeParentStudentLink(
  actor: AuthorizationContext,
  linkId: string,
  now = new Date(),
): Promise<boolean> {
  requireSchoolPermission(actor, permissions.schoolUserUpdate);
  const result = await db.parentStudentLink.updateMany({
    where: { id: linkId, schoolId: actor.schoolId, status: ParentStudentLinkStatus.ACTIVE },
    data: { status: ParentStudentLinkStatus.REVOKED, endsAt: now },
  });
  if (result.count === 1) {
    await writeAuditEvent({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "PARENT_STUDENT_LINK_REVOKED", entityType: "ParentStudentLink", entityId: linkId });
  }
  return result.count === 1;
}

export async function getSchoolSettings(actor: AuthorizationContext) {
  requireSchoolPermission(actor, permissions.schoolSettingsRead);
  return db.school.findUnique({
    where: { id: actor.schoolId },
    select: { id: true, name: true, shortName: true, slug: true, planCode: true, settingsJson: true },
  });
}

export async function updateSchoolSettings(
  actor: AuthorizationContext,
  input: unknown,
): Promise<void> {
  requireSchoolPermission(actor, permissions.schoolSettingsUpdate);
  const parsed = parseSchoolSettings(input);
  if (!parsed.success) throw new AdminValidationError("Invalid school settings.");
  const { name, shortName, contactEmail } = parsed.data;
  const before = await db.school.findUnique({ where: { id: actor.schoolId }, select: { name: true, shortName: true, settingsJson: true } });
  if (!before) throw new AdminValidationError("School not found.");
  const settings = typeof before.settingsJson === "object" && before.settingsJson && !Array.isArray(before.settingsJson)
    ? before.settingsJson
    : {};
  await db.school.update({
    where: { id: actor.schoolId },
    data: {
      name,
      shortName,
      settingsJson: { ...settings, contactEmail },
    },
  });
  await writeAuditEvent({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "SCHOOL_SETTINGS_UPDATED", entityType: "School", entityId: actor.schoolId, before, after: { name, shortName, contactEmail } });
}
