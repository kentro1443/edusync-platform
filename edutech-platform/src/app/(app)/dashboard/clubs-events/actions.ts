"use server";

import { redirect } from "next/navigation";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import {
  applyToClub,
  approveClubEvent,
  createClub,
  createClubEvent,
  decideClubConsent,
  recordClubAttendance,
  registerClubEvent,
  reviewClubApplication,
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
