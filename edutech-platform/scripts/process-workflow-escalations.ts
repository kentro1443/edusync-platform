import "dotenv/config";

import { escalateOverdueWorkflowSteps } from "../src/lib/workflows/workflow-service";
import { db } from "../src/lib/db";
import { logEvent } from "../src/lib/observability/logger";

async function main() {
  const escalated = await escalateOverdueWorkflowSteps();
  logEvent("info", "workflows.escalation.completed", { escalated });
}

main()
  .catch((error: unknown) => {
    logEvent("error", "workflows.escalation.failed", {
      message: error instanceof Error ? error.message : "Workflow escalation worker failed.",
    });
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
