import { describe, expect, it } from "vitest";

import { parseDemoRequest } from "@/lib/marketing/demo-request";

function validFormData() {
  return new FormData();
}

describe("demo request validation", () => {
  it("normalizes a valid school demo request", () => {
    const formData = validFormData();
    formData.set("fullName", "  Nguyễn Văn An  ");
    formData.set("role", "principal");
    formData.set("school", "  THPT Minh Khai ");
    formData.set("email", " BAN@TRUONG.EDU.VN ");
    formData.set("phone", "0901 234 567");
    formData.set("studentCount", "1500");
    formData.set("modules", "all");
    formData.set("message", "Cần chuẩn hóa quy trình trường học.");

    expect(parseDemoRequest(formData)).toEqual({
      ok: true,
      data: expect.objectContaining({
        fullName: "Nguyễn Văn An",
        schoolName: "THPT Minh Khai",
        email: "ban@truong.edu.vn",
        studentCount: 1500,
      }),
    });
  });

  it("returns field errors without accepting malformed contact data", () => {
    const formData = validFormData();
    formData.set("fullName", "A");
    formData.set("role", "unknown");
    formData.set("school", "X");
    formData.set("email", "khong-hop-le");
    formData.set("studentCount", "-2");
    formData.set("modules", "unknown");

    const result = parseDemoRequest(formData);
    expect(result.ok).toBe(false);
    if (!result.ok && "fieldErrors" in result) {
      expect(result.fieldErrors.fullName).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.fieldErrors.modules).toBeDefined();
    }
  });

  it("silently rejects honeypot submissions", () => {
    const formData = validFormData();
    formData.set("website", "https://spam.invalid");

    expect(parseDemoRequest(formData)).toEqual({ ok: false, bot: true });
  });
});
