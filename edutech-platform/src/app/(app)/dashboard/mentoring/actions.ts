"use server";

import { redirect } from "next/navigation";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import {
  addMentoringGoal,
  addMentoringNote,
  addMentoringReferral,
  addMentoringSessionOutcome,
  addMentoringTask,
  updateMentoringCaseStatus,
} from "@/lib/mentoring/case-mutations";
import {
  BookingAuthorizationError,
  BookingConflictError,
  BookingValidationError,
  createAppointmentBooking,
  recordAppointmentAttendance,
  transitionAppointmentBooking,
} from "@/lib/mentoring/booking-service";
import { db } from "@/lib/db";
import { CaseAuthorizationError, CaseValidationError, createMentoringCase } from "@/lib/mentoring/case-service";

function stringValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectError(path: string, error: unknown): never {
  if (
    error instanceof BookingConflictError ||
    error instanceof BookingValidationError ||
    error instanceof BookingAuthorizationError
  ) {
    redirect(`${path}?error=${error instanceof BookingConflictError ? "conflict" : "invalid"}`);
  }
  if (error instanceof CaseAuthorizationError) redirect(`${path}?error=forbidden`);
  if (error instanceof CaseValidationError) redirect(`${path}?error=invalid`);
  throw error;
}

export async function createBookingAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.mentorAppointmentCreate);
  const mentorProfileId = stringValue(formData, "mentorProfileId");
  const appointmentTypeId = stringValue(formData, "appointmentTypeId");
  const studentUserId = stringValue(formData, "studentUserId") || actor.userId;
  const startsAt = new Date(stringValue(formData, "startsAt"));
  try {
    await createAppointmentBooking(actor, {
      mentorProfileId,
      appointmentTypeId,
      studentUserId,
      startsAt,
      timezone: stringValue(formData, "timezone") || "Asia/Ho_Chi_Minh",
      studentMessage: stringValue(formData, "studentMessage"),
      joinWaitlistOnConflict: formData.get("joinWaitlistOnConflict") === "on",
    });
  } catch (error) {
    redirectError(`/dashboard/mentoring/mentors/${mentorProfileId}`, error);
  }
  redirect("/dashboard/appointments?result=booked");
}

export async function transitionAppointmentAction(formData: FormData): Promise<never> {
  const appointmentId = stringValue(formData, "appointmentId");
  const action = stringValue(formData, "action") as
    | "APPROVE"
    | "DECLINE"
    | "RESCHEDULE"
    | "CANCEL"
    | "COMPLETE";
  try {
    await transitionAppointmentBooking(
      (await requireSchoolContext(
        action === "APPROVE" || action === "DECLINE"
          ? permissions.mentorAppointmentApprove
          : action === "COMPLETE"
            ? permissions.mentorSessionConduct
            : action === "RESCHEDULE"
              ? permissions.mentorAppointmentReschedule
              : permissions.mentorAppointmentCancel,
      )).actor,
      appointmentId,
      {
        action,
        reason: stringValue(formData, "reason"),
        startsAt: formData.get("startsAt")
          ? new Date(stringValue(formData, "startsAt"))
          : undefined,
      },
    );
  } catch (error) {
    redirectError(`/dashboard/appointments/${appointmentId}`, error);
  }
  redirect(`/dashboard/appointments/${appointmentId}?result=${action.toLowerCase()}`);
}

export async function attendanceAction(formData: FormData): Promise<never> {
  const appointmentId = stringValue(formData, "appointmentId");
  try {
    const { actor } = await requireSchoolContext(permissions.mentorSessionConduct);
    await recordAppointmentAttendance(actor, appointmentId, {
      userId: stringValue(formData, "userId"),
      status: stringValue(formData, "status") as "PRESENT" | "ABSENT" | "EXCUSED",
      note: stringValue(formData, "note"),
    });
  } catch (error) {
    redirectError(`/dashboard/appointments/${appointmentId}`, error);
  }
  redirect(`/dashboard/appointments/${appointmentId}?result=attendance`);
}

export async function createCaseAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.mentorAppointmentApprove);
  try {
    const caseId = await createMentoringCase(actor, {
      studentUserId: stringValue(formData, "studentUserId"),
      mentorProfileId: stringValue(formData, "mentorProfileId"),
      title: stringValue(formData, "title"),
      summary: stringValue(formData, "summary"),
      priority: stringValue(formData, "priority"),
    });
    redirect(`/dashboard/mentoring/cases/${caseId}?result=created`);
  } catch (error) {
    redirectError("/dashboard/mentoring/cases", error);
  }
}

export async function caseStatusAction(formData: FormData): Promise<never> {
  const caseId = stringValue(formData, "caseId");
  try {
    const { actor } = await requireSchoolContext(permissions.mentorAppointmentRead);
    await updateMentoringCaseStatus(
      actor,
      caseId,
      stringValue(formData, "status") as "OPEN" | "ON_HOLD" | "CLOSED",
    );
  } catch (error) {
    redirectError(`/dashboard/mentoring/cases/${caseId}`, error);
  }
  redirect(`/dashboard/mentoring/cases/${caseId}?result=status`);
}

export async function goalAction(formData: FormData): Promise<never> {
  const caseId = stringValue(formData, "caseId");
  try {
    const { actor } = await requireSchoolContext(permissions.mentorAppointmentRead);
    await addMentoringGoal(actor, caseId, {
      title: stringValue(formData, "title"),
      description: stringValue(formData, "description"),
      progressPercent: Number(stringValue(formData, "progressPercent") || 0),
    });
  } catch (error) {
    redirectError(`/dashboard/mentoring/cases/${caseId}`, error);
  }
  redirect(`/dashboard/mentoring/cases/${caseId}?result=goal`);
}

