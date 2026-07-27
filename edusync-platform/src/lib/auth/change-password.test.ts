import { describe, expect, it } from "vitest";

import { validatePasswordChange } from "@/lib/auth/change-password";

describe("đổi mật khẩu lần đầu", () => {
  it("chấp nhận mật khẩu mới hợp lệ và trùng khớp", () => {
    expect(
      validatePasswordChange({
        currentPassword: "EduSync-Demo-2026!",
        newPassword: "Mat-khau-moi-2026!",
        confirmPassword: "Mat-khau-moi-2026!",
      }),
    ).toEqual({
      success: true,
      data: {
        currentPassword: "EduSync-Demo-2026!",
        newPassword: "Mat-khau-moi-2026!",
      },
    });
  });

  it("từ chối khi thiếu trường dữ liệu", () => {
    expect(
      validatePasswordChange({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }),
    ).toEqual({
      success: false,
      error: "missing",
    });
  });

  it("từ chối mật khẩu mới ngắn hơn 12 ký tự", () => {
    expect(
      validatePasswordChange({
        currentPassword: "EduSync-Demo-2026!",
        newPassword: "Ngan-2026!",
        confirmPassword: "Ngan-2026!",
      }),
    ).toEqual({
      success: false,
      error: "weak",
    });
  });

  it("từ chối khi xác nhận mật khẩu không khớp", () => {
    expect(
      validatePasswordChange({
        currentPassword: "EduSync-Demo-2026!",
        newPassword: "Mat-khau-moi-2026!",
        confirmPassword: "Khong-trung-2026!",
      }),
    ).toEqual({
      success: false,
      error: "mismatch",
    });
  });

  it("từ chối dùng lại mật khẩu hiện tại", () => {
    expect(
      validatePasswordChange({
        currentPassword: "EduSync-Demo-2026!",
        newPassword: "EduSync-Demo-2026!",
        confirmPassword: "EduSync-Demo-2026!",
      }),
    ).toEqual({
      success: false,
      error: "reused",
    });
  });
});