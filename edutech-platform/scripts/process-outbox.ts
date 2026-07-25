import "dotenv/config";

import {
  processDomainOutboxBatch,
  processEmailOutboxBatch,
} from "../src/lib/notifications/outbox-service";
import { db } from "../src/lib/db";

async function main() {
  const domain = await processDomainOutboxBatch({ limit: 100 });
  const email = await processEmailOutboxBatch({ limit: 100 });
  console.log(JSON.stringify({ domain, email }));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Outbox worker failed.");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
