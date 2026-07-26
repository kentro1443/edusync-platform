"use server";

import { redirect } from "next/navigation";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import {
  addClubExpense,
  applyToClub,
  approveClubEvent,
  createClub,
  createClubAnnouncement,
  createClubBudget,
  createClubEvent,
  createClubTask,
  decideClubConsent,
  recordClubAttendance,
  registerClubEvent,
  reviewClubApplication,
  setClubMemberRole,
  saveClubSafetyPlan,
  submitClubPostEventReport,
  updateClubTaskStatus,
} from "@/lib/clubs/club-service";

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

export async function createClubAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.clubCreate);
  try {
    await createClub(actor, {
      name: value(formData, "name"),
      description: value(formData, "description"),
      capacity: Number(value(formData, "capacity") || 0) || undefined,
      publish: value(formData, "publish") === "on",
    });
  } catch {
    redirect("/dashboard/clubs-events?error=club");
  }
  redirect("/dashboard/clubs-events?result=club");
}

export async function applyToClubAction(formData: FormData): Promise<never> {
  const clubId = value(formData, "clubId");
  const { actor } = await requireSchoolContext(permissions.clubMembershipApply);
  try {
    await applyToClub(actor, { clubId, motivation: value(formData, "motivation") });
  } catch {
    redirect(`/dashboard/clubs-events/${clubId}?error=application`);
  }
  redirect(`/dashboard/clubs-events/${clubId}?result=application`);
}

export async function reviewClubApplicationAction(formData: FormData): Promise<never> {
  const clubId = value(formData, "clubId");
  const { actor } = await requireSchoolContext(permissions.clubMembershipReview);
  try {
    await reviewClubApplication(actor, {
      applicationId: value(formData, "applicationId"),
      approve: value(formData, "decision") === "approve",
    });
  } catch {
    redirect(`/dashboard/clubs-events/${clubId}?error=review`);
  }
  redirect(`/dashboard/clubs-events/${clubId}?result=review`);
}

export async function createClubEventAction(formData: FormData): Promise<never> {
  const clubId = value(formData, "clubId");
  const { actor } = await requireSchoolContext(permissions.clubEventCreate);
  try {
    await createClubEvent(actor, {
      clubId,
      title: value(formData, "title"),
      description: value(formData, "description"),
      startsAt: new Date(value(formData, "startsAt")),
      endsAt: new Date(value(formData, "endsAt")),
      location: value(formData, "location"),
      capacity: Number(value(formData, "capacity") || 0),
      submitForApproval: value(formData, "submitForApproval") === "on",
    });
  } catch {
    redirect(`/dashboard/clubs-events/${clubId}?error=event`);
  }
  redirect(`/dashboard/clubs-events/${clubId}?result=event`);
}

export async function approveClubEventAction(formData: FormData): Promise<never> {
  const clubId = value(formData, "clubId");
  const { actor } = await requireSchoolContext(permissions.clubEventApprove);
  try {
    await approveClubEvent(actor, {
      eventId: value(formData, "eventId"),
      approve: value(formData, "decision") === "approve",
    });
  } catch {
    redirect(`/dashboard/clubs-events/${clubId}?error=event-review`);
  }
  redirect(`/dashboard/clubs-events/${clubId}?result=event-review`);
}

export async function registerClubEventAction(formData: FormData): Promise<never> {
  const clubId = value(formData, "clubId");
  const { actor } = await requireSchoolContext(permissions.clubEventRegister);
  try {
    await registerClubEvent(actor, value(formData, "eventId"));
  } catch {
    redirect(`/dashboard/clubs-events/${clubId}?error=registration`);
  }
  redirect(`/dashboard/clubs-events/${clubId}?result=registration`);
}

export async function decideClubConsentAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.clubEventRegister);
  try {
    await decideClubConsent(actor, {
      consentId: value(formData, "consentId"),
      status: value(formData, "decision") === "approve" ? "APPROVED" : "DECLINED",
    });
  } catch {
    redirect(`/dashboard/clubs-events?error=consent`);
  }
  redirect(`/dashboard/clubs-events?result=consent`);
}

export async function recordClubAttendanceAction(formData: FormData): Promise<never> {
  const eventId = value(formData, "eventId");
  const { actor } = await requireSchoolContext(permissions.clubEventAttendance);
  try {
    await recordClubAttendance(actor, {
      eventId,
      userId: value(formData, "userId"),
      status: value(formData, "status") as "PRESENT" | "ABSENT" | "EXCUSED",
      note: value(formData, "note"),
    });
  } catch {
    redirect(`/dashboard/clubs-events?error=attendance`);
  }
  redirect(`/dashboard/clubs-events?result=attendance`);
}

