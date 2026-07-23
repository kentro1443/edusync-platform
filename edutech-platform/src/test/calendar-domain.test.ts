import { describe, expect, it } from "vitest";

import {
  expandRecurringEvent,
  hasTimeConflict,
  nextWaitlistPosition,
} from "@/lib/calendar/calendar-domain";

describe("calendar domain", () => {
  it("expands weekly events and applies cancelled/moved exceptions", () => {
    const startsAt = new Date("2026-08-03T09:00:00.000Z");
    const endsAt = new Date("2026-08-03T10:00:00.000Z");
    const instances = expandRecurringEvent({
      startsAt,
      endsAt,
      frequency: "WEEKLY",
      interval: 1,
      count: 3,
      exceptions: [
        { startsAt: "2026-08-10T09:00:00.000Z", cancelled: true },
        { startsAt: "2026-08-17T09:00:00.000Z", movedTo: "2026-08-18T09:00:00.000Z" },
      ],
    });

    expect(instances).toEqual([
      { startsAt: "2026-08-03T09:00:00.000Z", endsAt: "2026-08-03T10:00:00.000Z" },
      { startsAt: "2026-08-18T09:00:00.000Z", endsAt: "2026-08-18T10:00:00.000Z" },
    ]);
  });

  it("detects overlapping ranges, including touching boundaries safely", () => {
    const current = {
      startsAt: new Date("2026-08-03T09:00:00.000Z"),
      endsAt: new Date("2026-08-03T10:00:00.000Z"),
    };
    expect(hasTimeConflict(current, {
      startsAt: new Date("2026-08-03T09:59:00.000Z"),
      endsAt: new Date("2026-08-03T11:00:00.000Z"),
    })).toBe(true);
    expect(hasTimeConflict(current, {
      startsAt: new Date("2026-08-03T10:00:00.000Z"),
      endsAt: new Date("2026-08-03T11:00:00.000Z"),
    })).toBe(false);
  });

  it("chooses deterministic waitlist positions", () => {
    expect(nextWaitlistPosition([3, 1, 2])).toBe(4);
    expect(nextWaitlistPosition([])).toBe(1);
  });
});
