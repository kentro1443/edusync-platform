import { describe, expect, it } from "vitest";

import {
  assertWithinStorageQuota,
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
