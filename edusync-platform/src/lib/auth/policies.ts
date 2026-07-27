import type {
  PlatformRole,
  SchoolRole,
} from "@/generated/prisma/enums";

import {
  getSchoolPermissions,
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";

export type AuthorizationContext = Readonly<{
  userId: string;
  schoolId: string | null;
  membershipId: string | null;
  schoolRoles: readonly SchoolRole[];
  platformRoles: readonly PlatformRole[];
}>;

export type SchoolResource = Readonly<{
  schoolId: string;
}>;

export type ParentStudentRelationship = Readonly<{
  schoolId: string;
  parentUserId: string;
  studentUserId: string;
  isActive: boolean;
  startsAt: Date;
  endsAt: Date | null;
  visibleFields: Readonly<Record<string, boolean>>;
}>;

export const counselingNoteVisibilities = [
  "PRIVATE_AUTHOR",
  "ASSIGNED_STAFF",
  "SCHOOL_SUPPORT_TEAM",
  "SESSION_PARTICIPANTS",
] as const;

export type CounselingNoteVisibility =
  (typeof counselingNoteVisibilities)[number];

export type CounselingNoteAccessInput = Readonly<{
  actor: AuthorizationContext;
  note: Readonly<{
    schoolId: string;
    authorUserId: string;
    studentUserId: string;
    visibility: CounselingNoteVisibility;
  }>;
  assignedStaffUserIds: readonly string[];
  supportTeamUserIds: readonly string[];
  sessionParticipantUserIds: readonly string[];
}>;

export function isActiveSchoolContext(
  actor: AuthorizationContext,
): actor is AuthorizationContext & {
  schoolId: string;
  membershipId: string;
} {
  return (
    actor.schoolId !== null &&
    actor.membershipId !== null &&
    actor.schoolRoles.length > 0
  );
}

export function belongsToActiveSchool(
  actor: AuthorizationContext,
  resource: SchoolResource,
): boolean {
  return (
    isActiveSchoolContext(actor) &&
    actor.schoolId === resource.schoolId
  );
}

export function can(
  actor: AuthorizationContext,
  permission: Permission,
  resource?: SchoolResource,
): boolean {
  if (!isActiveSchoolContext(actor)) {
    return false;
  }

  if (resource && !belongsToActiveSchool(actor, resource)) {
    return false;
  }

  return hasPermission(
    getSchoolPermissions(actor.schoolRoles),
    permission,
  );
}

export function canAccessLinkedStudentField(
  actor: AuthorizationContext,
  relationship: ParentStudentRelationship,
  studentUserId: string,
  field: string,
  now = new Date(),
): boolean {
  if (!belongsToActiveSchool(actor, relationship)) {
    return false;
  }

  if (
    actor.userId !== relationship.parentUserId ||
    studentUserId !== relationship.studentUserId ||
    !relationship.isActive
  ) {
    return false;
  }

  if (
    relationship.startsAt.getTime() > now.getTime() ||
    (relationship.endsAt !== null &&
      relationship.endsAt.getTime() <= now.getTime())
  ) {
    return false;
  }

  return relationship.visibleFields[field] === true;
}

export function canReadCounselingNote({
  actor,
  note,
  assignedStaffUserIds,
  supportTeamUserIds,
  sessionParticipantUserIds,
}: CounselingNoteAccessInput): boolean {
  if (!belongsToActiveSchool(actor, note)) {
    return false;
  }

  if (actor.userId === note.authorUserId) {
    return true;
  }

  switch (note.visibility) {
    case "PRIVATE_AUTHOR":
      return false;
    case "ASSIGNED_STAFF":
      return assignedStaffUserIds.includes(actor.userId);
    case "SCHOOL_SUPPORT_TEAM":
      return supportTeamUserIds.includes(actor.userId);
    case "SESSION_PARTICIPANTS":
      return sessionParticipantUserIds.includes(actor.userId);
  }
}