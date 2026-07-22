"use server";

import { redirect } from "next/navigation";

import { normalizeEmail } from "@/lib/auth/password";
import { requestPasswordReset } from "@/lib/auth/password-reset";
import { getRequestMetadata } from "@/lib/auth/request-metadata";

export async function forgotPasswordAction(formData: FormData): Promise<never> {
  const value = formData.get("email");
  const email = typeof value === "string" ? value : "";
  const metadata = await getRequestMetadata();
  const rateSubject = `${normalizeEmail(email)}:${metadata.ipHash ?? "unknown"}`;
  await requestPasswordReset(email, rateSubject);
  redirect("/quen-mat-khau?sent=1");
}
