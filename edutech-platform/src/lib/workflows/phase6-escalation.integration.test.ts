import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { escalateOverdueWorkflowSteps } from "@/lib/workflows/workflow-service";

describe.sequential("Phase 6 workflow escalation", () => {
  const suffix = randomUUID().slice(0, 8);
  const schoolId = randomUUID();
  const ownerId = randomUUID();
  const templateId = randomUUID();
  const versionId = randomUUID();
  const stepId = randomUUID();
  const submissionId = randomUUID();
  const submissionStepId = randomUUID();

  beforeAll(async () => {
    await db.school.create({
      data: { id: schoolId, slug: `wf-esc-${suffix}`, name: `Trường WF ${suffix}`, shortName: "WF" },
    });
    await db.user.create({
      data: { id: ownerId, email: `owner-${suffix}@wf.local`, normalizedEmail: `owner-${suffix}@wf.local`, displayName: "Người nộp", passwordHash: "x", mustChangePassword: false },
    });
    await db.workflowTemplate.create({
      data: { id: templateId, schoolId, createdById: ownerId, name: "Đơn test", slug: `don-test-${suffix}`, status: "PUBLISHED", currentVersionId: versionId },
    });
    await db.workflowVersion.create({ data: { id: versionId, templateId, version: 1, publishedAt: new Date() } });
    await db.workflowApprovalStep.create({
      data: { id: stepId, versionId, name: "Duyệt", position: 0, role: "SCHOOL_ADMIN", deadlineHours: 24 },
    });
    await db.workflowSubmission.create({
      data: { id: submissionId, schoolId, templateId, versionId, ownerUserId: ownerId, status: "IN_REVIEW", submittedAt: new Date() },
    });
    await db.workflowSubmissionStep.create({
      data: {
        id: submissionStepId,
        submissionId,
        stepId,
        status: "ACTIVE",
        dueAt: new Date(Date.now() - 60 * 60 * 1000), // overdue by an hour
      },
    });
  });

  afterAll(async () => {
    await db.domainOutboxEvent.deleteMany({ where: { schoolId } });
    await db.workflowSubmissionStep.deleteMany({ where: { submissionId } });
    await db.workflowSubmission.deleteMany({ where: { schoolId } });
    await db.workflowApprovalStep.deleteMany({ where: { versionId } });
    await db.workflowVersion.deleteMany({ where: { templateId } });
    await db.workflowTemplate.deleteMany({ where: { schoolId } });
    await db.user.deleteMany({ where: { id: ownerId } });
    await db.school.deleteMany({ where: { id: schoolId } });
  });

  it("escalates an overdue active step once and emits a durable outbox event", async () => {
    const first = await escalateOverdueWorkflowSteps();
    expect(first).toBeGreaterThanOrEqual(1);
    const step = await db.workflowSubmissionStep.findUniqueOrThrow({ where: { id: submissionStepId } });
    expect(step.escalatedAt).not.toBeNull();
    const outbox = await db.domainOutboxEvent.findFirst({
      where: { schoolId, eventType: "workflow.step.overdue", aggregateId: submissionId },
    });
    expect(outbox).not.toBeNull();

    // Idempotent: a second run does not re-escalate the same step.
    const before = await db.domainOutboxEvent.count({ where: { schoolId, eventType: "workflow.step.overdue" } });
    await escalateOverdueWorkflowSteps();
    const after = await db.domainOutboxEvent.count({ where: { schoolId, eventType: "workflow.step.overdue" } });
    expect(after).toBe(before);
  });
});
