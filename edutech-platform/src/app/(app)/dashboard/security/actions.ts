"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditEvent } from "@/lib/audit";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import {
  revokeAllUserSessions,
  revokeOtherUserSessions,
  revokeUserSessionById,
  sessionCookieName,
} from "@/lib/auth/session";

export async function revokeOtherSessionsAction(): Promise<void> {
  const session = await requireAuthenticatedSession("/dashboard/security");
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (token) await revokeOtherUserSessions(session.user.id, token);
  await writeAuditEvent({ actorUserId: session.user.id, action: "AUTH_SESSIONS_OTHER_REVOKED", entityType: "User", entityId: session.user.id });
  revalidatePath("/dashboard/security");
}

export async function revokeSessionAction(formData: FormData): Promise<void> {
  const session = await requireAuthenticatedSession("/dashboard/security");
  const sessionId = String(formData.get("sessionId") ?? "");
  if (sessionId && sessionId !== session.sessionId) {
    const revoked = await revokeUserSessionById(session.user.id, sessionId);
    if (revoked) await writeAuditEvent({ actorUserId: session.user.id, action: "AUTH_SESSION_REVOKED", entityType: "Session", entityId: sessionId });
  }
  revalidatePath("/dashboard/security");
}

export async function revokeAllSessionsAction(): Promise<never> {
  const session = await requireAuthenticatedSession("/dashboard/security");
  await revokeAllUserSessions(session.user.id, "USER_REVOKE_ALL");
  await writeAuditEvent({ actorUserId: session.user.id, action: "AUTH_SESSIONS_ALL_REVOKED", entityType: "User", entityId: session.user.id });
  (await cookies()).delete(sessionCookieName);
  redirect("/login?revoked=1");
}
