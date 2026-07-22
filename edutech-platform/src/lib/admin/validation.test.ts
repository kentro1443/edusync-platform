import { describe, expect, it } from "vitest";

import {
  parseMemberFilters,
  parseRoleSelection,
  parseSchoolProvisioning,
  parseSchoolSettings,
} from "@/lib/admin/validation";

describe("admin input validation", () => {
  it("bounds member pagination and accepts known membership status", () => {
    expect(parseMemberFilters({ page: "999", query: "  Nguyễn  ", status: "ACTIVE" })).toEqual({
      page: 999,
      pageSize: 20,
      query: "Nguyễn",
      status: "ACTIVE",
    });
    expect(parseMemberFilters({ page: "-4", pageSize: "500" }).page).toBe(1);
    expect(parseMemberFilters({ pageSize: "500" }).pageSize).toBe(50);
  });

  it("deduplicates role selections and rejects empty lists", () => {
    expect(parseRoleSelection(["TEACHER_STAFF", "TEACHER_STAFF"])).toEqual({
      success: true,
      roles: ["TEACHER_STAFF"],
    });
    expect(parseRoleSelection([])).toEqual({ success: false });
  });

  it("normalizes a safe school slug and administrator email", () => {
    expect(
      parseSchoolProvisioning({
        name: " Trường THPT Ánh Dương ",
        shortName: " Ánh Dương ",
        slug: "thpt-anh-duong",
        adminEmail: " ADMIN@ANHDUONG.EDU.VN ",
      }),
    ).toEqual({
      success: true,
      data: {
        name: "Trường THPT Ánh Dương",
        shortName: "Ánh Dương",
        slug: "thpt-anh-duong",
        adminEmail: "admin@anhduong.edu.vn",
      },
    });
  });

  it("validates and normalizes school settings", () => {
    expect(
      parseSchoolSettings({
        name: " Trường THPT Minh Tâm ",
        shortName: " Minh Tâm ",
        contactEmail: " VANPHONG@MINHTAM.EDU.VN ",
      }),
    ).toEqual({
      success: true,
      data: {
        name: "Trường THPT Minh Tâm",
        shortName: "Minh Tâm",
        contactEmail: "vanphong@minhtam.edu.vn",
      },
    });
    expect(
      parseSchoolSettings({ name: "A", shortName: "B", contactEmail: "sai" }),
    ).toEqual({ success: false });
  });
});
