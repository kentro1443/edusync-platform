import { describe, expect, it } from "vitest";

import {
  getAuthenticatedLandingPath,
  sanitizeReturnPath,
} from "@/lib/auth/navigation";
import type { AuthenticatedSession } from "@/lib/auth/session";

function createSession(
  overrides: Partial<AuthenticatedSession> = {},
): AuthenticatedSession {
  return {
    sessionId: "session-1",
    user: {
      id: "user-1",
      email: "hoc-sinh@demo.edu.vn",
      displayName: "Nguyễn Minh An",
      mustChangePassword: false,
      accountKind: "STANDARD",
    },
    operatorUser: null,
    expires: new Date("2027-01-01T00:00:00.000Z"),
    platformRoles: [],
    schoolContexts: [],
    ...overrides,
  };
}

describe("điều hướng sau xác thực", () => {
  it("buộc đổi mật khẩu trước khi truy cập workspace", () => {
    const session = createSession({
      user: {
        id: "user-1",
        email: "hoc-sinh@demo.edu.vn",
        displayName: "Nguyễn Minh An",
        mustChangePassword: true,
        accountKind: "STANDARD",
      },
    });

    expect(getAuthenticatedLandingPath(session)).toBe("/doi-mat-khau");
  });

  it("đưa người dùng có một trường vào dashboard", () => {
    const session = createSession({
      schoolContexts: [
        {
          membershipId: "membership-1",
          schoolId: "school-1",
          schoolSlug: "thpt-minh-khai",
          schoolName: "THPT Minh Khai",
          roles: ["STUDENT"],
        },
      ],
    });

    expect(getAuthenticatedLandingPath(session)).toBe("/dashboard");
  });

  it("yêu cầu chọn trường khi người dùng có nhiều membership", () => {
    const schoolContext = {
      membershipId: "membership-1",
      schoolId: "school-1",
      schoolSlug: "thpt-minh-khai",
      schoolName: "THPT Minh Khai",
      roles: ["STUDENT"] as const,
    };
    const session = createSession({
      schoolContexts: [
        schoolContext,
        {
          ...schoolContext,
          membershipId: "membership-2",
          schoolId: "school-2",
          schoolSlug: "thpt-nguyen-du",
          schoolName: "THPT Nguyễn Du",
        },
      ],
    });

    expect(getAuthenticatedLandingPath(session)).toBe("/chon-truong");
  });

  it("cho platform admin không có membership vào dashboard", () => {
    const session = createSession({
      platformRoles: ["PLATFORM_SUPER_ADMIN"],
    });

    expect(getAuthenticatedLandingPath(session)).toBe("/dashboard");
  });

  it("đưa tài khoản phát triển vào bộ chọn tài khoản", () => {
    const session = createSession({
      user: {
        id: "dev-user",
        email: "dev@edutech.local",
        displayName: "Nhà phát triển EduTech",
        mustChangePassword: false,
        accountKind: "DEV_OPERATOR",
      },
    });

    expect(getAuthenticatedLandingPath(session)).toBe("/dev/switch");
  });
});

describe("đường dẫn quay lại an toàn", () => {
  it("chỉ chấp nhận đường dẫn nội bộ tương đối", () => {
    expect(sanitizeReturnPath("/dashboard/resources?tab=saved")).toBe(
      "/dashboard/resources?tab=saved",
    );
  });

  it.each([
    "https://evil.example/steal",
    "//evil.example/steal",
    "javascript:alert(1)",
    "dashboard",
    "",
  ])("từ chối đường dẫn không an toàn: %s", (value) => {
    expect(sanitizeReturnPath(value)).toBeNull();
  });
});
