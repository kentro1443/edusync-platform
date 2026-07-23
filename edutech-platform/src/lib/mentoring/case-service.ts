import "server-only";

import { randomUUID } from "node:crypto";

import { env } from "@/lib/env";
import {
  getSchoolPermissions,
  hasPermission,
  permissions,
} from "@/lib/auth/permissions";
import type { AuthorizationContext } from "@/lib/auth/policies";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { decryptMentoringNote } from "@/lib/mentoring/note-crypto";
import {
  canReadMentoringNote,
  mentoringNoteVisibilities,
  type MentoringNoteProjection,
  type MentoringNoteVisibility,
} from "@/lib/mentoring/note-privacy";

export class CaseAuthorizationError extends Error {}
export class CaseValidationError extends Error {}

type SchoolActor = AuthorizationContext & {
  schoolId: string;
  membershipId: string;
};

type CaseAccess = Readonly<{
  caseId: string;
  schoolId: string;
  studentUserId: string;
  primaryMentorUserId: string;
  primaryMentorProfileId: string;
  actorIsMentor: boolean;
  actorIsLinkedGuardian: boolean;
}>;

function requireSchoolActor(
  actor: AuthorizationContext,
  permission: Parameters<typeof hasPermission>[1],
): asserts actor is SchoolActor {
  if (
    actor.schoolId === null ||
    actor.membershipId === null ||
    !hasPermission(getSchoolPermissions(actor.schoolRoles), permission)
  ) {
    throw new CaseAuthorizationError("Bạn không có quyền truy cập hồ sơ tư vấn.");
  }
}

export async function requireMentoringCaseAccess(
  actor: AuthorizationContext,
  caseId: string,
  mode: "read" | "write" = "read",
): Promise<CaseAccess> {
  requireSchoolActor(actor, permissions.mentorAppointmentRead);
  const mentoringCase = await db.mentoringCase.findFirst({
    where: { id: caseId, schoolId: actor.schoolId },
    select: {
      id: true,
      schoolId: true,
      studentUserId: true,
      primaryMentorProfileId: true,
      primaryMentor: { select: { userId: true } },
      student: { select: { id: true } },
    },
  });
  if (!mentoringCase) {
    throw new CaseAuthorizationError("Hồ sơ tư vấn không tồn tại.");
  }

  const assignment = await db.mentorStudentAssignment.findFirst({
    where: {
      schoolId: actor.schoolId,
      mentorProfileId: mentoringCase.primaryMentorProfileId,
      studentUserId: mentoringCase.studentUserId,
      status: "ACTIVE",
      mentorProfile: { userId: actor.userId },
    },
    select: { id: true },
  });
  const actorIsMentor =
    actor.userId === mentoringCase.primaryMentor.userId ||
    Boolean(assignment && actor.schoolRoles.includes("MENTOR_COUNSELOR"));
  const actorIsLinkedGuardian =
    actor.schoolRoles.includes("PARENT_GUARDIAN") &&
    Boolean(
      await db.parentStudentLink.findFirst({
        where: {
          schoolId: actor.schoolId,
          parentUserId: actor.userId,
          studentUserId: mentoringCase.studentUserId,
          status: "ACTIVE",
          startsAt: { lte: new Date() },
          OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
        },
        select: { id: true },
      }),
    );

  const isStaff =
    actor.schoolRoles.includes("SCHOOL_ADMIN") ||
    actor.schoolRoles.includes("TEACHER_STAFF");
  const canRead =
    isStaff ||
    actorIsMentor ||
    actor.userId === mentoringCase.studentUserId ||
    actorIsLinkedGuardian;
  const canWrite =
    actorIsMentor ||
    actor.schoolRoles.includes("SCHOOL_ADMIN");

  if ((mode === "read" && !canRead) || (mode === "write" && !canWrite)) {
    throw new CaseAuthorizationError("Bạn không có quyền trên hồ sơ tư vấn này.");
  }

  return {
    caseId: mentoringCase.id,
    schoolId: mentoringCase.schoolId,
    studentUserId: mentoringCase.studentUserId,
    primaryMentorUserId: mentoringCase.primaryMentor.userId,
    primaryMentorProfileId: mentoringCase.primaryMentorProfileId,
    actorIsMentor,
    actorIsLinkedGuardian,
  };
}

