import type { AuthenticatedSession } from "@/lib/auth/session";

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

  if (session.schoolContexts.length > 1) {
    return "/chon-truong";
  }

  return "/dashboard";
}