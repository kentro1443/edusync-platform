export const minimumPasswordLength = 12;

export type PasswordChangeError =
  | "missing"
  | "weak"
  | "mismatch"
  | "reused";

type PasswordChangeInput = {
  currentPassword: unknown;
  newPassword: unknown;
  confirmPassword: unknown;
};

type PasswordChangeValidationResult =
  | {
      success: true;
      data: {
        currentPassword: string;
        newPassword: string;
      };
    }
  | {
      success: false;
      error: PasswordChangeError;
    };

export function validatePasswordChange(
  input: PasswordChangeInput,
): PasswordChangeValidationResult {
  if (
    typeof input.currentPassword !== "string" ||
    typeof input.newPassword !== "string" ||
    typeof input.confirmPassword !== "string" ||
    !input.currentPassword ||
    !input.newPassword ||
    !input.confirmPassword
  ) {
    return { success: false, error: "missing" };
  }

  if (input.newPassword.length < minimumPasswordLength) {
    return { success: false, error: "weak" };
  }

  if (input.newPassword !== input.confirmPassword) {
    return { success: false, error: "mismatch" };
  }

  if (input.newPassword === input.currentPassword) {
    return { success: false, error: "reused" };
  }

  return {
    success: true,
    data: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    },
  };
}