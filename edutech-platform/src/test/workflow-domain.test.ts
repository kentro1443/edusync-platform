import { describe, expect, it } from "vitest";

import {
  getNextWorkflowStep,
  validateWorkflowValues,
  type WorkflowField,
  type WorkflowStep,
} from "@/lib/workflows/workflow-domain";

const fields: WorkflowField[] = [
  { key: "title", label: "Tiêu đề", type: "TEXT", required: true },
  { key: "urgent", label: "Khẩn cấp", type: "CHECKBOX", required: false },
];

describe("workflow domain", () => {
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
});
