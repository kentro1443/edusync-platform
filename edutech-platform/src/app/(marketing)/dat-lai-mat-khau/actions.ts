"use server";

import { redirect } from "next/navigation";

import {
  consumePasswordReset,
  validateResetPassword,
} from "@/lib/auth/password-reset";

export async function resetPasswordAction(formData: FormData): Promise<never> {
  const tokenValue = formData.get("token");
  const token = typeof tokenValue === "string" ? tokenValue : "";
  const validation = validateResetPassword({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!validation.success) {
    const query = new URLSearchParams({ token, error: validation.error });
    redirect(`/dat-lai-mat-khau?${query.toString()}`);
  }
  const consumed = await consumePasswordReset(token, validation.password);
  if (!consumed) {
    redirect("/dat-lai-mat-khau?error=invalid-token");
  }
  redirect("/login?reset=success");
}
