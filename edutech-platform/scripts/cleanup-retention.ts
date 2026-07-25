import "dotenv/config";

import { db } from "../src/lib/db";
import { runRetentionCleanup } from "../src/lib/maintenance/cleanup-service";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const result = await runRetentionCleanup({ dryRun });
  console.log(JSON.stringify(result));
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Retention cleanup failed.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
