export type ClubStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type ClubApplicationStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
export type ClubMembershipStatus = "PENDING" | "ACTIVE" | "LEFT" | "REJECTED";
export type ClubEventStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";
export type ClubRegistrationStatus = "REGISTERED" | "WAITLISTED" | "CANCELLED";
export type ClubConsentStatus = "PENDING" | "APPROVED" | "DECLINED";

export class ClubValidationError extends Error {}

export function validateClubName(name: string): string {
  const normalized = name.trim().replace(/\s+/g, " ");
  if (normalized.length < 2 || normalized.length > 120) {
    throw new ClubValidationError("Tên câu lạc bộ phải dài 2–120 ký tự.");
  }
  return normalized;
}

export function validateClubEventRange(startsAt: Date, endsAt: Date, now = new Date()): void {
  if (
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime()) ||
    startsAt >= endsAt ||
    startsAt <= now
  ) {
    throw new ClubValidationError("Thời gian sự kiện không hợp lệ.");
  }
}

export function nextClubWaitlistPosition(positions: readonly (number | null)[]): number {
  return Math.max(0, ...positions.map((position) => position ?? 0)) + 1;
}

export function resolveClubRegistration(
  capacity: number,
  registeredCount: number,
  positions: readonly (number | null)[],
): { status: ClubRegistrationStatus; position: number | null } {
  if (capacity > 0 && registeredCount >= capacity) {
    return { status: "WAITLISTED", position: nextClubWaitlistPosition(positions) };
  }
  return { status: "REGISTERED", position: null };
}

export function canApproveClubConsent(
  consent: { studentId: string; guardianId: string },
  linkedStudentIds: readonly string[],
  actorUserId: string,
): boolean {
  return consent.guardianId === actorUserId && linkedStudentIds.includes(consent.studentId);
}

