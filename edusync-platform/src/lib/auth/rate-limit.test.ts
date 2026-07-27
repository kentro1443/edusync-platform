import { describe, expect, it } from "vitest";

import { evaluateRateLimit } from "@/lib/auth/rate-limit";

describe("auth rate-limit policy", () => {
  const config = { maxAttempts: 5, windowMs: 60_000, blockMs: 300_000 };
  const now = new Date("2026-07-23T02:00:00.000Z");

  it("starts a fresh window after the previous window expires", () => {
    expect(
      evaluateRateLimit(
        { attempts: 5, windowStart: new Date("2026-07-23T01:58:00.000Z"), blockedUntil: null },
        config,
        now,
      ),
    ).toEqual({ allowed: true, attempts: 0, windowStart: now, blockedUntil: null });
  });

  it("blocks while blockedUntil is in the future", () => {
    const result = evaluateRateLimit(
      { attempts: 5, windowStart: now, blockedUntil: new Date("2026-07-23T02:03:00.000Z") },
      config,
      now,
    );
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(180);
  });

  it("permits attempts below the configured threshold", () => {
    expect(
      evaluateRateLimit(
        { attempts: 4, windowStart: now, blockedUntil: null },
        config,
        now,
      ).allowed,
    ).toBe(true);
  });
});
