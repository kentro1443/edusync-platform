import { describe, expect, it } from "vitest";

import { buildRetentionCutoffs } from "@/lib/maintenance/retention-policy";

describe("buildRetentionCutoffs", () => {
  it("derives stable UTC cutoffs from one clock value", () => {
    const now = new Date("2026-07-23T12:00:00.000Z");

    expect(buildRetentionCutoffs(now)).toEqual({
      now,
      staleSession: new Date("2026-06-23T12:00:00.000Z"),
      staleToken: new Date("2026-07-16T12:00:00.000Z"),
      staleRateLimit: new Date("2026-07-22T12:00:00.000Z"),
      staleNotification: new Date("2026-01-24T12:00:00.000Z"),
      staleDelivery: new Date("2026-06-23T12:00:00.000Z"),
      staleFailedDelivery: new Date("2026-04-24T12:00:00.000Z"),
      staleInvitation: new Date("2026-04-24T12:00:00.000Z"),
    });
  });

  it("does not mutate the supplied date", () => {
    const now = new Date("2026-07-23T12:00:00.000Z");
    buildRetentionCutoffs(now);
    expect(now.toISOString()).toBe("2026-07-23T12:00:00.000Z");
  });
});
