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

export type WorkflowCondition = Readonly<{
  field?: string;
  operator?: "equals" | "notEquals" | "truthy" | "falsy";
  value?: unknown;
}>;

export type WorkflowStep = Readonly<{
  id: string;
  position: number;
  status: "PENDING" | "ACTIVE" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "SKIPPED";
  condition?: WorkflowCondition;
  parallelGroup?: number | null;
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

export function evaluateWorkflowCondition(
  condition: WorkflowCondition | null | undefined,
  values: Readonly<Record<string, unknown>>,
): boolean {
  if (!condition?.field || !condition.operator) return true;
  const current = values[condition.field];
  if (condition.operator === "truthy") return Boolean(current);
  if (condition.operator === "falsy") return !current;
  if (condition.operator === "equals") return String(current ?? "") === String(condition.value ?? "");
  return String(current ?? "") !== String(condition.value ?? "");
}

export function resolveWorkflowRouting(
  steps: readonly WorkflowStep[],
  values: Readonly<Record<string, unknown>>,
): Array<{ id: string; status: WorkflowStep["status"] }> {
  const sorted = [...steps].sort((left, right) => left.position - right.position);
  const routable = sorted.filter((step) => evaluateWorkflowCondition(step.condition, values));
  const first = routable[0];
  const activeIds = first?.parallelGroup == null
    ? new Set(first ? [first.id] : [])
    : new Set(routable.filter((step) => step.parallelGroup === first.parallelGroup).map((step) => step.id));
  return sorted.map((step) => ({
    id: step.id,
    status: !evaluateWorkflowCondition(step.condition, values)
      ? "SKIPPED"
      : activeIds.has(step.id)
        ? "ACTIVE"
        : "PENDING",
  }));
}

export function getNextWorkflowStepIds(steps: readonly WorkflowStep[]): string[] {
  if (steps.some((step) => step.status === "ACTIVE")) return [];
  const next = getNextWorkflowStep(steps);
  if (!next) return [];
  if (next.parallelGroup == null) return [next.id];
  return steps
    .filter((step) => step.parallelGroup === next.parallelGroup && ["PENDING", "CHANGES_REQUESTED"].includes(step.status))
    .sort((left, right) => left.position - right.position)
    .map((step) => step.id);
}
