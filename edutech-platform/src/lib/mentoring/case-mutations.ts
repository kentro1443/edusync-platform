import "server-only";

import { env } from "@/lib/env";
import type { AuthorizationContext } from "@/lib/auth/policies";
import { db } from "@/lib/db";
import { encryptMentoringNote } from "@/lib/mentoring/note-crypto";
import {
  CaseValidationError,
  requireMentoringCaseAccess,
  writeCaseRecords,
} from "@/lib/mentoring/case-service";
import {
  mentoringNoteVisibilities,
  type MentoringNoteVisibility,
} from "@/lib/mentoring/note-privacy";

async function requireWritableCase(
  actor: AuthorizationContext,
  caseId: string,
) {
  return requireMentoringCaseAccess(actor, caseId, "write");
}

export async function updateMentoringCaseStatus(
  actor: AuthorizationContext,
  caseId: string,
  status: "OPEN" | "ON_HOLD" | "CLOSED",
): Promise<void> {
  const access = await requireWritableCase(actor, caseId);
  const current = await db.mentoringCase.findUniqueOrThrow({
    where: { id: caseId },
    select: { status: true },
  });
  const allowed: Record<string, readonly string[]> = {
    OPEN: ["ON_HOLD", "CLOSED"],
    ON_HOLD: ["OPEN", "CLOSED"],
    CLOSED: [],
  };
  if (!allowed[current.status].includes(status)) {
    throw new CaseValidationError(
      `Không thể chuyển hồ sơ từ "${current.status}" sang "${status}".`,
    );
  }
  await db.$transaction(async (transaction) => {
    await transaction.mentoringCase.update({
      where: { id: caseId },
      data: { status, closedAt: status === "CLOSED" ? new Date() : null },
    });
    await writeCaseRecords(transaction, {
      schoolId: access.schoolId,
      actorUserId: actor.userId,
      caseId,
      action: "MENTOR_CASE_STATUS_UPDATED",
      payload: { fromStatus: current.status, toStatus: status },
    });
  });
}

export async function addMentoringGoal(
  actor: AuthorizationContext,
  caseId: string,
  input: Readonly<{
    title: string;
    description?: string;
    targetAt?: Date;
    progressPercent?: number;
  }>,
): Promise<string> {
  const access = await requireWritableCase(actor, caseId);
  if (
    input.title.trim().length < 3 ||
    input.title.trim().length > 180 ||
    (input.description?.trim().length ?? 0) > 1_000 ||
    (input.progressPercent ?? 0) < 0 ||
    (input.progressPercent ?? 0) > 100
  ) {
    throw new CaseValidationError("Mục tiêu chưa hợp lệ.");
  }
  return db.$transaction(async (transaction) => {
    const goal = await transaction.mentoringGoal.create({
      data: {
        caseId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        targetAt: input.targetAt ?? null,
        progressPercent: input.progressPercent ?? 0,
        createdByUserId: actor.userId,
      },
      select: { id: true },
    });
    await writeCaseRecords(transaction, {
      schoolId: access.schoolId,
      actorUserId: actor.userId,
      caseId,
      action: "MENTOR_GOAL_CREATED",
      payload: { goalId: goal.id },
    });
    return goal.id;
  });
}