async function writeCaseRecords(
  transaction: Prisma.TransactionClient,
  input: {
    schoolId: string;
    actorUserId: string;
    caseId: string;
    action: string;
    payload?: object;
  },
): Promise<void> {
  const requestId = randomUUID();
  await transaction.auditEvent.create({
    data: {
      schoolId: input.schoolId,
      actorUserId: input.actorUserId,
      actorType: "USER",
      action: input.action,
      entityType: "MentoringCase",
      entityId: input.caseId,
      afterJson: input.payload,
      requestId,
    },
  });
  await transaction.domainOutboxEvent.create({
    data: {
      schoolId: input.schoolId,
      eventType: input.action,
      aggregateType: "MentoringCase",
      aggregateId: input.caseId,
      payloadJson: {
        caseId: input.caseId,
        actorUserId: input.actorUserId,
        requestId,
        ...input.payload,
      },
    },
  });
}

export { requireSchoolActor, writeCaseRecords };

export async function createMentoringCase(
  actor: AuthorizationContext,
  input: Readonly<{
    studentUserId: string;
    mentorProfileId: string;
    title: string;
    summary?: string;
    priority?: string;
  }>,
): Promise<string> {
  requireSchoolActor(actor, permissions.mentorAppointmentApprove);
  if (
    input.title.trim().length < 3 ||
    input.title.trim().length > 180 ||
    (input.summary?.trim().length ?? 0) > 2_000
  ) {
    throw new CaseValidationError("Tiêu đề hồ sơ chưa hợp lệ.");
  }

  return db.$transaction(async (transaction) => {
    const student = await transaction.schoolMembership.findFirst({
      where: {
        schoolId: actor.schoolId,
        userId: input.studentUserId,
        status: "ACTIVE",
        roleAssignments: { some: { role: "STUDENT" } },
      },
      select: { id: true },
    });
    const mentor = await transaction.mentorProfile.findFirst({
      where: {
        id: input.mentorProfileId,
        schoolId: actor.schoolId,
        active: true,
        verificationStatus: "VERIFIED",
      },
      select: { id: true },
    });
    if (!student || !mentor) {
      throw new CaseValidationError("Học sinh hoặc cố vấn không hợp lệ.");
    }
    const mentoringCase = await transaction.mentoringCase.create({
      data: {
        schoolId: actor.schoolId,
        studentUserId: input.studentUserId,
        primaryMentorProfileId: input.mentorProfileId,
        title: input.title.trim(),
        summary: input.summary?.trim() || null,
        priority: input.priority?.trim() || "NORMAL",
        createdByUserId: actor.userId,
      },
      select: { id: true },
    });
    await writeCaseRecords(transaction, {
      schoolId: actor.schoolId,
      actorUserId: actor.userId,
      caseId: mentoringCase.id,
      action: "MENTOR_CASE_CREATED",
      payload: { studentUserId: input.studentUserId },
    });
    return mentoringCase.id;
  });
}

