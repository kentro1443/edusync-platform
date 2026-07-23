"use server";

import { redirect } from "next/navigation";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import {
  addWorkflowSubmissionComment,
  addWorkflowField,
  addWorkflowStep,
  createWorkflowSubmission,
  createWorkflowTemplate,
  decideWorkflowSubmission,
  publishWorkflowTemplate,
  submitWorkflowSubmission,
  WorkflowAuthorizationError,
  WorkflowValidationError,
} from "@/lib/workflows/workflow-service";

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

function errorCode(error: unknown): string {
  return error instanceof WorkflowAuthorizationError ? "forbidden" : error instanceof WorkflowValidationError ? "invalid" : "error";
}

export async function createWorkflowTemplateAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.workflowTemplateCreate);
  let template: Awaited<ReturnType<typeof createWorkflowTemplate>>;
  try {
    template = await createWorkflowTemplate(actor, { name: value(formData, "name"), description: value(formData, "description") });
  } catch (error) {
    redirect(`/dashboard/workflows?error=${errorCode(error)}`);
  }
  redirect(`/dashboard/workflows/${template.id}?result=created`);
}

export async function addWorkflowFieldAction(formData: FormData): Promise<never> {
  const templateId = value(formData, "templateId");
  const { actor } = await requireSchoolContext(permissions.workflowTemplateUpdateDraft);
  try {
    await addWorkflowField(actor, templateId, {
      key: value(formData, "key"),
      label: value(formData, "label"),
      type: value(formData, "type") as "TEXT" | "TEXTAREA" | "NUMBER" | "DATE" | "SELECT" | "CHECKBOX" | "FILE",
      required: formData.get("required") === "on",
    });
  } catch (error) {
    redirect(`/dashboard/workflows/${templateId}?error=${errorCode(error)}`);
  }
  redirect(`/dashboard/workflows/${templateId}?result=field`);
}

export async function addWorkflowStepAction(formData: FormData): Promise<never> {
  const templateId = value(formData, "templateId");
  const { actor } = await requireSchoolContext(permissions.workflowTemplateUpdateDraft);
  try {
    await addWorkflowStep(actor, templateId, {
      name: value(formData, "name"),
      role: value(formData, "role") as "SCHOOL_ADMIN" | "TEACHER_STAFF" | "MENTOR_COUNSELOR" | "APPROVER_REVIEWER",
      parallelGroup: Number(value(formData, "parallelGroup") || 0) || undefined,
      condition: value(formData, "conditionField")
        ? {
            field: value(formData, "conditionField"),
            operator: value(formData, "conditionOperator") as "equals" | "notEquals" | "truthy" | "falsy",
            value: value(formData, "conditionValue"),
          }
        : undefined,
    });
  } catch (error) {
    redirect(`/dashboard/workflows/${templateId}?error=${errorCode(error)}`);
  }
  redirect(`/dashboard/workflows/${templateId}?result=step`);
}

export async function publishWorkflowTemplateAction(formData: FormData): Promise<never> {
  const templateId = value(formData, "templateId");
  const { actor } = await requireSchoolContext(permissions.workflowTemplatePublish);
  try {
    await publishWorkflowTemplate(actor, templateId);
  } catch (error) {
    redirect(`/dashboard/workflows/${templateId}?error=${errorCode(error)}`);
  }
  redirect(`/dashboard/workflows/${templateId}?result=published`);
}

export async function createWorkflowSubmissionAction(formData: FormData): Promise<never> {
  const templateId = value(formData, "templateId");
  const { actor } = await requireSchoolContext(permissions.workflowSubmissionCreate);
  let submissionId: string;
  try {
    submissionId = await createWorkflowSubmission(actor, templateId);
  } catch (error) {
    redirect(`/dashboard/workflows?error=${errorCode(error)}`);
  }
  redirect(`/dashboard/workflows/submissions/${submissionId}`);
}

export async function submitWorkflowSubmissionAction(formData: FormData): Promise<never> {
  const submissionId = value(formData, "submissionId");
  const values: Record<string, unknown> = {};
  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith("field_")) continue;
    values[key.slice("field_".length)] = raw;
  }
  const { actor } = await requireSchoolContext(permissions.workflowSubmissionUpdate);
  try {
    await submitWorkflowSubmission(actor, submissionId, values);
  } catch (error) {
    redirect(`/dashboard/workflows/submissions/${submissionId}?error=${errorCode(error)}`);
  }
  redirect(`/dashboard/workflows/submissions/${submissionId}?result=submitted`);
}

export async function decideWorkflowSubmissionAction(formData: FormData): Promise<never> {
  const submissionId = value(formData, "submissionId");
  const { actor } = await requireSchoolContext(permissions.workflowSubmissionApprove);
  try {
    await decideWorkflowSubmission(actor, submissionId, {
      type: value(formData, "type") as "APPROVE" | "REJECT" | "REQUEST_CHANGES",
      reason: value(formData, "reason"),
    });
  } catch (error) {
    redirect(`/dashboard/workflows/submissions/${submissionId}?error=${errorCode(error)}`);
  }
  redirect(`/dashboard/workflows/submissions/${submissionId}?result=decision`);
}

export async function addWorkflowSubmissionCommentAction(formData: FormData): Promise<never> {
  const submissionId = value(formData, "submissionId");
  const { actor } = await requireSchoolContext(permissions.workflowSubmissionComment);
  try {
    await addWorkflowSubmissionComment(actor, submissionId, value(formData, "body"));
  } catch (error) {
    redirect(`/dashboard/workflows/submissions/${submissionId}?error=${errorCode(error)}`);
  }
  redirect(`/dashboard/workflows/submissions/${submissionId}?result=comment`);
}