export async function addMentoringTask(
  actor: AuthorizationContext,
  caseId: string,
  input: Readonly<{
    assigneeUserId: string;
    title: string;
    description?: string;
    dueAt?: Date;
  }>,
): Promise<string> {
  const access = await requireWritableCase(actor, caseId);
  if (
    input.title.trim().length < 3 ||
    input.title.trim().length > 180 ||
    (input.description?.trim().length ?? 0) > 1_000
  ) {
    throw new CaseValidationError("Công việc chưa hợp lệ.");
  }
  const assignee = await db.schoolMembership.findFirst({
    where: {
      schoolId: access.schoolId,
      userId: input.assigneeUserId,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (!assignee) throw new CaseValidationError("Người nhận việc không hợp lệ.");

  return db.$transaction(async (transaction) => {
    const task = await transaction.mentoringTask.create({
      data: {
        schoolId: access.schoolId,
        caseId,
        assigneeUserId: input.assigneeUserId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        dueAt: input.dueAt ?? null,
        createdByUserId: actor.userId,
      },
      select: { id: true },
    });
    await writeCaseRecords(transaction, {
      schoolId: access.schoolId,
      actorUserId: actor.userId,
      caseId,
      action: "MENTOR_TASK_CREATED",
      payload: { taskId: task.id },
    });
    return task.id;
  });
}

export async function addMentoringReferral(
  actor: AuthorizationContext,
  caseId: string,
  input: Readonly<{ destination: string; reason: string }>,
): Promise<string> {
  const access = await requireWritableCase(actor, caseId);
  if (
    input.destination.trim().length < 2 ||
    input.destination.trim().length > 180 ||
    input.reason.trim().length < 3 ||
    input.reason.trim().length > 1_000
  ) {
    throw new CaseValidationError("Thông tin giới thiệu chưa hợp lệ.");
  }
  return db.$transaction(async (transaction) => {
    const referral = await transaction.mentoringReferral.create({
      data: {
        schoolId: access.schoolId,
        caseId,
        studentUserId: access.studentUserId,
        destination: input.destination.trim(),
        reason: input.reason.trim(),
        createdByUserId: actor.userId,
      },
      select: { id: true },
    });
    await writeCaseRecords(transaction, {
      schoolId: access.schoolId,
      actorUserId: actor.userId,
      caseId,
      action: "MENTOR_REFERRAL_CREATED",
      payload: { referralId: referral.id },
    });
    return referral.id;
  });
}

export async function addMentoringNote(
  actor: AuthorizationContext,
  caseId: string,
  input: Readonly<{
    visibility: MentoringNoteVisibility;
    body: string;
    appointmentId?: string;
  }>,
): Promise<string> {
  const access = await requireWritableCase(actor, caseId);
  if (
    !mentoringNoteVisibilities.includes(input.visibility) ||
    input.body.trim().length < 2 ||
    input.body.trim().length > 10_000 ||
    !actor.schoolRoles.some((role) =>
      ["MENTOR_COUNSELOR", "TEACHER_STAFF", "SCHOOL_ADMIN"].includes(role),
    )
  ) {
    throw new CaseValidationError("Ghi chú chưa hợp lệ hoặc bạn không thể ghi chú.");
  }
  if (
    input.visibility !== "PRIVATE_COUNSELOR" &&
    !actor.schoolRoles.includes("MENTOR_COUNSELOR") &&
    !actor.schoolRoles.includes("TEACHER_STAFF")
  ) {
    throw new CaseValidationError("Quyền hiển thị ghi chú chưa được cấp.");
  }
  return db.$transaction(async (transaction) => {
    if (input.appointmentId) {
      const appointment = await transaction.appointment.findFirst({
        where: {
          id: input.appointmentId,
          schoolId: access.schoolId,
          studentUserId: access.studentUserId,
        },
        select: { id: true },
      });
      if (!appointment) throw new CaseValidationError("Buổi gặp không hợp lệ.");
    }
    const note = await transaction.mentoringNote.create({
      data: {
        schoolId: access.schoolId,
        caseId,
        appointmentId: input.appointmentId ?? null,
        studentUserId: access.studentUserId,
        authorUserId: actor.userId,
        visibility: input.visibility,
        encryptedBody: encryptMentoringNote(input.body.trim(), env.AUTH_SECRET),
      },
      select: { id: true },
    });
    await writeCaseRecords(transaction, {
      schoolId: access.schoolId,
      actorUserId: actor.userId,
      caseId,
      action: "MENTOR_NOTE_CREATED",
      payload: { noteId: note.id, visibility: input.visibility },
    });
    return note.id;
  });
}

export async function addMentoringSessionOutcome(
  actor: AuthorizationContext,
  caseId: string,
  input: Readonly<{
    appointmentId: string;
    summary: string;
    progress?: string;
    nextSteps?: string;
  }>,
): Promise<string> {
  const access = await requireWritableCase(actor, caseId);
  if (
    input.summary.trim().length < 3 ||
    input.summary.trim().length > 2_000 ||
    (input.progress?.trim().length ?? 0) > 1_000 ||
    (input.nextSteps?.trim().length ?? 0) > 1_000
  ) {
    throw new CaseValidationError("Kết quả buổi gặp chưa hợp lệ.");
  }
  return db.$transaction(async (transaction) => {
    const appointment = await transaction.appointment.findFirst({
      where: {
        id: input.appointmentId,
        schoolId: access.schoolId,
        studentUserId: access.studentUserId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      select: { id: true },
    });
    if (!appointment) throw new CaseValidationError("Buổi gặp không hợp lệ.");
    const outcome = await transaction.mentoringSessionOutcome.upsert({
      where: { appointmentId: appointment.id },
      create: {
        caseId,
        appointmentId: appointment.id,
        summary: input.summary.trim(),
        progress: input.progress?.trim() || null,
        nextSteps: input.nextSteps?.trim() || null,
        completedByUserId: actor.userId,
      },
      update: {
        summary: input.summary.trim(),
        progress: input.progress?.trim() || null,
        nextSteps: input.nextSteps?.trim() || null,
        completedByUserId: actor.userId,
      },
      select: { id: true },
    });
    await writeCaseRecords(transaction, {
      schoolId: access.schoolId,
      actorUserId: actor.userId,
      caseId,
      action: "MENTOR_SESSION_OUTCOME_SAVED",
      payload: { outcomeId: outcome.id, appointmentId: appointment.id },
    });
    return outcome.id;
  });
}
