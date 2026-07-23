import "server-only";

import { randomUUID } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import type { ResourceStatus, ResourceVisibility } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { can, isActiveSchoolContext, type AuthorizationContext } from "@/lib/auth/policies";
import { permissions } from "@/lib/auth/permissions";
import {
  ResourceValidationError,
  transitionResourceStatus,
  validateResourceBody,
  validateResourceTitle,
  validateUploadMetadata,
} from "@/lib/resources/resource-domain";
import type { ResourceAction } from "@/lib/resources/resource-domain";
import { LocalFileStorage } from "@/lib/storage/file-storage";

export class ResourceAuthorizationError extends Error {}
export class ResourceNotFoundError extends Error {}

type SchoolActor = AuthorizationContext & { schoolId: string; membershipId: string };
type ResourceInput = Readonly<{
  title: string;
  summary?: string;
  body?: string;
  visibility?: ResourceVisibility;
  slug?: string;
}>;
type UploadInput = Readonly<{
  originalName: string;
  mimeType: string;
  content: Uint8Array;
}>;

function requireSchoolActor(actor: AuthorizationContext, permission: Parameters<typeof can>[1]): asserts actor is SchoolActor {
  if (!isActiveSchoolContext(actor) || !can(actor, permission)) {
    throw new ResourceAuthorizationError("Bạn không có quyền thực hiện thao tác này.");
  }
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function canModerate(actor: SchoolActor): boolean {
  return actor.schoolRoles.some((role) =>
    ["SCHOOL_ADMIN", "TEACHER_STAFF", "APPROVER_REVIEWER"].includes(role),
  );
}

function canEditResource(actor: SchoolActor, resource: { createdByUserId: string }): boolean {
  return resource.createdByUserId === actor.userId || canModerate(actor);
}

function canReadResource(actor: SchoolActor, resource: {
  schoolId: string;
  createdByUserId: string;
  status: ResourceStatus;
  visibility: ResourceVisibility;
}): boolean {
  if (!isActiveSchoolContext(actor) || actor.schoolId !== resource.schoolId) return false;
  if (resource.createdByUserId === actor.userId || canModerate(actor)) return true;
  if (!can(actor, permissions.resourceRead, resource)) return false;
  return resource.status === "PUBLISHED" && resource.visibility !== "PRIVATE";
}

function assertResourceVisible(actor: SchoolActor, resource: Parameters<typeof canReadResource>[1]): void {
  if (!canReadResource(actor, resource)) throw new ResourceNotFoundError("Không tìm thấy tài nguyên.");
}

async function writeResourceRecords(
  transaction: Prisma.TransactionClient,
  input: {
    schoolId: string;
    actorUserId: string;
    resourceId: string;
    action: string;
    eventType: string;
    fromStatus?: ResourceStatus;
    toStatus?: ResourceStatus;
    before?: object;
    after?: object;
    payload?: object;
  },
): Promise<void> {
  await transaction.auditEvent.create({
    data: {
      schoolId: input.schoolId,
      actorUserId: input.actorUserId,
      actorType: "USER",
      action: input.action,
      entityType: "RESOURCE",
      entityId: input.resourceId,
      beforeJson: input.before,
      afterJson: input.after,
      requestId: randomUUID(),
    },
  });
  await transaction.domainOutboxEvent.create({
    data: {
      schoolId: input.schoolId,
      eventType: input.eventType,
      aggregateType: "RESOURCE",
      aggregateId: input.resourceId,
      payloadJson: input.payload ?? {},
    },
  });
}

export async function createResource(actor: AuthorizationContext, input: ResourceInput): Promise<string> {
  requireSchoolActor(actor, permissions.resourceCreate);
  const title = validateResourceTitle(input.title);
  const slug = slugify(input.slug || title) || `resource-${randomUUID().slice(0, 8)}`;
  const summary = input.summary?.trim().slice(0, 500) || undefined;
  const body = validateResourceBody(input.body);
  return db.$transaction(async (transaction) => {
    const resource = await transaction.resource.create({
      data: {
        schoolId: actor.schoolId,
        createdByUserId: actor.userId,
        title,
        slug,
        summary,
        visibility: input.visibility ?? "SCHOOL",
        versions: {
          create: {
            versionNumber: 1,
            title,
            summary,
            body,
            createdByUserId: actor.userId,
          },
        },
      },
      include: { versions: { select: { id: true }, orderBy: { versionNumber: "desc" }, take: 1 } },
    });
    const currentVersionId = resource.versions[0]?.id;
    await transaction.resource.update({
      where: { id: resource.id },
      data: { currentVersionId },
    });
    await transaction.resourceTransition.create({
      data: {
        schoolId: actor.schoolId,
        resourceId: resource.id,
        action: "CREATE",
        toStatus: "DRAFT",
        actorUserId: actor.userId,
      },
    });
    await writeResourceRecords(transaction, {
      schoolId: actor.schoolId,
      actorUserId: actor.userId,
      resourceId: resource.id,
      action: "RESOURCE_CREATE",
      eventType: "resource.created",
      after: { status: "DRAFT", versionId: currentVersionId },
    });
    return resource.id;
  });
}

export async function listResources(
  actor: AuthorizationContext,
  filters: { query?: string; categoryId?: string; tagId?: string; status?: ResourceStatus } = {},
) {
  requireSchoolActor(actor, permissions.resourceRead);
  const where: Prisma.ResourceWhereInput = {
    schoolId: actor.schoolId,
    ...(filters.query
      ? { OR: [{ title: { contains: filters.query, mode: "insensitive" } }, { summary: { contains: filters.query, mode: "insensitive" } }] }
      : {}),
    ...(filters.categoryId ? { categories: { some: { id: filters.categoryId } } } : {}),
    ...(filters.tagId ? { tags: { some: { id: filters.tagId } } } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };
  const resources = await db.resource.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { displayName: true } },
      currentVersion: { select: { id: true, versionNumber: true, title: true, summary: true, body: true } },
      categories: { select: { id: true, name: true, slug: true } },
      tags: { select: { id: true, name: true, slug: true } },
      analyticsCounter: true,
    },
  });
  return resources.filter((resource) => canReadResource(actor, resource));
}

