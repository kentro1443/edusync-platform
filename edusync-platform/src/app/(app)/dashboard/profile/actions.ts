"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditEvent } from "@/lib/audit";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export async function updateProfileAction(formData: FormData): Promise<never> {
  const session = await requireAuthenticatedSession("/dashboard/profile");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const locale = String(formData.get("locale") ?? "vi");
  const timezone = String(formData.get("timezone") ?? "Asia/Ho_Chi_Minh");
  if (displayName.length < 2 || displayName.length > 120 || locale !== "vi" || timezone !== "Asia/Ho_Chi_Minh") {
    redirect("/dashboard/profile?error=invalid");
  }
  await db.user.update({
    where: { id: session.user.id },
    data: { displayName, locale, timezone },
  });
  await writeAuditEvent({
    actorUserId: session.user.id,
    action: "USER_PROFILE_UPDATED",
    entityType: "User",
    entityId: session.user.id,
    after: { displayName, locale, timezone },
  });
  revalidatePath("/dashboard/profile");
  redirect("/dashboard/profile?saved=1");
}
