"use server";

import { redirect } from "next/navigation";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import {
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreference,
} from "@/lib/collaboration/collaboration-service";

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

export async function markNotificationReadAction(formData: FormData): Promise<never> {
  const notificationId = value(formData, "notificationId");
  const href = value(formData, "href");
  const { actor } = await requireSchoolContext(permissions.notificationReadOwn);
  try {
    await markNotificationRead(actor, notificationId);
  } catch {
    redirect("/dashboard/notifications?error=read");
  }
  redirect(href.startsWith("/dashboard/") ? href : "/dashboard/notifications?result=read");
}

export async function markAllNotificationsReadAction(): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.notificationReadOwn);
  try {
    await markAllNotificationsRead(actor);
  } catch {
    redirect("/dashboard/notifications?error=mark-all");
  }
  redirect("/dashboard/notifications?result=read-all");
}

export async function updateNotificationPreferenceAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(
    permissions.notificationPreferencesUpdateOwn,
  );
  try {
    await updateNotificationPreference(actor, {
      inAppEnabled: formData.get("inAppEnabled") === "on",
      emailEnabled: formData.get("emailEnabled") === "on",
      messagesEnabled: formData.get("messagesEnabled") === "on",
      mentionsEnabled: formData.get("mentionsEnabled") === "on",
    });
  } catch {
    redirect("/dashboard/notifications?error=preference");
  }
  redirect("/dashboard/notifications?result=preference");
}