export async function getResource(actor: AuthorizationContext, resourceId: string) {
  requireSchoolActor(actor, permissions.resourceRead);
  const resource = await db.resource.findFirst({
    where: { id: resourceId, schoolId: actor.schoolId },
    include: {
      createdBy: { select: { id: true, displayName: true } },
      currentVersion: true,
      versions: { orderBy: { versionNumber: "desc" }, include: { createdBy: { select: { displayName: true } } } },
      categories: true,
      tags: true,
      comments: { where: { status: "PUBLISHED" }, orderBy: { createdAt: "asc" }, include: { author: { select: { displayName: true } } } },
      analyticsCounter: true,
    },
  });
  if (!resource) throw new ResourceNotFoundError("Không tìm thấy tài nguyên.");
  assertResourceVisible(actor, resource);
  return resource;
}

export async function transitionResource(actor: AuthorizationContext, resourceId: string, action: ResourceAction, reason?: string): Promise<void> {
  requireSchoolActor(
    actor,
    action === "SUBMIT_REVIEW" ? permissions.resourceSubmitReview : action === "APPROVE" ? permissions.resourceApprove : action === "REJECT" ? permissions.resourceReject : permissions.resourceUpdate,
  );
  const existing = await db.resource.findFirst({ where: { id: resourceId, schoolId: actor.schoolId } });
  if (!existing || !canEditResource(actor, existing)) throw new ResourceNotFoundError("Không tìm thấy tài nguyên.");
  if ((action === "APPROVE" || action === "REJECT") && !canModerate(actor)) {
    throw new ResourceAuthorizationError("Bạn không có quyền duyệt tài nguyên.");
  }
  const nextStatus = transitionResourceStatus(existing.status, action);
  await db.$transaction(async (transaction) => {
    await transaction.resource.update({
      where: { id: existing.id },
      data: {
        status: nextStatus,
        publishedAt: nextStatus === "PUBLISHED" ? new Date() : existing.publishedAt,
        archivedAt: nextStatus === "ARCHIVED" ? new Date() : null,
      },
    });
    await transaction.resourceTransition.create({
      data: {
        schoolId: actor.schoolId,
        resourceId: existing.id,
        action,
        fromStatus: existing.status,
        toStatus: nextStatus,
        reason: reason?.trim().slice(0, 500) || undefined,
        actorUserId: actor.userId,
      },
    });
    await writeResourceRecords(transaction, {
      schoolId: actor.schoolId,
      actorUserId: actor.userId,
      resourceId: existing.id,
      action: `RESOURCE_${action}`,
      eventType: `resource.${action.toLowerCase()}`,
      fromStatus: existing.status,
      toStatus: nextStatus,
      before: { status: existing.status },
      after: { status: nextStatus },
      payload: { reason },
    });
  });
}

