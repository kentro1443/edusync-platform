import { describe, expect, it } from "vitest";

import {
  ResourceTransitionError,
  ResourceValidationError,
  transitionResourceStatus,
  validateResourceTitle,
  validateUploadMetadata,
} from "@/lib/resources/resource-domain";

describe("resource domain", () => {
  it("enforces draft → review → publish lifecycle", () => {
    expect(transitionResourceStatus("DRAFT", "SUBMIT_REVIEW")).toBe("PENDING_REVIEW");
    expect(transitionResourceStatus("PENDING_REVIEW", "APPROVE")).toBe("PUBLISHED");
    expect(transitionResourceStatus("PUBLISHED", "ARCHIVE")).toBe("ARCHIVED");
    expect(transitionResourceStatus("ARCHIVED", "RESTORE")).toBe("DRAFT");
  });

  it("rejects invalid lifecycle transitions", () => {
    expect(() => transitionResourceStatus("PUBLISHED", "APPROVE")).toThrow(ResourceTransitionError);
  });

  it("validates safe titles and upload metadata", () => {
    expect(validateResourceTitle("  Hướng dẫn học tập  ")).toBe("Hướng dẫn học tập");
    expect(() =>
      validateResourceTitle("x"),
    ).toThrow(ResourceValidationError);
    expect(() =>
      validateUploadMetadata({
        originalName: "../secret.pdf",
        mimeType: "application/pdf",
        sizeBytes: 100,
        maxBytes: 1_000,
      }),
    ).toThrow(ResourceValidationError);
    expect(() =>
      validateUploadMetadata({
        originalName: "huong-dan.exe",
        mimeType: "application/x-msdownload",
        sizeBytes: 100,
        maxBytes: 1_000,
      }),
    ).toThrow(ResourceValidationError);
  });
});
