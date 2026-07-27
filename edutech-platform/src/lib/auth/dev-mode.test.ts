import { describe, expect, it } from "vitest";

import {
  isDevModeEnabled,
  isDevOperatorAccount,
} from "@/lib/auth/dev-mode";

describe("dev mode safety gate", () => {
  it("enables account switching only outside production", () => {
    expect(isDevModeEnabled("development")).toBe(true);
    expect(isDevModeEnabled("test")).toBe(true);
    expect(isDevModeEnabled("production")).toBe(false);
  });

  it("requires the persisted developer account kind", () => {
    expect(isDevOperatorAccount("DEV_OPERATOR", "development")).toBe(true);
    expect(isDevOperatorAccount("DEMO", "development")).toBe(false);
    expect(isDevOperatorAccount("STANDARD", "development")).toBe(false);
    expect(isDevOperatorAccount("DEV_OPERATOR", "production")).toBe(false);
  });
});
