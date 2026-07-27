import { describe, expect, it } from "vitest";

import {
  ClubValidationError,
  assertExpenseWithinBudget,
  canApproveClubConsent,
  canTransitionClubTask,
  nextClubWaitlistPosition,
  resolveClubRegistration,
  validateClubEventRange,
  validateClubName,
} from "@/lib/clubs/club-domain";

describe("club domain", () => {
  it("normalizes and validates club names", () => {
    expect(validateClubName("  Robotics   Lab ")).toBe("Robotics Lab");
    expect(() => validateClubName("x")).toThrow("Tên câu lạc bộ");
  });

  it("rejects past or inverted event ranges", () => {
    expect(() =>
      validateClubEventRange(
        new Date("2026-07-01T09:00:00.000Z"),
        new Date("2026-07-01T10:00:00.000Z"),
        new Date("2026-07-02T00:00:00.000Z"),
      ),
    ).toThrow("Thời gian sự kiện");
    expect(() =>
      validateClubEventRange(
        new Date("2026-08-01T10:00:00.000Z"),
        new Date("2026-08-01T09:00:00.000Z"),
        new Date("2026-07-01T00:00:00.000Z"),
      ),
    ).toThrow("Thời gian sự kiện");
  });

  it("assigns deterministic event waitlist positions", () => {
    expect(nextClubWaitlistPosition([3, null, 1])).toBe(4);
    expect(resolveClubRegistration(20, 19, [1])).toEqual({
      status: "REGISTERED",
      position: null,
    });
    expect(resolveClubRegistration(20, 20, [1, 4])).toEqual({
      status: "WAITLISTED",
      position: 5,
    });
  });

  it("only allows linked guardian consent", () => {
    expect(canApproveClubConsent(
      { studentId: "student-1", guardianId: "parent-1" },
      ["student-1"],
      "parent-1",
    )).toBe(true);
    expect(canApproveClubConsent(
      { studentId: "student-2", guardianId: "parent-1" },
      ["student-1"],
      "parent-1",
    )).toBe(false);
  });

  it("keeps club expenses within the approved budget", () => {
    expect(() => assertExpenseWithinBudget(200_000, 300_000, 1_000_000)).not.toThrow();
    expect(() => assertExpenseWithinBudget(800_000, 300_000, 1_000_000)).toThrow(ClubValidationError);
    expect(() => assertExpenseWithinBudget(0, 0, 1_000_000)).toThrow(ClubValidationError);
  });

  it("guards club task status transitions", () => {
    expect(canTransitionClubTask("TODO", "IN_PROGRESS")).toBe(true);
    expect(canTransitionClubTask("IN_PROGRESS", "DONE")).toBe(true);
    expect(canTransitionClubTask("DONE", "CANCELLED")).toBe(false);
    expect(canTransitionClubTask("CANCELLED", "DONE")).toBe(false);
  });
});
