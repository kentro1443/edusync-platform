import type { AuthenticatedSession } from "@/lib/auth/session";
import { isDevOperatorAccount } from "@/lib/auth/dev-mode";

export function sanitizeReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

export function getAuthenticatedLandingPath(
  session: AuthenticatedSession,
): string {
  if (session.user.mustChangePassword) {
    return "/doi-mat-khau";
  }

  if (isDevOperatorAccount(session.user.accountKind)) {
    return "/dev/switch";
  }

  if (session.schoolContexts.length > 1) {
    return "/chon-truong";
  }

  return "/dashboard";
}
