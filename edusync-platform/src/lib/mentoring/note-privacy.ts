import type { SchoolRole } from "@/generated/prisma/enums";

export const mentoringNoteVisibilities = [
  "PRIVATE_COUNSELOR",
  "STUDENT_VISIBLE",
  "GUARDIAN_VISIBLE",
  "STAFF_VISIBLE",
] as const;

export type MentoringNoteVisibility =
  (typeof mentoringNoteVisibilities)[number];

export type MentoringNoteProjection = Readonly<{
  id: string;
  schoolId: string;
  studentUserId: string;
  authorUserId: string;
  visibility: MentoringNoteVisibility;
  body: string;
}>;

type NoteActor = Readonly<{
  userId: string;
  schoolId: string;
  roles: readonly SchoolRole[];
}>;

type NoteAccessInput = Readonly<{
  actor: NoteActor;
  note: MentoringNoteProjection;
  assignedStaffUserIds: readonly string[];
  linkedGuardianUserIds: readonly string[];
}>;

export function canReadMentoringNote({
  actor,
  note,
  assignedStaffUserIds,
  linkedGuardianUserIds,
}: NoteAccessInput): boolean {
  if (actor.schoolId !== note.schoolId) return false;
  if (actor.userId === note.authorUserId) return true;

  const isStudent = actor.userId === note.studentUserId;
  const isAssignedStaff = assignedStaffUserIds.includes(actor.userId);
  const isLinkedGuardian =
    actor.roles.includes("PARENT_GUARDIAN") &&
    linkedGuardianUserIds.includes(actor.userId);

  switch (note.visibility) {
    case "PRIVATE_COUNSELOR":
      return false;
    case "STUDENT_VISIBLE":
      return isStudent || isAssignedStaff;
    case "GUARDIAN_VISIBLE":
      return isStudent || isAssignedStaff || isLinkedGuardian;
    case "STAFF_VISIBLE":
      return (
        isAssignedStaff ||
        actor.roles.includes("SCHOOL_ADMIN") ||
        actor.roles.includes("TEACHER_STAFF")
      );
  }
}

export function projectMentoringNotes({
  actor,
  notes,
  assignedStaffUserIds,
  linkedGuardianUserIds,
}: Readonly<{
  actor: NoteActor;
  notes: readonly MentoringNoteProjection[];
  assignedStaffUserIds: readonly string[];
  linkedGuardianUserIds: readonly string[];
}>): MentoringNoteProjection[] {
  return notes.filter((note) =>
    canReadMentoringNote({
      actor,
      note,
      assignedStaffUserIds,
      linkedGuardianUserIds,
    }),
  );
}
