import { describe, expect, it } from "vitest";

import { validateResetPassword } from "@/lib/auth/password-reset";

describe("password reset validation", () => {
  it("accepts a strong matching password", () => {
    expect(
      validateResetPassword({
        password: "Mat-khau-moi-2026!",
        confirmPassword: "Mat-khau-moi-2026!",
      }),
    ).toEqual({ success: true, password: "Mat-khau-moi-2026!" });
  });

  it.each([
    [{ password: "ngan", confirmPassword: "ngan" }, "weak"],
    [
      { password: "Mat-khau-moi-2026!", confirmPassword: "Khong-trung-2026!" },
      "mismatch",
    ],
    [{ password: null, confirmPassword: null }, "missing"],
  ] as const)("rejects invalid reset data", (input, error) => {
    expect(validateResetPassword(input)).toEqual({ success: false, error });
  });
});
