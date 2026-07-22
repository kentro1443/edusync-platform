"use server";

import { redirect } from "next/navigation";

import {
  validatePasswordChange,
  type PasswordChangeError,
} from "@/lib/auth/change-password";
import { getCurrentSession } from "@/lib/auth/current-session";
import { db } from "@/lib/db";
import { getAuthenticatedLandingPath } from "@/lib/auth/navigation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

function redirectWithError(error: PasswordChangeError | "invalid-current"): never {
  const query = new URLSearchParams({ error });
  redirect(`/doi-mat-khau?${query.toString()}`);
}

export async function changePasswordAction(formData: FormData): Promise<never> {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?returnTo=/doi-mat-khau");
  }

  const validation = validatePasswordChange({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validation.success) {
    redirectWithError(validation.error);
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      passwordHash: true,
      mustChangePassword: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const currentPasswordIsValid = await verifyPassword(
    user.passwordHash,
    validation.data.currentPassword,
  );

  if (!currentPasswordIsValid) {
    redirectWithError("invalid-current");
  }

  const passwordHash = await hashPassword(validation.data.newPassword);

  await db.user.update({
    where: { id: session.user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  });

  redirect(
    getAuthenticatedLandingPath({
      ...session,
      user: {
        ...session.user,
        mustChangePassword: false,
      },
    }),
  );
}