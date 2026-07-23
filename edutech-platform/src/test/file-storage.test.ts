import { describe, expect, it } from "vitest";

import { contentDisposition } from "@/lib/storage/file-storage";

describe("file response headers", () => {
  it("keeps Vietnamese filenames valid and strips header injection characters", () => {
    const header = contentDisposition("inline", 'Hồ sơ "tháng 7"\r\n.pdf');

    expect(header).toContain('inline; filename="Ho so _thang 7___');
    expect(header).toContain("filename*=UTF-8''H%E1%BB%93%20s%C6%A1");
    expect(header).not.toContain("\r");
    expect(header).not.toContain("\n");
  });
});
