export const appointmentStatuses = [
  "REQUESTED",
  "CONFIRMED",
  "WAITLISTED",
  "COMPLETED",
  "CANCELLED",
  "DECLINED",
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const appointmentActions = [
  "APPROVE",
  "DECLINE",
  "RESCHEDULE",
  "CANCEL",
  "COMPLETE",
  "PROMOTE_WAITLIST",
] as const;

export type AppointmentAction = (typeof appointmentActions)[number];

export class AppointmentTransitionError extends Error {}

type TransitionInput = Readonly<{
  currentStatus: AppointmentStatus;
  action: AppointmentAction;
  actorCanApprove: boolean;
}>;

type TransitionResult = Readonly<{
  fromStatus: AppointmentStatus;
  toStatus: AppointmentStatus;
}>;

const allowedTransitions: Readonly<
  Record<AppointmentAction, readonly AppointmentStatus[]>
> = {
  APPROVE: ["REQUESTED"],
  DECLINE: ["REQUESTED"],
  RESCHEDULE: ["REQUESTED", "CONFIRMED"],
  CANCEL: ["REQUESTED", "CONFIRMED", "WAITLISTED"],
  COMPLETE: ["CONFIRMED"],
  PROMOTE_WAITLIST: ["WAITLISTED"],
};

const nextStatus: Readonly<Record<AppointmentAction, AppointmentStatus>> = {
  APPROVE: "CONFIRMED",
  DECLINE: "DECLINED",
  RESCHEDULE: "CONFIRMED",
  CANCEL: "CANCELLED",
  COMPLETE: "COMPLETED",
  PROMOTE_WAITLIST: "REQUESTED",
};

export function transitionAppointment({
  currentStatus,
  action,
  actorCanApprove,
}: TransitionInput): TransitionResult {
  if (
    (action === "APPROVE" ||
      action === "DECLINE" ||
      action === "COMPLETE" ||
      action === "PROMOTE_WAITLIST") &&
    !actorCanApprove
  ) {
    throw new AppointmentTransitionError(
      "Bạn không có quyền thực hiện chuyển trạng thái này.",
    );
  }

  if (!allowedTransitions[action].includes(currentStatus)) {
    throw new AppointmentTransitionError(
      `Không thể "${action}" khi lịch hẹn ở trạng thái "${currentStatus}".`,
    );
  }

  return {
    fromStatus: currentStatus,
    toStatus: nextStatus[action],
  };
}
