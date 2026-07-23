export type WorkflowFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "DATE"
  | "SELECT"
  | "CHECKBOX"
  | "FILE";

export type WorkflowField = Readonly<{
  key: string;
  label: string;
  type: WorkflowFieldType;
  required: boolean;
}>;

export type WorkflowStep = Readonly<{
  id: string;
  position: number;
  status: "PENDING" | "ACTIVE" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "SKIPPED";
}>;

export function validateWorkflowValues(
  fields: readonly WorkflowField[],
  values: Readonly<Record<string, unknown>>,
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (!field.required) continue;
    const value = values[field.key];
    if (value === undefined || value === null || String(value).trim() === "") {
      errors[field.key] = `${field.label} là bắt buộc.`;
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function getNextWorkflowStep(steps: readonly WorkflowStep[]): WorkflowStep | undefined {
  return [...steps]
    .filter((step) => ["PENDING", "ACTIVE", "CHANGES_REQUESTED"].includes(step.status))
    .sort((left, right) => left.position - right.position)[0];
}
