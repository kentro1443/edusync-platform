import "dotenv/config";

import { sendDueCalendarReminders } from "../src/lib/calendar/calendar-service";
import { db } from "../src/lib/db";
import { logEvent } from "../src/lib/observability/logger";

async function main() {
  const sent = await sendDueCalendarReminders();
  logEvent("info", "calendar.reminders.completed", { sent });
}

main()
  .catch((error: unknown) => {
    logEvent("error", "calendar.reminders.failed", {
      message: error instanceof Error ? error.message : "Calendar reminder worker failed.",
    });
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
