"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { activeSchoolCookieName } from "@/lib/auth/cookies";
import { getCurrentSession } from "@/lib/auth/current-session";
import {
  DevSwitchError,
  exitDevSession,
  switchDevSession,
} from "@/lib/auth/dev-switching";
import { sessionMaxAgeSeconds } from "@/lib/auth/session";

const switchInputSchema = z.object({
  targetUserId: z.string().uuid(),
  schoolId: z.string().uuid(),
});

export async function switchDevAccountAction(
  formData: FormData,
): Promise<never> {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login?returnTo=/dev/switch");
  }

  const parsed = switchInputSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    schoolId: formData.get("schoolId"),
  });
  if (!parsed.success) {
    redirect("/dev/switch?error=invalid");
  }

  let schoolSlug: string;
  try {
    ({ schoolSlug } = await switchDevSession(session, parsed.data));
  } catch (error) {
    if (error instanceof DevSwitchError) {
      redirect("/dev/switch?error=invalid");
    }
    throw error;
  }

  const cookieStore = await cookies();
  cookieStore.set(activeSchoolCookieName, schoolSlug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  });
  redirect("/dashboard");
}

export async function exitDevImpersonationAction(): Promise<never> {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login?returnTo=/dev/switch");
  }

  const cookieStore = await cookies();
  const activeSchoolSlug = cookieStore.get(activeSchoolCookieName)?.value;
  const activeSchoolId =
    session.schoolContexts.find(
      ({ schoolSlug }) => schoolSlug === activeSchoolSlug,
    )?.schoolId ?? null;

  try {
    await exitDevSession(session, activeSchoolId);
  } catch (error) {
    if (error instanceof DevSwitchError) {
      redirect("/dev/switch?error=unavailable");
    }
    throw error;
  }

  cookieStore.delete(activeSchoolCookieName);
  redirect("/dev/switch?exited=1");
}
