import { describe, expect, it } from "vitest";

import {
  buildBreadcrumbs,
  getPrimaryRoleLabel,
  translateRole,
} from "@/components/app/shell-utils";

describe("app shell helpers", () => {
  it("builds Vietnamese breadcrumbs from the current application route", () => {
    expect(
      buildBreadcrumbs("/dashboard/admin/members/123", [
        { href: "/dashboard", label: "Tổng quan", icon: "overview" },
        {
          href: "/dashboard/admin/members",
          label: "Thành viên",
          icon: "members",
        },
      ]),
    ).toEqual([
      { href: "/dashboard", label: "Tổng quan" },
      { href: "/dashboard/admin/members", label: "Thành viên" },
      { label: "Chi tiết" },
    ]);
  });

  it("translates persisted role codes instead of exposing English identifiers", () => {
    expect(translateRole("SCHOOL_ADMIN")).toBe("Quản trị trường");
    expect(translateRole("PARENT_GUARDIAN")).toBe("Phụ huynh");
    expect(translateRole("PLATFORM_SUPER_ADMIN")).toBe("Quản trị nền tảng");
  });

  it("selects the highest responsibility role for dashboard presentation", () => {
    expect(getPrimaryRoleLabel(["TEACHER_STAFF", "MENTOR_COUNSELOR"])).toBe(
      "Giáo viên & nhân viên",
    );
    expect(getPrimaryRoleLabel([])).toBe("Quản trị nền tảng");
  });
});