export async function listMentoringCases(
  actor: AuthorizationContext,
  input: Readonly<{ query?: string; status?: string }> = {},
) {
  requireSchoolActor(actor, permissions.mentorAppointmentRead);
  const query = input.query?.trim();
  const isStaff =
    actor.schoolRoles.includes("SCHOOL_ADMIN") ||
    actor.schoolRoles.includes("TEACHER_STAFF");
  const where: Prisma.MentoringCaseWhereInput = {
    schoolId: actor.schoolId,
    ...(input.status &&
    ["OPEN", "ON_HOLD", "CLOSED"].includes(input.status)
      ? { status: input.status as "OPEN" | "ON_HOLD" | "CLOSED" }
      : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            {
              student: {
                displayName: { contains: query, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
    ...(isStaff
      ? {}
      : actor.schoolRoles.includes("STUDENT")
        ? { studentUserId: actor.userId }
        : actor.schoolRoles.includes("PARENT_GUARDIAN")
          ? {
              student: {
                parentLinks: {
                  some: {
                    parentUserId: actor.userId,
                    schoolId: actor.schoolId,
                    status: "ACTIVE",
                  },
                },
              },
            }
          : {
              primaryMentor: {
                userId: actor.userId,
              },
            }),
  };
  return db.mentoringCase.findMany({
    where,
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 100,
    select: {
      id: true,
      title: true,
      summary: true,
      priority: true,
      status: true,
      updatedAt: true,
      student: { select: { displayName: true } },
      primaryMentor: { select: { user: { select: { displayName: true } } } },
      _count: { select: { goals: true, sessionOutcomes: true, tasks: true } },
    },
  });
}

export async function listMentoringCaseCandidates(
  actor: AuthorizationContext,
) {
  requireSchoolActor(actor, permissions.mentorAppointmentApprove);
  const [students, mentors] = await Promise.all([
    db.schoolMembership.findMany({
      where: {
        schoolId: actor.schoolId,
        status: "ACTIVE",
        roleAssignments: { some: { role: "STUDENT" } },
      },
      orderBy: { user: { displayName: "asc" } },
      take: 200,
      select: { user: { select: { id: true, displayName: true } } },
    }),
    db.mentorProfile.findMany({
      where: {
        schoolId: actor.schoolId,
        active: true,
        verificationStatus: "VERIFIED",
        ...(actor.schoolRoles.includes("MENTOR_COUNSELOR")
          ? { userId: actor.userId }
          : {}),
      },
      orderBy: { user: { displayName: "asc" } },
      select: { id: true, user: { select: { displayName: true } } },
    }),
  ]);
  return {
    students: students.map(({ user }) => user),
    mentors,
  };
}

export async function getMentoringCase(
  actor: AuthorizationContext,
  caseId: string,
) {
  const access = await requireMentoringCaseAccess(actor, caseId);
  const noteVisibility = new Set<MentoringNoteVisibility>();
  if (access.actorIsMentor) {
    for (const visibility of mentoringNoteVisibilities) {
      noteVisibility.add(visibility);
    }
  }
  if (
    actor.schoolRoles.includes("SCHOOL_ADMIN") ||
    actor.schoolRoles.includes("TEACHER_STAFF")
  ) {
    noteVisibility.add("STAFF_VISIBLE");
  }
  if (actor.userId === access.studentUserId) {
    noteVisibility.add("STUDENT_VISIBLE");
    noteVisibility.add("GUARDIAN_VISIBLE");
  }
  if (access.actorIsLinkedGuardian) {
    noteVisibility.add("GUARDIAN_VISIBLE");
  }
  const record = await db.mentoringCase.findUniqueOrThrow({
    where: { id: caseId },
    select: {
      id: true,
      schoolId: true,
      title: true,
      summary: true,
      priority: true,
      status: true,
      openedAt: true,
      closedAt: true,
      updatedAt: true,
      student: { select: { id: true, displayName: true } },
      primaryMentor: {
        select: {
          id: true,
          user: { select: { id: true, displayName: true } },
        },
      },
      goals: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          targetAt: true,
          status: true,
          progressPercent: true,
        },
      },
      tasks: {
        orderBy: [{ status: "asc" }, { dueAt: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          dueAt: true,
          status: true,
          assignee: { select: { id: true, displayName: true } },
          completedAt: true,
        },
      },
      referrals: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          destination: true,
          reason: true,
          status: true,
          sentAt: true,
          resolvedAt: true,
        },
      },
      sessionOutcomes: {
        orderBy: { completedAt: "desc" },
        select: {
          id: true,
          summary: true,
          progress: true,
          nextSteps: true,
          completedAt: true,
          completedBy: { select: { displayName: true } },
        },
      },
        notes: {
        where: {
          visibility: { in: [...noteVisibility] },
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          schoolId: true,
          studentUserId: true,
          authorUserId: true,
          visibility: true,
          encryptedBody: true,
          createdAt: true,
        },
      },
    },
  });

  const assignedStaffUserIds = [access.primaryMentorUserId];
  const linkedGuardianUserIds = access.actorIsLinkedGuardian
    ? [actor.userId]
    : [];
  const notes = record.notes
    .map((note) => {
      const projection: MentoringNoteProjection = {
        id: note.id,
        schoolId: note.schoolId,
        studentUserId: note.studentUserId,
        authorUserId: note.authorUserId,
          visibility: note.visibility as MentoringNoteVisibility,
        body: decryptMentoringNote(note.encryptedBody, env.AUTH_SECRET),
      };
      return canReadMentoringNote({
        actor: {
          userId: actor.userId,
          schoolId: access.schoolId,
          roles: actor.schoolRoles,
        },
        note: projection,
        assignedStaffUserIds,
        linkedGuardianUserIds,
      })
        ? { ...projection, createdAt: note.createdAt }
        : null;
    })
    .filter((note): note is NonNullable<typeof note> => note !== null);

  return { ...record, notes };
}
