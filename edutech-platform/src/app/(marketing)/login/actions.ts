"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { writeAuditEvent } from "@/lib/audit";
import { authenticateCredentials } from "@/lib/auth/credentials";
import { normalizeEmail } from "@/lib/auth/password";
import { logEvent } from "@/lib/observability/logger";
import {
  authRateLimits,
  checkAuthRateLimit,
  clearAuthRateLimit,
  recordAuthAttempt,
} from "@/lib/auth/rate-limit";
import { getRequestMetadata } from "@/lib/auth/request-metadata";
import {
  getAuthenticatedLandingPath,
  sanitizeReturnPath,
} from "@/lib/auth/navigation";
import {
  createDatabaseSession,
  getDatabaseSession,
  sessionCookieName,
  sessionMaxAgeSeconds,
} from "@/lib/auth/session";

export async function loginAction(formData: FormData): Promise<never> {
  const email = formData.get("email");
  const password = formData.get("password");
  const requestedReturnPath = formData.get("returnTo");

  const returnTo =
    typeof requestedReturnPath === "string"
      ? sanitizeReturnPath(requestedReturnPath)
      : null;

  if (typeof email !== "string" || typeof password !== "string") {
    redirect("/login?error=invalid");
  }

  const metadata = await getRequestMetadata();
  const rateSubject = `${normalizeEmail(email)}:${metadata.ipHash ?? "unknown"}`;
  const rateLimit = await checkAuthRateLimit(
    "login",
    rateSubject,
    authRateLimits.login,
  );
  if (!rateLimit.allowed) {
    logEvent("warn", "auth.login.rate_limited", { ipHash: metadata.ipHash ?? "unknown" });
    redirect("/login?error=rate-limited");
  }

  const user = await authenticateCredentials({ email, password });

  if (!user) {
    await recordAuthAttempt(
      "login",
      rateSubject,
      authRateLimits.login,
    );
    await writeAuditEvent({
      actorType: "SYSTEM",
      action: "AUTH_LOGIN_FAILED",
      entityType: "Authentication",
    });
    const query = new URLSearchParams({ error: "invalid" });
    if (returnTo) {
      query.set("returnTo", returnTo);
    }
    redirect(`/login?${query.toString()}`);
  }

  await clearAuthRateLimit("login", rateSubject);

  const createdSession = await createDatabaseSession(user.id, metadata);
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, createdSession.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
    expires: createdSession.expires,
  });

  const session = await getDatabaseSession(createdSession.token);

  if (!session) {
    cookieStore.delete(sessionCookieName);
    redirect("/login?error=invalid");
  }

  await writeAuditEvent({
    actorUserId: user.id,
    action: "AUTH_LOGIN_SUCCEEDED",
    entityType: "Session",
    entityId: createdSession.id,
  });

  redirect(returnTo ?? getAuthenticatedLandingPath(session));
}
