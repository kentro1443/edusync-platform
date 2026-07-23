import type { ResourceStatus } from "@/generated/prisma/enums";

export type ResourceAction =
  | "SUBMIT_REVIEW"
  | "APPROVE"
  | "REJECT"
  | "ARCHIVE"
  | "RESTORE";

const transitions: Record<ResourceStatus, Partial<Record<ResourceAction, ResourceStatus>>> = {
  DRAFT: { SUBMIT_REVIEW: "PENDING_REVIEW" },
  PENDING_REVIEW: { APPROVE: "PUBLISHED", REJECT: "REJECTED" },
  PUBLISHED: { ARCHIVE: "ARCHIVED" },
  REJECTED: { SUBMIT_REVIEW: "PENDING_REVIEW", ARCHIVE: "ARCHIVED" },
  ARCHIVED: { RESTORE: "DRAFT" },
};

export class ResourceTransitionError extends Error {}
export class ResourceValidationError extends Error {}

export function transitionResourceStatus(
  current: ResourceStatus,
  action: ResourceAction,
): ResourceStatus {
  const next = transitions[current][action];
  if (!next) {
    throw new ResourceTransitionError(
      `Không thể chuyển tài nguyên từ ${current} bằng thao tác ${action}.`,
    );
  }
  return next;
}

const safeNamePattern = /^[\p{L}\p{N}][\p{L}\p{N} ._()\-]{0,159}$/u;
const allowedMimeTypes = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export function validateResourceTitle(title: string): string {
  const value = title.trim();
  if (value.length < 3 || value.length > 160) {
    throw new ResourceValidationError("Tiêu đề tài nguyên phải dài 3–160 ký tự.");
  }
  return value;
}

export function validateResourceBody(body: string | undefined): string | undefined {
  const value = body?.trim();
  if (value && value.length > 500_000) {
    throw new ResourceValidationError("Nội dung tài nguyên vượt quá giới hạn.");
  }
  return value || undefined;
}

export function validateUploadMetadata(input: {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  maxBytes: number;
}): void {
  const name = input.originalName.trim();
  if (!safeNamePattern.test(name) || name.includes("..") || name.includes("/") || name.includes("\\")) {
    throw new ResourceValidationError("Tên file không an toàn.");
  }
  if (!allowedMimeTypes.has(input.mimeType)) {
    throw new ResourceValidationError("Định dạng file chưa được hỗ trợ.");
  }
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > input.maxBytes) {
    throw new ResourceValidationError("Dung lượng file vượt quá giới hạn.");
  }
}

export function isAllowedMimeType(mimeType: string): boolean {
  return allowedMimeTypes.has(mimeType);
}
