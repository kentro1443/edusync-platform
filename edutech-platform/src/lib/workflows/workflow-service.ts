import "server-only";

import type { AuthorizationContext } from "@/lib/auth/policies";
import { getSchoolPermissions, hasPermission, permissions } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  getNextWorkflowStepIds,
  resolveWorkflowRouting,
  validateWorkflowValues,
  type WorkflowField,
  type WorkflowCondition,
} from "@/lib/workflows/workflow-domain";

export class WorkflowAuthorizationError extends Error {}
export class WorkflowValidationError extends Error {}

type SchoolActor = AuthorizationContext & { schoolId: string; membershipId: string };

function requireWorkflowActor(
  actor: AuthorizationContext,
  permission: (typeof permissions)[keyof typeof permissions],
): asserts actor is SchoolActor {
  if (!actor.schoolId || !actor.membershipId || !hasPermission(getSchoolPermissions(actor.schoolRoles), permission)) {
    throw new WorkflowAuthorizationError("Bạn không có quyền thao tác quy trình.");
  }
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function workflowSubmissionAccess(actor: SchoolActor): Prisma.WorkflowSubmissionWhereInput {
  return {
    schoolId: actor.schoolId,
    OR: [
      { ownerUserId: actor.userId },
      {
        steps: {
          some: {
            status: "ACTIVE",
            OR: [
              { assignedUserId: actor.userId },
              {
                assignedUserId: null,
                step: { role: { in: [...actor.schoolRoles] } },
              },
            ],
          },
        },
      },
      { decisions: { some: { actorUserId: actor.userId } } },
    ],
  };
}

async function getDraft(transaction: Prisma.TransactionClient, actor: SchoolActor, templateId: string) {
  const template = await transaction.workflowTemplate.findFirst({
    where: { id: templateId, schoolId: actor.schoolId },
    include: { versions: { orderBy: { version: "desc" }, take: 1, include: { fields: true, steps: { orderBy: { position: "asc" } } } } },
  });
  if (!template) throw new WorkflowValidationError("Không tìm thấy mẫu quy trình.");
  const draft = template.versions[0];
  if (!draft) throw new WorkflowValidationError("Mẫu chưa có phiên bản nháp.");
  if (draft.publishedAt) throw new WorkflowValidationError("Mẫu đã xuất bản, cần tạo phiên bản nháp mới.");
  return { template, draft };
}

export async function listWorkflowTemplates(actor: AuthorizationContext) {
  requireWorkflowActor(actor, permissions.workflowTemplateRead);
  return db.workflowTemplate.findMany({
    where: { schoolId: actor.schoolId, status: { not: "RETIRED" } },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1, select: { version: true, publishedAt: true, fields: { select: { id: true } }, steps: { select: { id: true } } } },
      _count: { select: { submissions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getWorkflowTemplate(actor: AuthorizationContext, templateId: string) {
  requireWorkflowActor(actor, permissions.workflowTemplateRead);
  return db.workflowTemplate.findFirst({
    where: { id: templateId, schoolId: actor.schoolId },
    include: {
      versions: { orderBy: { version: "desc" }, include: { fields: { orderBy: { position: "asc" } }, steps: { orderBy: { position: "asc" } } } },
    },
  });
}

export async function createWorkflowTemplate(actor: AuthorizationContext, input: Readonly<{ name: string; description?: string }>) {
  requireWorkflowActor(actor, permissions.workflowTemplateCreate);
  const name = input.name.trim();
  if (name.length < 3 || name.length > 160) throw new WorkflowValidationError("Tên mẫu quy trình không hợp lệ.");
  const slug = `${slugify(name)}-${Date.now().toString(36)}`;
  return db.$transaction(async (transaction) => {
    const template = await transaction.workflowTemplate.create({
      data: { schoolId: actor.schoolId, createdById: actor.userId, name, slug, description: input.description?.trim() || undefined },
    });
    const version = await transaction.workflowVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        fields: { create: [{ key: "title", label: "Tiêu đề", type: "TEXT", position: 0, required: true }] },
        steps: { create: [{ name: "Duyệt nội dung", position: 0, role: "SCHOOL_ADMIN" }] },
      },
    });
    return transaction.workflowTemplate.update({ where: { id: template.id }, data: { currentVersionId: version.id } });
  });
}

export async function addWorkflowField(
  actor: AuthorizationContext,
  templateId: string,
  input: Readonly<{ key: string; label: string; type: "TEXT" | "TEXTAREA" | "NUMBER" | "DATE" | "SELECT" | "CHECKBOX" | "FILE"; required: boolean }>,
) {
  requireWorkflowActor(actor, permissions.workflowTemplateUpdateDraft);
  const key = slugify(input.key).replaceAll("-", "_");
  if (!key || !input.label.trim()) throw new WorkflowValidationError("Trường cần có mã và nhãn.");
  return db.$transaction(async (transaction) => {
    const { draft } = await getDraft(transaction, actor, templateId);
    return transaction.workflowFieldDefinition.create({
      data: { versionId: draft.id, key, label: input.label.trim(), type: input.type, required: input.required, position: draft.fields.length },
    });
  });
}

export async function addWorkflowStep(
  actor: AuthorizationContext,
  templateId: string,
  input: Readonly<{
    name: string;
    role: "SCHOOL_ADMIN" | "TEACHER_STAFF" | "MENTOR_COUNSELOR" | "APPROVER_REVIEWER";
    condition?: WorkflowCondition;
    parallelGroup?: number;
  }>,
) {
  requireWorkflowActor(actor, permissions.workflowTemplateUpdateDraft);
  if (!input.name.trim()) throw new WorkflowValidationError("Bước duyệt cần có tên.");
  if (!["SCHOOL_ADMIN", "TEACHER_STAFF", "MENTOR_COUNSELOR", "APPROVER_REVIEWER"].includes(input.role)) {
    throw new WorkflowValidationError("Vai trò duyệt không hợp lệ.");
  }
  if (input.parallelGroup !== undefined && (!Number.isInteger(input.parallelGroup) || input.parallelGroup < 1 || input.parallelGroup > 1000)) {
    throw new WorkflowValidationError("Nhóm song song không hợp lệ.");
  }
  if (input.condition?.field && !["equals", "notEquals", "truthy", "falsy"].includes(input.condition.operator ?? "")) {
    throw new WorkflowValidationError("Điều kiện duyệt không hợp lệ.");
  }
  const conditionField = input.condition?.field ? slugify(input.condition.field).replaceAll("-", "_") : "";
  if (input.condition?.field && !conditionField) throw new WorkflowValidationError("Mã trường điều kiện không hợp lệ.");
  const condition = input.condition?.field
    ? {
        field: conditionField,
        operator: input.condition.operator,
        value: input.condition.value == null ? "" : String(input.condition.value),
      }
    : undefined;
  return db.$transaction(async (transaction) => {
    const { draft } = await getDraft(transaction, actor, templateId);
    return transaction.workflowApprovalStep.create({
      data: {
        versionId: draft.id,
        name: input.name.trim(),
        role: input.role,
        position: draft.steps.length,
        conditionJson: (condition ?? {}) as Prisma.InputJsonValue,
        parallelGroup: input.parallelGroup && input.parallelGroup > 0 ? input.parallelGroup : undefined,
      },
    });
  });
}

export async function publishWorkflowTemplate(actor: AuthorizationContext, templateId: string) {
  requireWorkflowActor(actor, permissions.workflowTemplatePublish);
  return db.$transaction(async (transaction) => {
    const { template, draft } = await getDraft(transaction, actor, templateId);
    if (draft.fields.length === 0 || draft.steps.length === 0) throw new WorkflowValidationError("Mẫu cần ít nhất một trường và một bước duyệt.");
    await transaction.workflowVersion.update({ where: { id: draft.id }, data: { publishedAt: new Date() } });
    const nextVersion = await transaction.workflowVersion.create({
      data: {
        templateId: template.id,
        version: draft.version + 1,
        fields: { create: draft.fields.map(({ key, label, type, position, required }) => ({ key, label, type, position, required })) },
        steps: {
          create: draft.steps.map(({ name, position, role, deadlineHours, conditionJson, parallelGroup }) => ({
            name,
            position,
            role,
            deadlineHours,
            conditionJson: (conditionJson ?? {}) as Prisma.InputJsonValue,
            parallelGroup,
          })),
        },
      },
    });
    return transaction.workflowTemplate.update({ where: { id: template.id }, data: { status: "PUBLISHED", currentVersionId: nextVersion.id } });
  });
}

async function publishedVersion(actor: SchoolActor, templateId: string) {
  const template = await db.workflowTemplate.findFirst({
    where: { id: templateId, schoolId: actor.schoolId, status: "PUBLISHED" },
    include: { versions: { where: { publishedAt: { not: null } }, orderBy: { version: "desc" }, take: 1, include: { fields: { orderBy: { position: "asc" } }, steps: { orderBy: { position: "asc" } } } } },
  });
  const version = template?.versions[0];
  if (!template || !version) throw new WorkflowValidationError("Quy trình chưa được xuất bản.");
  return { template, version };
}

export async function createWorkflowSubmission(actor: AuthorizationContext, templateId: string) {
  requireWorkflowActor(actor, permissions.workflowSubmissionCreate);
  const { template, version } = await publishedVersion(actor, templateId);
  return db.$transaction(async (transaction) => {
    const submission = await transaction.workflowSubmission.create({
      data: {
        schoolId: actor.schoolId,
        templateId: template.id,
        versionId: version.id,
        ownerUserId: actor.userId,
        steps: { create: version.steps.map((step) => ({ stepId: step.id, status: "PENDING" })) },
        history: { create: { actorUserId: actor.userId, action: "CREATE", toStatus: "DRAFT" } },
      },
    });
    return submission.id;
  });
}

export async function submitWorkflowSubmission(actor: AuthorizationContext, submissionId: string, values: Record<string, unknown>) {
  requireWorkflowActor(actor, permissions.workflowSubmissionUpdate);
  const submission = await db.workflowSubmission.findFirst({
    where: { id: submissionId, schoolId: actor.schoolId, ownerUserId: actor.userId, status: { in: ["DRAFT", "CHANGES_REQUESTED"] } },
    include: { version: { include: { fields: true, steps: { orderBy: { position: "asc" } } } }, steps: true },
  });
  if (!submission) throw new WorkflowValidationError("Không tìm thấy bản nháp được phép sửa.");
  const fields: WorkflowField[] = submission.version.fields.map((field) => ({ key: field.key, label: field.label, type: field.type, required: field.required }));
  const validation = validateWorkflowValues(fields, values);
  if (!validation.valid) throw new WorkflowValidationError(Object.values(validation.errors).join(" "));
  return db.$transaction(async (transaction) => {
    await Promise.all(Object.entries(values).map(([fieldKey, value]) => transaction.workflowSubmissionValue.upsert({
      where: { submissionId_fieldKey: { submissionId, fieldKey } },
      create: { submissionId, fieldKey, valueJson: value as never },
      update: { valueJson: value as never },
    })));
    const routing = resolveWorkflowRouting(
      submission.version.steps.map((step) => ({
        id: step.id,
        position: step.position,
        status: "PENDING" as const,
        condition: step.conditionJson as WorkflowCondition,
        parallelGroup: step.parallelGroup,
      })),
      values,
    );
    await Promise.all(routing.map((step) => transaction.workflowSubmissionStep.updateMany({
      where: { submissionId, stepId: step.id },
      data: { status: step.status },
    })));
    const nextStatus = routing.some((step) => step.status === "ACTIVE") ? "IN_REVIEW" : "APPROVED";
    return transaction.workflowSubmission.update({
      where: { id: submissionId },
      data: { status: nextStatus, submittedAt: new Date(), history: { create: { actorUserId: actor.userId, action: "SUBMIT", fromStatus: submission.status, toStatus: nextStatus } } },
    });
  });
}

export async function listWorkflowSubmissions(actor: AuthorizationContext) {
  requireWorkflowActor(actor, permissions.workflowSubmissionRead);
  return db.workflowSubmission.findMany({
    where: workflowSubmissionAccess(actor),
    include: { template: { select: { name: true } }, owner: { select: { displayName: true } }, steps: { include: { step: true }, orderBy: { step: { position: "asc" } } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function getWorkflowSubmission(actor: AuthorizationContext, submissionId: string) {
  requireWorkflowActor(actor, permissions.workflowSubmissionRead);
  return db.workflowSubmission.findFirst({
    where: {
      id: submissionId,
      ...workflowSubmissionAccess(actor),
    },
    include: {
      template: { select: { id: true, name: true } },
      owner: { select: { id: true, displayName: true } },
      version: { include: { fields: { orderBy: { position: "asc" } }, steps: { orderBy: { position: "asc" } } } },
      values: true,
      steps: { include: { step: true, assignedUser: { select: { displayName: true } } }, orderBy: { step: { position: "asc" } } },
      history: { orderBy: { createdAt: "desc" }, take: 200, include: { actor: { select: { displayName: true } } } },
      comments: { orderBy: { createdAt: "desc" }, take: 100, include: { author: { select: { displayName: true } } } },
    },
  });
}

export async function addWorkflowSubmissionComment(
  actor: AuthorizationContext,
  submissionId: string,
  bodyInput: string,
) {
  requireWorkflowActor(actor, permissions.workflowSubmissionComment);
  const body = bodyInput.trim();
  if (!body || body.length > 2_000) {
    throw new WorkflowValidationError("Bình luận cần từ 1 đến 2.000 ký tự.");
  }
  const submission = await db.workflowSubmission.findFirst({
    where: { id: submissionId, ...workflowSubmissionAccess(actor) },
    select: { id: true },
  });
  if (!submission) {
    throw new WorkflowAuthorizationError("Bạn không có quyền bình luận hồ sơ này.");
  }
  return db.workflowSubmissionComment.create({
    data: {
      schoolId: actor.schoolId,
      submissionId: submission.id,
      authorUserId: actor.userId,
      body,
    },
  });
}

export async function listWorkflowDelegationCandidates(
  actor: AuthorizationContext,
  submissionStepId: string,
) {
  requireWorkflowActor(actor, permissions.workflowSubmissionDelegate);
  const active = await db.workflowSubmissionStep.findFirst({
    where: {
      id: submissionStepId,
      status: "ACTIVE",
      submission: { schoolId: actor.schoolId, status: "IN_REVIEW" },
    },
    include: { step: { select: { role: true } } },
  });
  const actorCanDelegate =
    active &&
    (active.assignedUserId
      ? active.assignedUserId === actor.userId
      : actor.schoolRoles.includes(active.step.role));
  if (!active || !actorCanDelegate) {
    throw new WorkflowAuthorizationError("Bạn không thể chuyển bước duyệt này.");
  }
  const memberships = await db.schoolMembership.findMany({
    where: {
      schoolId: actor.schoolId,
      status: "ACTIVE",
      userId: { not: actor.userId },
      roleAssignments: { some: { role: active.step.role } },
    },
    select: {
      userId: true,
      user: { select: { displayName: true } },
    },
    orderBy: { user: { displayName: "asc" } },
    take: 100,
  });
  return memberships.map((membership) => ({
    userId: membership.userId,
    displayName: membership.user.displayName,
  }));
}

export async function delegateWorkflowSubmissionStep(
  actor: AuthorizationContext,
  submissionId: string,
  input: Readonly<{ submissionStepId: string; targetUserId: string; reason?: string }>,
) {
  requireWorkflowActor(actor, permissions.workflowSubmissionDelegate);
  const reason = input.reason?.trim() || undefined;
  if (reason && reason.length > 500) {
    throw new WorkflowValidationError("Lý do chuyển người duyệt không được quá 500 ký tự.");
  }
  const active = await db.workflowSubmissionStep.findFirst({
    where: {
      id: input.submissionStepId,
      submissionId,
      status: "ACTIVE",
      submission: { schoolId: actor.schoolId, status: "IN_REVIEW" },
    },
    include: { step: { select: { role: true } } },
  });
  const actorCanDelegate =
    active &&
    (active.assignedUserId
      ? active.assignedUserId === actor.userId
      : actor.schoolRoles.includes(active.step.role));
  if (!active || !actorCanDelegate) {
    throw new WorkflowAuthorizationError("Bạn không thể chuyển bước duyệt này.");
  }
  if (input.targetUserId === actor.userId || input.targetUserId === active.assignedUserId) {
    throw new WorkflowValidationError("Hãy chọn một người duyệt khác.");
  }
  const target = await db.schoolMembership.findFirst({
    where: {
      schoolId: actor.schoolId,
      userId: input.targetUserId,
      status: "ACTIVE",
      roleAssignments: { some: { role: active.step.role } },
    },
    select: { user: { select: { displayName: true } } },
  });
  if (!target) {
    throw new WorkflowValidationError("Người nhận không còn hoạt động hoặc không đúng vai trò.");
  }
  await db.$transaction(async (transaction) => {
    const delegated = await transaction.workflowSubmissionStep.updateMany({
      where: {
        id: active.id,
        status: "ACTIVE",
        assignedUserId: active.assignedUserId,
      },
      data: { assignedUserId: input.targetUserId },
    });
    if (delegated.count !== 1) {
      throw new WorkflowValidationError("Bước duyệt vừa được người khác cập nhật.");
    }
    await transaction.workflowDelegation.create({
      data: {
        schoolId: actor.schoolId,
        submissionStepId: active.id,
        delegatedByUserId: actor.userId,
        delegatedToUserId: input.targetUserId,
        reason,
      },
    });
    await transaction.workflowSubmission.update({
      where: { id: submissionId },
      data: {
        history: {
          create: {
            actorUserId: actor.userId,
            action: "DELEGATE",
            fromStatus: "IN_REVIEW",
            toStatus: "IN_REVIEW",
            metadataJson: {
              submissionStepId: active.id,
              delegatedToUserId: input.targetUserId,
              delegatedToName: target.user.displayName,
              ...(reason ? { reason } : {}),
            },
          },
        },
      },
    });
  });
}

export async function exportWorkflowSubmissionsCsv(actor: AuthorizationContext): Promise<string> {
  requireWorkflowActor(actor, permissions.workflowAnalyticsRead);
  const submissions = await listWorkflowSubmissions(actor);
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return [
    "id,template,owner,status,updatedAt",
    ...submissions.map((submission) =>
      [
        submission.id,
        submission.template.name,
        submission.owner.displayName,
        submission.status,
        submission.updatedAt.toISOString(),
      ].map(escape).join(","),
    ),
  ].join("\n") + "\n";
}

export async function decideWorkflowSubmission(
  actor: AuthorizationContext,
  submissionId: string,
  input: Readonly<{ type: "APPROVE" | "REJECT" | "REQUEST_CHANGES"; reason?: string }>,
) {
  requireWorkflowActor(actor, permissions.workflowSubmissionApprove);
  const submission = await db.workflowSubmission.findFirst({
    where: { id: submissionId, schoolId: actor.schoolId, status: "IN_REVIEW" },
    include: { steps: { include: { step: true }, orderBy: { step: { position: "asc" } } } },
  });
  const active = submission?.steps.find(
    (step) =>
      step.status === "ACTIVE" &&
      (step.assignedUserId
        ? step.assignedUserId === actor.userId
        : actor.schoolRoles.includes(step.step.role)),
  );
  if (!submission || !active) {
    throw new WorkflowAuthorizationError("Bạn không phải người duyệt bước hiện tại.");
  }
  return db.$transaction(async (transaction) => {
    const decisionStatus = input.type === "APPROVE" ? "APPROVED" : input.type === "REJECT" ? "REJECTED" : "CHANGES_REQUESTED";
    const acted = await transaction.workflowSubmissionStep.updateMany({
      where: { id: active.id, status: "ACTIVE" },
      data: { status: decisionStatus, actedAt: new Date() },
    });
    if (acted.count !== 1) throw new WorkflowValidationError("Bước duyệt đã được xử lý.");
    let nextStatus: "IN_REVIEW" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
    if (input.type === "APPROVE") {
      const currentSteps = await transaction.workflowSubmissionStep.findMany({
        where: { submissionId: submission.id },
        include: { step: true },
        orderBy: { step: { position: "asc" } },
      });
      const nextIds = getNextWorkflowStepIds(currentSteps.map((step) => ({
        id: step.id,
        position: step.step.position,
        status: step.status,
        parallelGroup: step.step.parallelGroup,
      })));
      if (nextIds.length) {
        await transaction.workflowSubmissionStep.updateMany({ where: { id: { in: nextIds }, status: "PENDING" }, data: { status: "ACTIVE" } });
      }
      nextStatus = currentSteps.some((step) => step.status === "ACTIVE") || nextIds.length ? "IN_REVIEW" : "APPROVED";
    } else {
      nextStatus = input.type === "REJECT" ? "REJECTED" : "CHANGES_REQUESTED";
    }
    return transaction.workflowSubmission.update({
      where: { id: submission.id },
      data: { status: nextStatus, history: { create: { actorUserId: actor.userId, action: input.type, fromStatus: "IN_REVIEW", toStatus: nextStatus, metadataJson: { reason: input.reason } } }, decisions: { create: { actorUserId: actor.userId, stepId: active.stepId, type: input.type, reason: input.reason } } },
    });
  });
}