export async function createClubAnnouncementAction(formData: FormData): Promise<never> {
  const clubId = value(formData, "clubId");
  const { actor } = await requireSchoolContext(permissions.clubAnnouncementCreate);
  try {
    await createClubAnnouncement(actor, {
      clubId,
      title: value(formData, "title"),
      body: value(formData, "body"),
    });
  } catch {
    redirect(`/dashboard/clubs-events/${clubId}?error=announcement`);
  }
  redirect(`/dashboard/clubs-events/${clubId}?result=announcement`);
}

export async function createClubTaskAction(formData: FormData): Promise<never> {
  const clubId = value(formData, "clubId");
  const { actor } = await requireSchoolContext(permissions.clubRead);
  try {
    await createClubTask(actor, {
      clubId,
      title: value(formData, "title"),
      description: value(formData, "description"),
      assigneeUserId: value(formData, "assigneeUserId") || undefined,
      dueAt: value(formData, "dueAt") ? new Date(value(formData, "dueAt")) : undefined,
    });
  } catch {
    redirect(`/dashboard/clubs-events/${clubId}?error=task`);
  }
  redirect(`/dashboard/clubs-events/${clubId}?result=task`);
}

export async function updateClubTaskStatusAction(formData: FormData): Promise<never> {
  const clubId = value(formData, "clubId");
  const { actor } = await requireSchoolContext(permissions.clubRead);
  try {
    await updateClubTaskStatus(actor, {
      taskId: value(formData, "taskId"),
      status: value(formData, "status") as "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED",
    });
  } catch {
    redirect(`/dashboard/clubs-events/${clubId}?error=task`);
  }
  redirect(`/dashboard/clubs-events/${clubId}?result=task`);
}

export async function createClubBudgetAction(formData: FormData): Promise<never> {
  const clubId = value(formData, "clubId");
  const { actor } = await requireSchoolContext(permissions.clubBudgetSubmit);
  try {
    await createClubBudget(actor, {
      clubId,
      name: value(formData, "name"),
      amount: Number(value(formData, "amount").replace(/[^\d]/g, "") || 0),
    });
  } catch {
    redirect(`/dashboard/clubs-events/${clubId}?error=budget`);
  }
  redirect(`/dashboard/clubs-events/${clubId}?result=budget`);
}

export async function addClubExpenseAction(formData: FormData): Promise<never> {
  const clubId = value(formData, "clubId");
  const { actor } = await requireSchoolContext(permissions.clubBudgetSubmit);
  try {
    await addClubExpense(actor, {
      budgetId: value(formData, "budgetId"),
      description: value(formData, "description"),
      amount: Number(value(formData, "amount").replace(/[^\d]/g, "") || 0),
      spentAt: value(formData, "spentAt") ? new Date(value(formData, "spentAt")) : new Date(),
    });
  } catch {
    redirect(`/dashboard/clubs-events/${clubId}?error=expense`);
  }
  redirect(`/dashboard/clubs-events/${clubId}?result=expense`);
}

export async function saveClubSafetyPlanAction(formData: FormData): Promise<never> {
  const clubId = value(formData, "clubId");
  const { actor } = await requireSchoolContext(permissions.clubEventCreate);
  try {
    await saveClubSafetyPlan(actor, {
      eventId: value(formData, "eventId"),
      details: value(formData, "details"),
    });
  } catch {
    redirect(`/dashboard/clubs-events/${clubId}?error=safety`);
  }
  redirect(`/dashboard/clubs-events/${clubId}?result=safety`);
}

export async function submitClubReportAction(formData: FormData): Promise<never> {
  const clubId = value(formData, "clubId");
  const { actor } = await requireSchoolContext(permissions.clubReportSubmit);
  try {
    await submitClubPostEventReport(actor, {
      eventId: value(formData, "eventId"),
      summary: value(formData, "summary"),
    });
  } catch {
    redirect(`/dashboard/clubs-events/${clubId}?error=report`);
  }
  redirect(`/dashboard/clubs-events/${clubId}?result=report`);
}

export async function setClubMemberRoleAction(formData: FormData): Promise<never> {
  const clubId = value(formData, "clubId");
  const { actor } = await requireSchoolContext(permissions.clubMembershipManage);
  try {
    await setClubMemberRole(actor, {
      clubId,
      userId: value(formData, "userId"),
      role: value(formData, "role") === "LEADER" ? "LEADER" : "MEMBER",
    });
  } catch {
    redirect(`/dashboard/clubs-events/${clubId}?error=role`);
  }
  redirect(`/dashboard/clubs-events/${clubId}?result=role`);
}
