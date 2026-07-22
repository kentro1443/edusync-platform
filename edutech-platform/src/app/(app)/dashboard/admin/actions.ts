"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  AdminValidationError,
  createParentStudentLink,
  revokeParentStudentLink,
  setMembershipRoles,
  setMembershipStatus,
  updateSchoolSettings,
} from "@/lib/admin/school-admin";
import { requireSchoolContext } from "@/lib/auth/guards";
import {
  createSchoolInvitation,
  resendSchoolInvitation,
  revokeSchoolInvitation,
} from "@/lib/auth/invitation";
import { permissions } from "@/lib/auth/permissions";

export async function inviteMemberAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.schoolUserInvite);
  const result = await createSchoolInvitation(actor, {
    email: formData.get("email"),
    roles: formData.getAll("roles"),
  });
  const status = result.success ? "invited" : result.error;
  redirect(`/dashboard/admin/members?result=${status}`);
}

export async function resendInvitationAction(formData: FormData): Promise<void> {
  const { actor } = await requireSchoolContext(permissions.schoolUserInvite);
  await resendSchoolInvitation(actor, String(formData.get("invitationId") ?? ""));
  revalidatePath("/dashboard/admin/members");
}

export async function revokeInvitationAction(formData: FormData): Promise<void> {
  const { actor } = await requireSchoolContext(permissions.schoolUserInvite);
  await revokeSchoolInvitation(actor, String(formData.get("invitationId") ?? ""));
  revalidatePath("/dashboard/admin/members");
}

export async function updateRolesAction(formData: FormData): Promise<void> {
  const { actor } = await requireSchoolContext(permissions.schoolRoleAssign);
  await setMembershipRoles(actor, String(formData.get("membershipId") ?? ""), formData.getAll("roles"));
  revalidatePath("/dashboard/admin/members");
}

export async function suspendMembershipAction(formData: FormData): Promise<void> {
  const { actor } = await requireSchoolContext(permissions.schoolUserSuspend);
  await setMembershipStatus(actor, String(formData.get("membershipId") ?? ""), "SUSPENDED");
  revalidatePath("/dashboard/admin/members");
}

export async function reactivateMembershipAction(formData: FormData): Promise<void> {
  const { actor } = await requireSchoolContext(permissions.schoolUserSuspend);
  await setMembershipStatus(actor, String(formData.get("membershipId") ?? ""), "ACTIVE");
  revalidatePath("/dashboard/admin/members");
}

export async function createParentLinkAction(formData: FormData): Promise<void> {
  const { actor } = await requireSchoolContext(permissions.schoolUserUpdate);
  await createParentStudentLink(actor, {
    parentUserId: String(formData.get("parentUserId") ?? ""),
    studentUserId: String(formData.get("studentUserId") ?? ""),
    relationshipType: String(formData.get("relationshipType") ?? "Phụ huynh"),
  });
  revalidatePath("/dashboard/admin/members");
}

export async function revokeParentLinkAction(formData: FormData): Promise<void> {
  const { actor } = await requireSchoolContext(permissions.schoolUserUpdate);
  await revokeParentStudentLink(actor, String(formData.get("linkId") ?? ""));
  revalidatePath("/dashboard/admin/members");
}

export async function updateSchoolSettingsAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.schoolSettingsUpdate);
  try {
    await updateSchoolSettings(actor, {
      name: formData.get("name"),
      shortName: formData.get("shortName"),
      contactEmail: formData.get("contactEmail"),
    });
  } catch (error) {
    if (error instanceof AdminValidationError) {
      redirect("/dashboard/admin/settings?error=invalid");
    }
    throw error;
  }
  redirect("/dashboard/admin/settings?saved=1");
}
