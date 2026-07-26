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

/** Validate a club expense against the approved budget. Throws on invalid/over-budget. */
export function assertExpenseWithinBudget(amount: number, spent: number, budget: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ClubValidationError("Số tiền chi tiêu không hợp lệ.");
  }
  if (spent + amount > budget) {
    throw new ClubValidationError("Chi tiêu vượt quá ngân sách được duyệt.");
  }
}

export type ClubTaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";

const clubTaskTransitions: Record<ClubTaskStatus, readonly ClubTaskStatus[]> = {
  TODO: ["IN_PROGRESS", "DONE", "CANCELLED"],
  IN_PROGRESS: ["DONE", "CANCELLED", "TODO"],
  DONE: ["IN_PROGRESS"],
  CANCELLED: ["TODO"],
};

/** Whether a club task may move from one status to another. */
export function canTransitionClubTask(from: ClubTaskStatus, to: ClubTaskStatus): boolean {
  return from === to || clubTaskTransitions[from].includes(to);
}

