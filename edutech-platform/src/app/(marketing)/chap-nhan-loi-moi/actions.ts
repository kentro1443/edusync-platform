"use server";

import { redirect } from "next/navigation";

import { acceptSchoolInvitation } from "@/lib/auth/invitation";

export async function acceptInvitationAction(formData: FormData): Promise<never> {
  const token = String(formData.get("token") ?? "");
  const result = await acceptSchoolInvitation(token, {
    displayName: String(formData.get("displayName") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!result.success) {
    const query = new URLSearchParams({ token, error: result.error });
    redirect(`/chap-nhan-loi-moi?${query.toString()}`);
  }
  redirect("/login?invited=1");
}
