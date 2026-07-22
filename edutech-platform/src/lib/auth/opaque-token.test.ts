import { describe, expect, it } from "vitest";

import {
  createOpaqueToken,
  hashOpaqueToken,
  isUsableToken,
} from "@/lib/auth/opaque-token";

describe("opaque auth tokens", () => {
  it("creates high-entropy URL-safe tokens and stores only their hash", () => {
    const token = createOpaqueToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(hashOpaqueToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashOpaqueToken(token)).not.toContain(token);
  });

  it("accepts only unconsumed, unrevoked and unexpired records", () => {
    const now = new Date("2026-07-23T02:00:00.000Z");
    expect(
      isUsableToken(
        { expiresAt: new Date("2026-07-23T02:01:00.000Z"), usedAt: null, revokedAt: null },
        now,
      ),
    ).toBe(true);
    expect(
      isUsableToken(
        { expiresAt: now, usedAt: null, revokedAt: null },
        now,
      ),
    ).toBe(false);
    expect(
      isUsableToken(
        { expiresAt: new Date("2026-07-23T03:00:00.000Z"), usedAt: now, revokedAt: null },
        now,
      ),
    ).toBe(false);
  });
});
