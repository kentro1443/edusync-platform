import { describe, expect, it } from "vitest";

import {
  AppointmentTransitionError,
  transitionAppointment,
} from "@/lib/mentoring/appointment-domain";

describe("transitionAppointment", () => {
  it("duyệt yêu cầu thành lịch đã xác nhận", () => {
    expect(
      transitionAppointment({
        currentStatus: "REQUESTED",
        action: "APPROVE",
        actorCanApprove: true,
      }),
    ).toEqual({ fromStatus: "REQUESTED", toStatus: "CONFIRMED" });
  });

  it("không cho học sinh tự duyệt lịch", () => {
    expect(() =>
      transitionAppointment({
        currentStatus: "REQUESTED",
        action: "APPROVE",
        actorCanApprove: false,
      }),
    ).toThrow(AppointmentTransitionError);
  });

  it("không cho hoàn tất lịch đã hủy", () => {
    expect(() =>
      transitionAppointment({
        currentStatus: "CANCELLED",
        action: "COMPLETE",
        actorCanApprove: true,
      }),
    ).toThrow('Không thể "COMPLETE" khi lịch hẹn ở trạng thái "CANCELLED".');
  });

  it("cho đổi lịch từ yêu cầu hoặc lịch đã xác nhận", () => {
    expect(
      transitionAppointment({
        currentStatus: "CONFIRMED",
        action: "RESCHEDULE",
        actorCanApprove: false,
      }),
    ).toEqual({ fromStatus: "CONFIRMED", toStatus: "CONFIRMED" });
  });
});
