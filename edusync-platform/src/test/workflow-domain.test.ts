import { describe, expect, it } from "vitest";

import {
  computeStepDueAt,
  evaluateWorkflowCondition,
  getNextWorkflowStep,
  getNextWorkflowStepIds,
  isStepEscalatable,
  resolveWorkflowRouting,
  validateWorkflowValues,
  type WorkflowField,
  type WorkflowStep,
} from "@/lib/workflows/workflow-domain";

const fields: WorkflowField[] = [
  { key: "title", label: "Tiêu đề", type: "TEXT", required: true },
  { key: "urgent", label: "Khẩn cấp", type: "CHECKBOX", required: false },
];

describe("workflow domain", () => {
  it("evaluates conditional routing against submitted values", () => {
    expect(evaluateWorkflowCondition({ field: "amount", operator: "equals", value: "100" }, { amount: 100 })).toBe(true);
    expect(evaluateWorkflowCondition({ field: "urgent", operator: "truthy" }, { urgent: true })).toBe(true);
    expect(evaluateWorkflowCondition({ field: "urgent", operator: "falsy" }, { urgent: false })).toBe(true);
    expect(evaluateWorkflowCondition({}, { amount: 100 })).toBe(true);
  });

  it("skips false conditions and activates all members of a parallel group", () => {
    const routed = resolveWorkflowRouting(
      [
        { id: "conditional", position: 0, status: "PENDING", condition: { field: "kind", operator: "equals", value: "VIP" } },
        { id: "first", position: 1, status: "PENDING" },
        { id: "second", position: 2, status: "PENDING", parallelGroup: 1 },
        { id: "third", position: 3, status: "PENDING", parallelGroup: 1 },
      ],
      { kind: "STANDARD" },
    );
    expect(routed).toEqual([
      { id: "conditional", status: "SKIPPED" },
      { id: "first", status: "ACTIVE" },
      { id: "second", status: "PENDING" },
      { id: "third", status: "PENDING" },
    ]);
    expect(getNextWorkflowStepIds([
      { id: "first", position: 1, status: "APPROVED" },
      { id: "second", position: 2, status: "PENDING", parallelGroup: 1 },
      { id: "third", position: 3, status: "PENDING", parallelGroup: 1 },
    ])).toEqual(["second", "third"]);
  });

  it("returns no active step when every conditional branch is skipped", () => {
    expect(resolveWorkflowRouting(
      [{ id: "only", position: 0, status: "PENDING", condition: { field: "approved", operator: "truthy" } }],
      { approved: false },
    )).toEqual([{ id: "only", status: "SKIPPED" }]);
  });

  it("returns a validation summary for required fields", () => {
    expect(validateWorkflowValues(fields, {})).toEqual({
      valid: false,
      errors: { title: "Tiêu đề là bắt buộc." },
    });
    expect(validateWorkflowValues(fields, { title: "Xin cấp phòng", urgent: true })).toEqual({
      valid: true,
      errors: {},
    });
  });

  it("routes sequential approval to first pending step", () => {
    const steps: WorkflowStep[] = [
      { id: "one", position: 0, status: "APPROVED" },
      { id: "two", position: 1, status: "PENDING" },
      { id: "three", position: 2, status: "PENDING" },
    ];
    expect(getNextWorkflowStep(steps)?.id).toBe("two");
  });

  it("computes step deadlines from SLA hours", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    expect(computeStepDueAt(24, from)?.toISOString()).toBe("2026-01-02T00:00:00.000Z");
    expect(computeStepDueAt(0, from)).toBeNull();
    expect(computeStepDueAt(null, from)).toBeNull();
  });

  it("flags only overdue, active, not-yet-escalated steps", () => {
    const now = new Date("2026-01-02T00:00:00.000Z");
    const due = new Date("2026-01-01T00:00:00.000Z");
    expect(isStepEscalatable({ status: "ACTIVE", dueAt: due, escalatedAt: null }, now)).toBe(true);
    expect(isStepEscalatable({ status: "PENDING", dueAt: due, escalatedAt: null }, now)).toBe(false);
    expect(isStepEscalatable({ status: "ACTIVE", dueAt: due, escalatedAt: now }, now)).toBe(false);
    expect(isStepEscalatable({ status: "ACTIVE", dueAt: null, escalatedAt: null }, now)).toBe(false);
  });
});
