"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { activeSchoolCookieName } from "@/lib/auth/cookies";
import { getCurrentSession } from "@/lib/auth/current-session";
import {
  revokeDatabaseSession,
  sessionCookieName,
} from "@/lib/auth/session";

export async function logoutAction(): Promise<never> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    await revokeDatabaseSession(token);
  }

  cookieStore.delete(sessionCookieName);
  cookieStore.delete(activeSchoolCookieName);
  redirect("/login");
}

export async function selectSchoolAction(formData: FormData): Promise<never> {
  const schoolSlug = formData.get("schoolSlug");
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?returnTo=/chon-truong");
  }

  if (
    typeof schoolSlug !== "string" ||
    !session.schoolContexts.some(
      (schoolContext) => schoolContext.schoolSlug === schoolSlug,
    )
  ) {
    redirect("/chon-truong?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set(activeSchoolCookieName, schoolSlug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/dashboard");
}