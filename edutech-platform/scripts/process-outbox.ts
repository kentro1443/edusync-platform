import "dotenv/config";

import {
  processDomainOutboxBatch,
  processEmailOutboxBatch,
} from "../src/lib/notifications/outbox-service";
import { db } from "../src/lib/db";
import { logEvent } from "../src/lib/observability/logger";

async function main() {
  const domain = await processDomainOutboxBatch({ limit: 100 });
  const email = await processEmailOutboxBatch({ limit: 100 });
  logEvent("info", "outbox.batch.completed", { domain, email });
}

main()
  .catch((error: unknown) => {
    logEvent("error", "outbox.batch.failed", {
      message: error instanceof Error ? error.message : "Outbox worker failed.",
    });
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
