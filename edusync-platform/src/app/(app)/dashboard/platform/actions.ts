"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { provisionSchool, setPlatformSchoolStatus } from "@/lib/admin/platform-admin";
import { requirePlatformContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";

export async function provisionSchoolAction(formData: FormData): Promise<never> {
  const { actor } = await requirePlatformContext(permissions.platformSchoolCreate);
  const result = await provisionSchool(actor, {
    name: formData.get("name"),
    shortName: formData.get("shortName"),
    slug: formData.get("slug"),
    adminEmail: formData.get("adminEmail"),
  });
  if (!result.success) redirect(`/dashboard/platform/schools?result=${result.error}`);
  redirect(`/dashboard/platform/schools/${result.schoolId}?created=1`);
}

export async function suspendSchoolAction(formData: FormData): Promise<void> {
  const { actor } = await requirePlatformContext(permissions.platformSchoolSuspend);
  const schoolId = String(formData.get("schoolId") ?? "");
  await setPlatformSchoolStatus(actor, schoolId, "SUSPENDED");
  revalidatePath(`/dashboard/platform/schools/${schoolId}`);
  revalidatePath("/dashboard/platform/schools");
}

export async function restoreSchoolAction(formData: FormData): Promise<void> {
  const { actor } = await requirePlatformContext(permissions.platformSchoolRestore);
  const schoolId = String(formData.get("schoolId") ?? "");
  await setPlatformSchoolStatus(actor, schoolId, "ACTIVE");
  revalidatePath(`/dashboard/platform/schools/${schoolId}`);
  revalidatePath("/dashboard/platform/schools");
}