export async function taskAction(formData: FormData): Promise<never> {
  const caseId = stringValue(formData, "caseId");
  try {
    const { actor } = await requireSchoolContext(permissions.mentorAppointmentRead);
    await addMentoringTask(actor, caseId, {
      assigneeUserId: stringValue(formData, "assigneeUserId"),
      title: stringValue(formData, "title"),
      description: stringValue(formData, "description"),
    });
  } catch (error) {
    redirectError(`/dashboard/mentoring/cases/${caseId}`, error);
  }
  redirect(`/dashboard/mentoring/cases/${caseId}?result=task`);
}

export async function referralAction(formData: FormData): Promise<never> {
  const caseId = stringValue(formData, "caseId");
  try {
    const { actor } = await requireSchoolContext(permissions.mentorAppointmentRead);
    await addMentoringReferral(actor, caseId, {
      destination: stringValue(formData, "destination"),
      reason: stringValue(formData, "reason"),
    });
  } catch (error) {
    redirectError(`/dashboard/mentoring/cases/${caseId}`, error);
  }
  redirect(`/dashboard/mentoring/cases/${caseId}?result=referral`);
}

export async function noteAction(formData: FormData): Promise<never> {
  const caseId = stringValue(formData, "caseId");
  try {
    const { actor } = await requireSchoolContext(permissions.mentorAppointmentRead);
    await addMentoringNote(actor, caseId, {
      visibility: stringValue(formData, "visibility") as
        | "PRIVATE_COUNSELOR"
        | "STUDENT_VISIBLE"
        | "GUARDIAN_VISIBLE"
        | "STAFF_VISIBLE",
      body: stringValue(formData, "body"),
      appointmentId: stringValue(formData, "appointmentId") || undefined,
    });
  } catch (error) {
    redirectError(`/dashboard/mentoring/cases/${caseId}`, error);
  }
  redirect(`/dashboard/mentoring/cases/${caseId}?result=note`);
}

export async function outcomeAction(formData: FormData): Promise<never> {
  const caseId = stringValue(formData, "caseId");
  try {
    const { actor } = await requireSchoolContext(permissions.mentorSessionConduct);
    await addMentoringSessionOutcome(actor, caseId, {
      appointmentId: stringValue(formData, "appointmentId"),
      summary: stringValue(formData, "summary"),
      progress: stringValue(formData, "progress"),
      nextSteps: stringValue(formData, "nextSteps"),
    });
  } catch (error) {
    redirectError(`/dashboard/mentoring/cases/${caseId}`, error);
  }
  redirect(`/dashboard/mentoring/cases/${caseId}?result=outcome`);
}

export async function addAvailabilityRuleAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.mentorAvailabilityManage);
  if (!actor.schoolId) redirect("/membership-inactive");
  const schoolId = actor.schoolId;
  const mentorProfileId = stringValue(formData, "mentorProfileId");
  try {
    const profile = await db.mentorProfile.findFirst({
      where: {
        id: mentorProfileId,
        schoolId,
        ...(actor.schoolRoles.includes("MENTOR_COUNSELOR")
          ? { userId: actor.userId }
          : {}),
      },
      select: { id: true },
    });
    if (!profile) throw new BookingAuthorizationError("Hồ sơ cố vấn không hợp lệ.");
    await db.mentorAvailabilityRule.create({
      data: {
        mentorProfileId,
        weekday: Number(stringValue(formData, "weekday")),
        startsAtLocal: stringValue(formData, "startsAtLocal"),
        endsAtLocal: stringValue(formData, "endsAtLocal"),
        timezone: stringValue(formData, "timezone") || "Asia/Ho_Chi_Minh",
        capacity: Number(stringValue(formData, "capacity") || 1),
      },
    });
  } catch (error) {
    redirectError(`/dashboard/mentoring/availability?mentor=${mentorProfileId}`, error);
  }
  redirect(`/dashboard/mentoring/availability?mentor=${mentorProfileId}&result=rule`);
}

export async function addAvailabilityExceptionAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.mentorAvailabilityManage);
  if (!actor.schoolId) redirect("/membership-inactive");
  const schoolId = actor.schoolId;
  const mentorProfileId = stringValue(formData, "mentorProfileId");
  try {
    const profile = await db.mentorProfile.findFirst({
      where: {
        id: mentorProfileId,
        schoolId,
        ...(actor.schoolRoles.includes("MENTOR_COUNSELOR")
          ? { userId: actor.userId }
          : {}),
      },
      select: { id: true },
    });
    if (!profile) throw new BookingAuthorizationError("Hồ sơ cố vấn không hợp lệ.");
    const startsAt = new Date(stringValue(formData, "startsAt"));
    const endsAt = new Date(stringValue(formData, "endsAt"));
    if (endsAt <= startsAt) throw new BookingValidationError("Khoảng nghỉ không hợp lệ.");
    await db.mentorAvailabilityException.create({
      data: {
        mentorProfileId,
        startsAt,
        endsAt,
        kind: "UNAVAILABLE",
        reason: stringValue(formData, "reason"),
      },
    });
  } catch (error) {
    redirectError(`/dashboard/mentoring/availability?mentor=${mentorProfileId}`, error);
  }
  redirect(`/dashboard/mentoring/availability?mentor=${mentorProfileId}&result=exception`);
}
