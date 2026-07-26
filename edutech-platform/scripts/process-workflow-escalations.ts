import "dotenv/config";

import { escalateOverdueWorkflowSteps } from "../src/lib/workflows/workflow-service";
import { db } from "../src/lib/db";

async function main() {
  const escalated = await escalateOverdueWorkflowSteps();
  console.log(JSON.stringify({ escalated }));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Workflow escalation worker failed.");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
