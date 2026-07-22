"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { authenticateCredentials } from "@/lib/auth/credentials";
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

  const user = await authenticateCredentials({ email, password });

  if (!user) {
    const query = new URLSearchParams({ error: "invalid" });
    if (returnTo) {
      query.set("returnTo", returnTo);
    }
    redirect(`/login?${query.toString()}`);
  }

  const createdSession = await createDatabaseSession(user.id);
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

  redirect(returnTo ?? getAuthenticatedLandingPath(session));
}