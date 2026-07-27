"use server";

import { redirect } from "next/navigation";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import {
  addResourceComment,
  createResource,
  createResourceVersion,
  deleteResource,
  addResourceToCollection,
  createResourceCollection,
  rollbackResourceVersion,
  reportResource,
  ResourceAuthorizationError,
  ResourceNotFoundError,
  toggleResourceBookmark,
  transitionResource,
} from "@/lib/resources/resource-service";
import { ResourceValidationError } from "@/lib/resources/resource-domain";

function value(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function withError(path: string, error: unknown): never {
  if (error instanceof ResourceAuthorizationError) redirect(`${path}?error=forbidden`);
  if (error instanceof ResourceNotFoundError) redirect(`${path}?error=not-found`);
  if (error instanceof ResourceValidationError) redirect(`${path}?error=invalid`);
  throw error;
}

export async function createResourceAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.resourceCreate);
  try {
    const resourceId = await createResource(actor, {
      title: value(formData, "title"),
      summary: value(formData, "summary"),
      body: value(formData, "body"),
      visibility: (value(formData, "visibility") || "SCHOOL") as "PRIVATE" | "SCHOOL" | "PUBLIC",
    });
    redirect(`/dashboard/resources/${resourceId}?result=created`);
  } catch (error) {
    withError("/dashboard/resources/new", error);
  }
}

export async function transitionResourceAction(formData: FormData): Promise<never> {
  const resourceId = value(formData, "resourceId");
  const action = value(formData, "action") as "SUBMIT_REVIEW" | "APPROVE" | "REJECT" | "ARCHIVE" | "RESTORE";
  try {
    const permission =
      action === "SUBMIT_REVIEW"
        ? permissions.resourceSubmitReview
        : action === "APPROVE"
          ? permissions.resourceApprove
          : action === "REJECT"
            ? permissions.resourceReject
            : permissions.resourceUpdate;
    const { actor } = await requireSchoolContext(permission);
    await transitionResource(
      actor,
      resourceId,
      action,
      value(formData, "reason"),
    );
    redirect(`/dashboard/resources/${resourceId}?result=transitioned`);
  } catch (error) {
    withError(`/dashboard/resources/${resourceId}`, error);
  }
}

export async function deleteResourceAction(formData: FormData): Promise<never> {
  const resourceId = value(formData, "resourceId");
  try {
    const { actor } = await requireSchoolContext(permissions.resourceDelete);
    await deleteResource(actor, resourceId);
    redirect("/dashboard/resources?result=deleted");
  } catch (error) {
    withError(`/dashboard/resources/${resourceId}`, error);
  }
}

export async function createResourceVersionAction(formData: FormData): Promise<never> {
  const resourceId = value(formData, "resourceId");
  try {
    const { actor } = await requireSchoolContext(permissions.resourceVersionCreate);
    const file = formData.get("file");
    const upload =
      file instanceof File && file.size > 0
        ? {
            originalName: file.name,
            mimeType: file.type || "application/octet-stream",
            content: new Uint8Array(await file.arrayBuffer()),
          }
        : undefined;
    await createResourceVersion(actor, resourceId, {
      title: value(formData, "title"),
      summary: value(formData, "summary"),
      body: value(formData, "body"),
      file: upload,
    });
    redirect(`/dashboard/resources/${resourceId}?result=version`);
  } catch (error) {
    withError(`/dashboard/resources/${resourceId}`, error);
  }
}

export async function rollbackResourceVersionAction(formData: FormData): Promise<never> {
  const resourceId = value(formData, "resourceId");
  try {
    const { actor } = await requireSchoolContext(permissions.resourceVersionRollback);
    await rollbackResourceVersion(actor, resourceId, value(formData, "versionId"));
    redirect(`/dashboard/resources/${resourceId}?result=rollback`);
  } catch (error) {
    withError(`/dashboard/resources/${resourceId}`, error);
  }
}

export async function resourceCommentAction(formData: FormData): Promise<never> {
  const resourceId = value(formData, "resourceId");
  try {
    const { actor } = await requireSchoolContext(permissions.resourceCommentCreate);
    await addResourceComment(actor, resourceId, value(formData, "body"));
    redirect(`/dashboard/resources/${resourceId}?result=comment`);
  } catch (error) {
    withError(`/dashboard/resources/${resourceId}`, error);
  }
}

export async function resourceReportAction(formData: FormData): Promise<never> {
  const resourceId = value(formData, "resourceId");
  try {
    const { actor } = await requireSchoolContext(permissions.resourceReportCreate);
    await reportResource(actor, resourceId, value(formData, "reason"));
    redirect(`/dashboard/resources/${resourceId}?result=reported`);
  } catch (error) {
    withError(`/dashboard/resources/${resourceId}`, error);
  }
}

export async function resourceBookmarkAction(formData: FormData): Promise<never> {
  const resourceId = value(formData, "resourceId");
  try {
    const { actor } = await requireSchoolContext(permissions.resourceRead);
    await toggleResourceBookmark(actor, resourceId);
    redirect(`/dashboard/resources/${resourceId}?result=bookmark`);
  } catch (error) {
    withError(`/dashboard/resources/${resourceId}`, error);
  }
}

export async function createCollectionAction(formData: FormData): Promise<never> {
  try {
    const { actor } = await requireSchoolContext(permissions.resourceRead);
    await createResourceCollection(actor, value(formData, "name"), value(formData, "description"));
    redirect("/dashboard/resources/bookmarks?result=collection");
  } catch (error) {
    withError("/dashboard/resources/bookmarks", error);
  }
}

export async function addToCollectionAction(formData: FormData): Promise<never> {
  const resourceId = value(formData, "resourceId");
  try {
    const { actor } = await requireSchoolContext(permissions.resourceRead);
    await addResourceToCollection(actor, value(formData, "collectionId"), resourceId);
    redirect(`/dashboard/resources/${resourceId}?result=collection`);
  } catch (error) {
    withError(`/dashboard/resources/${resourceId}`, error);
  }
}