export async function createResourceVersion(
  actor: AuthorizationContext,
  resourceId: string,
  input: { title: string; summary?: string; body?: string; file?: UploadInput },
): Promise<string> {
  requireSchoolActor(actor, permissions.resourceVersionCreate);
  const resource = await db.resource.findFirst({ where: { id: resourceId, schoolId: actor.schoolId } });
  if (!resource || !canEditResource(actor, resource)) throw new ResourceNotFoundError("Không tìm thấy tài nguyên.");
  const title = validateResourceTitle(input.title);
  const body = validateResourceBody(input.body);
  let storedObject: Awaited<ReturnType<LocalFileStorage["put"]>> | undefined;
  const storage = new LocalFileStorage();
  if (input.file) {
    validateUploadMetadata({
      originalName: input.file.originalName,
      mimeType: input.file.mimeType,
      sizeBytes: input.file.content.byteLength,
      maxBytes: 25 * 1024 * 1024,
    });
    storedObject = await storage.put({ content: input.file.content, maxBytes: 25 * 1024 * 1024 });
  }
  try {
    const versionId = await db.$transaction(async (transaction) => {
      const latest = await transaction.resourceVersion.findFirst({
        where: { resourceId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });
      const version = await transaction.resourceVersion.create({
        data: {
          resourceId,
          versionNumber: (latest?.versionNumber ?? 0) + 1,
          title,
          summary: input.summary?.trim().slice(0, 500) || undefined,
          body,
          createdByUserId: actor.userId,
        },
      });
      if (storedObject && input.file) {
        const file = await transaction.storedFile.create({
          data: {
            schoolId: actor.schoolId,
            storageKey: storedObject.storageKey,
            originalName: input.file.originalName.trim(),
            mimeType: input.file.mimeType,
            sizeBytes: storedObject.sizeBytes,
            sha256: storedObject.sha256,
            status: "AVAILABLE",
            createdByUserId: actor.userId,
          },
        });
        await transaction.fileVersion.create({
          data: {
            fileId: file.id,
            versionNumber: version.versionNumber,
            storageKey: storedObject.storageKey,
            originalName: input.file.originalName.trim(),
            mimeType: input.file.mimeType,
            sizeBytes: storedObject.sizeBytes,
            sha256: storedObject.sha256,
            createdByUserId: actor.userId,
          },
        });
        await transaction.fileLink.create({
          data: {
            schoolId: actor.schoolId,
            fileId: file.id,
            resourceId,
            entityType: "RESOURCE_VERSION",
            entityId: version.id,
            visibility: resource.visibility,
            createdByUserId: actor.userId,
          },
        });
      }
      await transaction.resource.update({ where: { id: resourceId }, data: { currentVersionId: version.id } });
      await writeResourceRecords(transaction, {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        resourceId,
        action: "RESOURCE_VERSION_CREATE",
        eventType: "resource.version.created",
        payload: { versionId: version.id, versionNumber: version.versionNumber },
      });
      return version.id;
    });
    return versionId;
  } catch (error) {
    if (storedObject) await storage.remove(storedObject.storageKey).catch(() => undefined);
    throw error;
  }
}

export async function rollbackResourceVersion(
  actor: AuthorizationContext,
  resourceId: string,
  sourceVersionId: string,
): Promise<string> {
  requireSchoolActor(actor, permissions.resourceVersionRollback);
  const resource = await db.resource.findFirst({
    where: { id: resourceId, schoolId: actor.schoolId },
    include: { versions: { where: { id: sourceVersionId }, take: 1 } },
  });
  if (!resource || !canEditResource(actor, resource) || resource.versions.length === 0) {
    throw new ResourceNotFoundError("Không tìm thấy phiên bản tài nguyên.");
  }
  return createResourceVersion(actor, resourceId, {
    title: resource.versions[0].title,
    summary: resource.versions[0].summary ?? undefined,
    body: resource.versions[0].body ?? undefined,
  });
}

export async function recordResourceEvent(
  actor: AuthorizationContext,
  resourceId: string,
  eventType: "VIEW" | "DOWNLOAD" | "PREVIEW",
): Promise<void> {
  requireSchoolActor(actor, permissions.resourceRead);
  const resource = await db.resource.findFirst({ where: { id: resourceId, schoolId: actor.schoolId } });
  if (!resource) throw new ResourceNotFoundError("Không tìm thấy tài nguyên.");
  assertResourceVisible(actor, resource);
  await db.$transaction([
    db.resourceAnalyticsEvent.create({ data: { schoolId: actor.schoolId, resourceId, actorUserId: actor.userId, eventType } }),
    db.resourceAnalyticsCounter.upsert({
      where: { resourceId },
      update: { views: eventType === "VIEW" ? { increment: 1 } : undefined, downloads: eventType === "DOWNLOAD" ? { increment: 1 } : undefined, previews: eventType === "PREVIEW" ? { increment: 1 } : undefined },
      create: { resourceId, views: eventType === "VIEW" ? 1 : 0, downloads: eventType === "DOWNLOAD" ? 1 : 0, previews: eventType === "PREVIEW" ? 1 : 0 },
    }),
  ]);
}

export async function toggleResourceBookmark(actor: AuthorizationContext, resourceId: string): Promise<boolean> {
  requireSchoolActor(actor, permissions.resourceRead);
  const resource = await db.resource.findFirst({ where: { id: resourceId, schoolId: actor.schoolId } });
  if (!resource) throw new ResourceNotFoundError("Không tìm thấy tài nguyên.");
  assertResourceVisible(actor, resource);
  const existing = await db.resourceBookmark.findUnique({ where: { schoolId_resourceId_userId: { schoolId: actor.schoolId, resourceId, userId: actor.userId } } });
  if (existing) {
    await db.resourceBookmark.delete({ where: { id: existing.id } });
    await db.resourceAnalyticsCounter.updateMany({ where: { resourceId }, data: { bookmarks: { decrement: 1 } } });
    return false;
  }
  await db.resourceBookmark.create({ data: { schoolId: actor.schoolId, resourceId, userId: actor.userId } });
  await db.resourceAnalyticsCounter.upsert({ where: { resourceId }, update: { bookmarks: { increment: 1 } }, create: { resourceId, bookmarks: 1 } });
  return true;
}

export async function addResourceComment(actor: AuthorizationContext, resourceId: string, body: string): Promise<string> {
  requireSchoolActor(actor, permissions.resourceCommentCreate);
  const resource = await db.resource.findFirst({ where: { id: resourceId, schoolId: actor.schoolId } });
  if (!resource) throw new ResourceNotFoundError("Không tìm thấy tài nguyên.");
  assertResourceVisible(actor, resource);
  const value = body.trim();
  if (value.length < 2 || value.length > 2_000) throw new ResourceValidationError("Bình luận phải dài 2–2.000 ký tự.");
  const comment = await db.resourceComment.create({ data: { schoolId: actor.schoolId, resourceId, authorUserId: actor.userId, body: value } });
  await db.resourceAnalyticsCounter.upsert({ where: { resourceId }, update: { comments: { increment: 1 } }, create: { resourceId, comments: 1 } });
  return comment.id;
}

export async function reportResource(actor: AuthorizationContext, resourceId: string, reason: string): Promise<string> {
  requireSchoolActor(actor, permissions.resourceReportCreate);
  const resource = await db.resource.findFirst({ where: { id: resourceId, schoolId: actor.schoolId } });
  if (!resource) throw new ResourceNotFoundError("Không tìm thấy tài nguyên.");
  assertResourceVisible(actor, resource);
  const value = reason.trim();
  if (value.length < 5 || value.length > 1_000) throw new ResourceValidationError("Lý do báo cáo phải dài 5–1.000 ký tự.");
  const report = await db.resourceReport.create({ data: { schoolId: actor.schoolId, resourceId, reporterUserId: actor.userId, reason: value } });
  await db.resourceAnalyticsCounter.upsert({ where: { resourceId }, update: { reports: { increment: 1 } }, create: { resourceId, reports: 1 } });
  return report.id;
}

export async function moderateResourceComment(
  actor: AuthorizationContext,
  commentId: string,
  status: "PUBLISHED" | "HIDDEN" | "DELETED",
): Promise<void> {
  requireSchoolActor(actor, permissions.commentModerate);
  if (!canModerate(actor)) throw new ResourceAuthorizationError("Bạn không có quyền kiểm duyệt bình luận.");
  const comment = await db.resourceComment.findFirst({ where: { id: commentId, schoolId: actor.schoolId } });
  if (!comment) throw new ResourceNotFoundError("Không tìm thấy bình luận.");
  await db.resourceComment.update({ where: { id: comment.id }, data: { status } });
  await db.auditEvent.create({
    data: {
      schoolId: actor.schoolId,
      actorUserId: actor.userId,
      actorType: "USER",
      action: "RESOURCE_COMMENT_MODERATE",
      entityType: "RESOURCE_COMMENT",
      entityId: comment.id,
      beforeJson: { status: comment.status },
      afterJson: { status },
      requestId: randomUUID(),
    },
  });
}

export async function resolveResourceReport(
  actor: AuthorizationContext,
  reportId: string,
  status: "RESOLVED" | "DISMISSED" | "REVIEWING",
  resolution?: string,
): Promise<void> {
  requireSchoolActor(actor, permissions.commentModerate);
  if (!canModerate(actor)) throw new ResourceAuthorizationError("Bạn không có quyền xử lý báo cáo.");
  const report = await db.resourceReport.findFirst({ where: { id: reportId, schoolId: actor.schoolId } });
  if (!report) throw new ResourceNotFoundError("Không tìm thấy báo cáo.");
  await db.resourceReport.update({
    where: { id: report.id },
    data: {
      status,
      resolution: resolution?.trim().slice(0, 1_000) || undefined,
      resolvedByUserId: actor.userId,
      resolvedAt: status === "RESOLVED" || status === "DISMISSED" ? new Date() : null,
    },
  });
  await db.auditEvent.create({
    data: {
      schoolId: actor.schoolId,
      actorUserId: actor.userId,
      actorType: "USER",
      action: "RESOURCE_REPORT_RESOLVE",
      entityType: "RESOURCE_REPORT",
      entityId: report.id,
      beforeJson: { status: report.status },
      afterJson: { status, resolution },
      requestId: randomUUID(),
    },
  });
}

export async function listResourceModerationQueue(actor: AuthorizationContext) {
  requireSchoolActor(actor, permissions.resourceReview);
  if (!canModerate(actor)) throw new ResourceAuthorizationError("Bạn không có quyền duyệt tài nguyên.");
  return db.resource.findMany({
    where: { schoolId: actor.schoolId, status: "PENDING_REVIEW" },
    orderBy: { updatedAt: "asc" },
    include: {
      createdBy: { select: { displayName: true } },
      currentVersion: { select: { title: true, summary: true, versionNumber: true } },
    },
  });
}

export async function getResourceAnalytics(actor: AuthorizationContext, resourceId: string) {
  requireSchoolActor(actor, permissions.resourceAnalyticsRead);
  const resource = await db.resource.findFirst({
    where: { id: resourceId, schoolId: actor.schoolId },
    include: { analyticsCounter: true },
  });
  if (!resource || !canEditResource(actor, resource)) throw new ResourceNotFoundError("Không tìm thấy báo cáo tài nguyên.");
  const events = await db.resourceAnalyticsEvent.groupBy({
    by: ["eventType"],
    where: { schoolId: actor.schoolId, resourceId },
    _count: { _all: true },
  });
  return { resource, events };
}

export async function listBookmarkedResources(actor: AuthorizationContext) {
  requireSchoolActor(actor, permissions.resourceRead);
  return db.resourceBookmark.findMany({
    where: { schoolId: actor.schoolId, userId: actor.userId },
    orderBy: { createdAt: "desc" },
    include: {
      resource: {
        include: {
          createdBy: { select: { displayName: true } },
          currentVersion: { select: { title: true, summary: true } },
        },
      },
    },
  });
}

export async function createResourceCollection(actor: AuthorizationContext, name: string, description?: string): Promise<string> {
  requireSchoolActor(actor, permissions.resourceRead);
  const value = name.trim();
  if (value.length < 2 || value.length > 80) throw new ResourceValidationError("Tên bộ sưu tập phải dài 2–80 ký tự.");
  const collection = await db.resourceCollection.create({
    data: { schoolId: actor.schoolId, ownerUserId: actor.userId, name: value, description: description?.trim().slice(0, 300) || undefined },
  });
  return collection.id;
}

export async function addResourceToCollection(actor: AuthorizationContext, collectionId: string, resourceId: string): Promise<void> {
  requireSchoolActor(actor, permissions.resourceRead);
  const collection = await db.resourceCollection.findFirst({ where: { id: collectionId, schoolId: actor.schoolId, ownerUserId: actor.userId } });
  const resource = await db.resource.findFirst({ where: { id: resourceId, schoolId: actor.schoolId } });
  if (!collection || !resource) throw new ResourceNotFoundError("Không tìm thấy bộ sưu tập hoặc tài nguyên.");
  assertResourceVisible(actor, resource);
  await db.resourceCollectionItem.upsert({
    where: { collectionId_resourceId: { collectionId, resourceId } },
    update: {},
    create: { collectionId, resourceId },
  });
}

export async function listResourceCollections(actor: AuthorizationContext) {
  requireSchoolActor(actor, permissions.resourceRead);
  return db.resourceCollection.findMany({
    where: { schoolId: actor.schoolId, ownerUserId: actor.userId },
    orderBy: { updatedAt: "desc" },
    include: { items: { include: { resource: { select: { id: true, title: true, status: true } } } } },
  });
}

export async function getAuthorizedFile(
  actor: AuthorizationContext,
  resourceId: string,
  versionId?: string,
): Promise<{ storageKey: string; mimeType: string; originalName: string }> {
  requireSchoolActor(actor, permissions.resourceDownload);
  const resource = await db.resource.findFirst({ where: { id: resourceId, schoolId: actor.schoolId } });
  if (!resource) throw new ResourceNotFoundError("Không tìm thấy tài nguyên.");
  assertResourceVisible(actor, resource);
  const file = await db.fileLink.findFirst({
    where: { schoolId: actor.schoolId, resourceId, entityType: "RESOURCE_VERSION", ...(versionId ? { entityId: versionId } : {}) },
    orderBy: { createdAt: "desc" },
    include: { file: { include: { versions: { orderBy: { versionNumber: "desc" } } } } },
  });
  const version = file?.file.versions[0];
  if (!file || !version) throw new ResourceNotFoundError("Tài nguyên chưa có file.");
  return { storageKey: version.storageKey, mimeType: version.mimeType, originalName: version.originalName };
}
