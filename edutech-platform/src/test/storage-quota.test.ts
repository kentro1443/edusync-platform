import { describe, expect, it } from "vitest";

import {
  assertWithinStorageQuota,
  computeUsedRatio,
  StorageQuotaExceededError,
} from "@/lib/storage/storage-quota";

describe("assertWithinStorageQuota", () => {
  it("allows a file that fits exactly", () => {
    expect(() => assertWithinStorageQuota(BigInt(75), BigInt(25), BigInt(100))).not
      .toThrow();
  });

  it("rejects a file that would exceed the school quota", () => {
    expect(() =>
      assertWithinStorageQuota(BigInt(76), BigInt(25), BigInt(100)),
    ).toThrow(StorageQuotaExceededError);
  });
});

describe("computeUsedRatio", () => {
  it("computes a fractional ratio", () => {
    expect(computeUsedRatio(BigInt(25), BigInt(100))).toBe(0.25);
  });

  it("clamps to 1 when usage exceeds quota", () => {
    expect(computeUsedRatio(BigInt(150), BigInt(100))).toBe(1);
  });

  it("returns 0 for a zero or negative quota", () => {
    expect(computeUsedRatio(BigInt(10), BigInt(0))).toBe(0);
  });
});
