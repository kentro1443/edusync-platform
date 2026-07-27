import "server-only";

import { randomUUID } from "node:crypto";

import type {
  AppointmentAction,
  AppointmentStatus,
} from "@/lib/mentoring/appointment-domain";
import {
  AppointmentTransitionError,
  transitionAppointment,
} from "@/lib/mentoring/appointment-domain";
import type { AuthorizationContext } from "@/lib/auth/policies";
import { can } from "@/lib/auth/policies";
import { permissions } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { AttendanceStatus } from "@/generated/prisma/enums";
import { calculateAvailabilitySlots } from "@/lib/mentoring/availability";

export class BookingValidationError extends Error {}
export class BookingAuthorizationError extends Error {}
export class BookingConflictError extends Error {}

type SchoolActor = AuthorizationContext & {
  schoolId: string;
  membershipId: string;
};

type BookingInput = Readonly<{
  mentorProfileId: string;
  appointmentTypeId: string;
  studentUserId: string;
  startsAt: Date;
  timezone: string;
  studentMessage?: string;
  joinWaitlistOnConflict?: boolean;
}>;

type BookingResult = Readonly<{
  appointmentId: string;
  status: AppointmentStatus;
  waitlistPosition?: number;
}>;

type TransitionInput = Readonly<{
  action: AppointmentAction;
  reason?: string;
  startsAt?: Date;
}>;

function requireSchoolActor(
  actor: AuthorizationContext,
  permission: Parameters<typeof can>[1],
): asserts actor is SchoolActor {
  if (
    actor.schoolId === null ||
    actor.membershipId === null ||
    !can(actor, permission)
  ) {
    throw new BookingAuthorizationError("Bạn không có quyền thực hiện thao tác này.");
  }
}

async function lockKeys(
  transaction: Prisma.TransactionClient,
  keys: readonly string[],
): Promise<void> {
  for (const key of [...new Set(keys)].sort()) {
    await transaction.$queryRaw<Array<{ locked: string }>>`
      SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text AS locked
    `;
  }
}

function appointmentLockKeys(input: {
  schoolId: string;
  mentorUserId: string;
  studentUserId: string;
  startsAt: Date;
  endsAt: Date;
}): string[] {
  const range = `${input.startsAt.toISOString()}:${input.endsAt.toISOString()}`;
  return [
    `mentor-booking:${input.schoolId}:mentor:${input.mentorUserId}:${range}`,
    `mentor-booking:${input.schoolId}:student:${input.studentUserId}:${range}`,
  ];
}

function validateBookingInput(input: BookingInput, now: Date): void {
  if (
    !input.mentorProfileId ||
    !input.appointmentTypeId ||
    !input.studentUserId ||
    !(input.startsAt instanceof Date) ||
    Number.isNaN(input.startsAt.getTime()) ||
    input.startsAt <= now ||
    input.timezone.length < 3 ||
    input.timezone.length > 64 ||
    (input.studentMessage?.trim().length ?? 0) > 1_000
  ) {
    throw new BookingValidationError("Thông tin đặt lịch không hợp lệ.");
  }
}

async function assertCanBookStudent(
  transaction: Prisma.TransactionClient,
  actor: SchoolActor,
  studentUserId: string,
  now: Date,
): Promise<void> {
  const studentMembership = await transaction.schoolMembership.findFirst({
    where: {
      schoolId: actor.schoolId,
      userId: studentUserId,
      status: "ACTIVE",
      roleAssignments: { some: { role: "STUDENT" } },
    },
    select: { id: true },
  });
  if (!studentMembership) {
    throw new BookingValidationError("Không tìm thấy học sinh hoạt động trong trường.");
  }

  if (actor.userId === studentUserId) return;
  if (actor.schoolRoles.includes("PARENT_GUARDIAN")) {
    const link = await transaction.parentStudentLink.findFirst({
      where: {
        schoolId: actor.schoolId,
        parentUserId: actor.userId,
        studentUserId,
        status: "ACTIVE",
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      select: { id: true },
    });
    if (!link) {
      throw new BookingAuthorizationError(
        "Phụ huynh chỉ có thể đặt lịch cho học sinh đã liên kết.",
      );
    }
    return;
  }

  if (
    actor.schoolRoles.some((role) =>
      [
        "SCHOOL_ADMIN",
        "TEACHER_STAFF",
        "MENTOR_COUNSELOR",
        "APPROVER_REVIEWER",
      ].includes(role),
    )
  ) {
    return;
  }

  throw new BookingAuthorizationError(
    "Bạn không thể đặt lịch thay cho học sinh này.",
  );
}

async function writeMutationRecords(
  transaction: Prisma.TransactionClient,
  input: {
    schoolId: string;
    actorUserId: string;
    appointmentId: string;
    action: string;
    eventType: string;
    before?: object;
    after?: object;
    payload?: object;
  },
): Promise<void> {
  const requestId = randomUUID();
  await transaction.auditEvent.create({
    data: {
      schoolId: input.schoolId,
      actorUserId: input.actorUserId,
      actorType: "USER",
      action: input.action,
      entityType: "Appointment",
      entityId: input.appointmentId,
      beforeJson: input.before,
      afterJson: input.after,
      requestId,
    },
  });
  await transaction.domainOutboxEvent.create({
    data: {
      schoolId: input.schoolId,
      eventType: input.eventType,
      aggregateType: "Appointment",
      aggregateId: input.appointmentId,
      payloadJson: {
        appointmentId: input.appointmentId,
        actorUserId: input.actorUserId,
        requestId,
        ...input.payload,
      },
    },
  });
}

async function getBookingContext(
  transaction: Prisma.TransactionClient,
  actor: SchoolActor,
  input: BookingInput,
) {
  const profile = await transaction.mentorProfile.findFirst({
    where: {
      id: input.mentorProfileId,
      schoolId: actor.schoolId,
      active: true,
      verificationStatus: "VERIFIED",
      user: {
        status: "ACTIVE",
        memberships: {
          some: {
            schoolId: actor.schoolId,
            status: "ACTIVE",
            roleAssignments: { some: { role: "MENTOR_COUNSELOR" } },
          },
        },
      },
    },
    select: {
      id: true,
      userId: true,
      availabilityRules: {
        where: { active: true },
        select: {
          weekday: true,
          startsAtLocal: true,
          endsAtLocal: true,
          timezone: true,
          capacity: true,
          active: true,
        },
      },
      availabilityExceptions: {
        where: {
          startsAt: { lt: new Date(input.startsAt.getTime() + 8 * 60 * 60_000) },
          endsAt: { gt: input.startsAt },
        },
        select: { startsAt: true, endsAt: true, kind: true },
      },
    },
  });
  if (!profile) {
    throw new BookingValidationError("Hồ sơ cố vấn không tồn tại hoặc chưa xác minh.");
  }

  const appointmentType = await transaction.appointmentType.findFirst({
    where: {
      id: input.appointmentTypeId,
      schoolId: actor.schoolId,
      active: true,
      OR: [{ mentorProfileId: null }, { mentorProfileId: profile.id }],
    },
    select: {
      id: true,
      durationMinutes: true,
      capacity: true,
      requiresApproval: true,
    },
  });
  if (!appointmentType) {
    throw new BookingValidationError("Loại lịch hẹn không hợp lệ.");
  }
  const endsAt = new Date(
    input.startsAt.getTime() + appointmentType.durationMinutes * 60_000,
  );
  const matchingSlot = calculateAvailabilitySlots({
    from: input.startsAt,
    to: endsAt,
    durationMinutes: appointmentType.durationMinutes,
    rules: profile.availabilityRules,
    exceptions: profile.availabilityExceptions,
    busyAppointments: [],
  }).some(
    (slot) =>
      slot.startsAt.getTime() === input.startsAt.getTime() &&
      slot.endsAt.getTime() === endsAt.getTime(),
  );
  if (!matchingSlot) {
    throw new BookingValidationError("Khung giờ không nằm trong lịch rảnh của cố vấn.");
  }

  return { profile, appointmentType, endsAt };
}

export async function createAppointmentBooking(
  actor: AuthorizationContext,
  input: BookingInput,
  now = new Date(),
): Promise<BookingResult> {
  requireSchoolActor(actor, permissions.mentorAppointmentCreate);
  validateBookingInput(input, now);

  return db.$transaction(async (transaction) => {
    await assertCanBookStudent(transaction, actor, input.studentUserId, now);
    const { profile, appointmentType, endsAt } = await getBookingContext(
      transaction,
      actor,
      input,
    );
    await lockKeys(
      transaction,
      appointmentLockKeys({
        schoolId: actor.schoolId,
        mentorUserId: profile.userId,
        studentUserId: input.studentUserId,
        startsAt: input.startsAt,
        endsAt,
      }),
    );

    const conflict = await transaction.appointment.findFirst({
      where: {
        schoolId: actor.schoolId,
        status: { in: ["REQUESTED", "CONFIRMED"] },
        startsAt: { lt: endsAt },
        endsAt: { gt: input.startsAt },
        OR: [
          { mentorUserId: profile.userId },
          { studentUserId: input.studentUserId },
        ],
      },
      select: { id: true },
    });
    if (conflict && !input.joinWaitlistOnConflict) {
      throw new BookingConflictError(
        "Khung giờ vừa được người khác đặt. Chọn giờ khác hoặc vào danh sách chờ.",
      );
    }

    let waitlistPosition: number | undefined;
    const status: AppointmentStatus = conflict
      ? "WAITLISTED"
      : appointmentType.requiresApproval
        ? "REQUESTED"
        : "CONFIRMED";
    if (status === "WAITLISTED") {
      const lastEntry = await transaction.appointmentWaitlistEntry.findFirst({
        where: {
          status: "WAITING",
          appointment: {
            schoolId: actor.schoolId,
            mentorUserId: profile.userId,
            startsAt: input.startsAt,
            endsAt,
          },
        },
        orderBy: [{ position: "desc" }, { joinedAt: "desc" }, { id: "desc" }],
        select: { position: true },
      });
      waitlistPosition = (lastEntry?.position ?? 0) + 1;
    }

    const appointment = await transaction.appointment.create({
      data: {
        schoolId: actor.schoolId,
        appointmentTypeId: appointmentType.id,
        organizerUserId: actor.userId,
        studentUserId: input.studentUserId,
        mentorUserId: profile.userId,
        startsAt: input.startsAt,
        endsAt,
        timezone: input.timezone,
        status,
        capacity: appointmentType.capacity,
        studentMessage: input.studentMessage?.trim() || null,
        transitions: {
          create: {
            fromStatus: status,
            toStatus: status,
            action: "CREATE",
            actorUserId: actor.userId,
          },
        },
        ...(waitlistPosition
          ? {
              waitlistEntry: {
                create: {
                  userId: input.studentUserId,
                  position: waitlistPosition,
                },
              },
            }
          : {}),
      },
      select: { id: true },
    });
    await writeMutationRecords(transaction, {
      schoolId: actor.schoolId,
      actorUserId: actor.userId,
      appointmentId: appointment.id,
      action: "MENTOR_APPOINTMENT_CREATED",
      eventType: "MENTOR_APPOINTMENT_CREATED",
      after: {
        status,
        startsAt: input.startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      },
      payload: { status, waitlistPosition },
    });

    return {
      appointmentId: appointment.id,
      status,
      ...(waitlistPosition ? { waitlistPosition } : {}),
    };
  });
}

function canOperateAppointment(
  actor: SchoolActor,
  appointment: {
    organizerUserId: string;
    studentUserId: string;
    mentorUserId: string;
  },
  action: AppointmentAction,
): boolean {
  if (
    action === "APPROVE" ||
    action === "DECLINE" ||
    action === "COMPLETE"
  ) {
    return (
      actor.userId === appointment.mentorUserId ||
      actor.schoolRoles.some((role) =>
        ["SCHOOL_ADMIN", "TEACHER_STAFF", "APPROVER_REVIEWER"].includes(role),
      )
    );
  }
  return (
    actor.userId === appointment.organizerUserId ||
    actor.userId === appointment.studentUserId ||
    actor.userId === appointment.mentorUserId ||
    actor.schoolRoles.includes("SCHOOL_ADMIN") ||
    actor.schoolRoles.includes("TEACHER_STAFF")
  );
}

async function promoteWaitlist(
  transaction: Prisma.TransactionClient,
  cancelled: {
    schoolId: string;
    mentorUserId: string;
    startsAt: Date;
    endsAt: Date;
  },
  actorUserId: string,
  now: Date,
): Promise<void> {
  const candidates = await transaction.appointmentWaitlistEntry.findMany({
    where: {
      status: "WAITING",
      appointment: {
        schoolId: cancelled.schoolId,
        mentorUserId: cancelled.mentorUserId,
        startsAt: cancelled.startsAt,
        endsAt: cancelled.endsAt,
        status: "WAITLISTED",
      },
    },
    orderBy: [{ joinedAt: "asc" }, { id: "asc" }],
    take: 50,
    select: {
      id: true,
      appointmentId: true,
      appointment: { select: { studentUserId: true } },
    },
  });

  for (const candidate of candidates) {
    await lockKeys(
      transaction,
      appointmentLockKeys({
        ...cancelled,
        studentUserId: candidate.appointment.studentUserId,
      }),
    );
    const studentConflict = await transaction.appointment.findFirst({
      where: {
        id: { not: candidate.appointmentId },
        schoolId: cancelled.schoolId,
        studentUserId: candidate.appointment.studentUserId,
        status: { in: ["REQUESTED", "CONFIRMED"] },
        startsAt: { lt: cancelled.endsAt },
        endsAt: { gt: cancelled.startsAt },
      },
      select: { id: true },
    });
    if (studentConflict) continue;

    await transaction.appointment.update({
      where: { id: candidate.appointmentId },
      data: {
        status: "REQUESTED",
        transitions: {
          create: {
            fromStatus: "WAITLISTED",
            toStatus: "REQUESTED",
            action: "PROMOTE_WAITLIST",
            actorUserId,
          },
        },
      },
    });
    await transaction.appointmentWaitlistEntry.update({
      where: { id: candidate.id },
      data: { status: "PROMOTED", promotedAt: now },
    });
    await writeMutationRecords(transaction, {
      schoolId: cancelled.schoolId,
      actorUserId,
      appointmentId: candidate.appointmentId,
      action: "MENTOR_WAITLIST_PROMOTED",
      eventType: "MENTOR_WAITLIST_PROMOTED",
      before: { status: "WAITLISTED" },
      after: { status: "REQUESTED" },
    });
    return;
  }
}

export async function transitionAppointmentBooking(
  actor: AuthorizationContext,
  appointmentId: string,
  input: TransitionInput,
  now = new Date(),
): Promise<void> {
  const permission =
    input.action === "APPROVE" || input.action === "DECLINE"
      ? permissions.mentorAppointmentApprove
      : input.action === "COMPLETE"
        ? permissions.mentorSessionConduct
        : input.action === "RESCHEDULE"
          ? permissions.mentorAppointmentReschedule
          : permissions.mentorAppointmentCancel;
  requireSchoolActor(actor, permission);
  if (!appointmentId || (input.reason?.trim().length ?? 0) > 1_000) {
    throw new BookingValidationError("Yêu cầu chuyển trạng thái không hợp lệ.");
  }

  await db.$transaction(async (transaction) => {
    const appointment = await transaction.appointment.findFirst({
      where: { id: appointmentId, schoolId: actor.schoolId },
      select: {
        id: true,
        status: true,
        organizerUserId: true,
        studentUserId: true,
        mentorUserId: true,
        startsAt: true,
        endsAt: true,
        timezone: true,
        appointmentType: { select: { durationMinutes: true } },
      },
    });
    if (!appointment) {
      throw new BookingValidationError("Không tìm thấy lịch hẹn.");
    }
    if (!canOperateAppointment(actor, appointment, input.action)) {
      throw new BookingAuthorizationError(
        "Bạn không thể thay đổi lịch hẹn này.",
      );
    }
    const transition = transitionAppointment({
      currentStatus: appointment.status,
      action: input.action,
      actorCanApprove: true,
    });

    let startsAt = appointment.startsAt;
    let endsAt = appointment.endsAt;
    if (input.action === "RESCHEDULE") {
      if (
        !input.startsAt ||
        Number.isNaN(input.startsAt.getTime()) ||
        input.startsAt <= now
      ) {
        throw new BookingValidationError("Khung giờ đổi lịch không hợp lệ.");
      }
      startsAt = input.startsAt;
      endsAt = new Date(
        startsAt.getTime() +
          appointment.appointmentType.durationMinutes * 60_000,
      );
    }

    await lockKeys(
      transaction,
      appointmentLockKeys({
        schoolId: actor.schoolId,
        mentorUserId: appointment.mentorUserId,
        studentUserId: appointment.studentUserId,
        startsAt,
        endsAt,
      }),
    );
    await transaction.appointment.update({
      where: { id: appointment.id },
      data: {
        status: transition.toStatus,
        startsAt,
        endsAt,
        cancellationReason:
          input.action === "CANCEL" ? input.reason?.trim() || null : undefined,
        transitions: {
          create: {
            fromStatus: transition.fromStatus,
            toStatus: transition.toStatus,
            action: input.action,
            actorUserId: actor.userId,
            reason: input.reason?.trim() || null,
            metadataJson:
              input.action === "RESCHEDULE"
                ? {
                    oldStartsAt: appointment.startsAt.toISOString(),
                    newStartsAt: startsAt.toISOString(),
                  }
                : {},
          },
        },
      },
    });
    await writeMutationRecords(transaction, {
      schoolId: actor.schoolId,
      actorUserId: actor.userId,
      appointmentId: appointment.id,
      action: `MENTOR_APPOINTMENT_${input.action}`,
      eventType: `MENTOR_APPOINTMENT_${input.action}`,
      before: {
        status: transition.fromStatus,
        startsAt: appointment.startsAt.toISOString(),
      },
      after: {
        status: transition.toStatus,
        startsAt: startsAt.toISOString(),
      },
    });

    if (input.action === "CANCEL") {
      await promoteWaitlist(
        transaction,
        {
          schoolId: actor.schoolId,
          mentorUserId: appointment.mentorUserId,
          startsAt: appointment.startsAt,
          endsAt: appointment.endsAt,
        },
        actor.userId,
        now,
      );
    }
  });
}

export async function recordAppointmentAttendance(
  actor: AuthorizationContext,
  appointmentId: string,
  input: Readonly<{
    userId: string;
    status: AttendanceStatus;
    note?: string;
  }>,
  now = new Date(),
): Promise<void> {
  requireSchoolActor(actor, permissions.mentorSessionConduct);
  if (
    !["PRESENT", "ABSENT", "EXCUSED"].includes(input.status) ||
    (input.note?.trim().length ?? 0) > 500
  ) {
    throw new BookingValidationError("Dữ liệu điểm danh không hợp lệ.");
  }

  await db.$transaction(async (transaction) => {
    const appointment = await transaction.appointment.findFirst({
      where: {
        id: appointmentId,
        schoolId: actor.schoolId,
        status: "CONFIRMED",
        OR: [
          { mentorUserId: actor.userId },
          ...(actor.schoolRoles.some((role) =>
            ["SCHOOL_ADMIN", "TEACHER_STAFF"].includes(role),
          )
            ? [{}]
            : []),
        ],
      },
      select: {
        id: true,
        studentUserId: true,
        mentorUserId: true,
      },
    });
    if (
      !appointment ||
      ![appointment.studentUserId, appointment.mentorUserId].includes(
        input.userId,
      )
    ) {
      throw new BookingAuthorizationError(
        "Không thể điểm danh cho lịch hẹn này.",
      );
    }
    await transaction.appointmentAttendance.upsert({
      where: {
        appointmentId_userId: {
          appointmentId: appointment.id,
          userId: input.userId,
        },
      },
      create: {
        appointmentId: appointment.id,
        userId: input.userId,
        status: input.status,
        checkedInAt: input.status === "PRESENT" ? now : null,
        recordedByUserId: actor.userId,
        note: input.note?.trim() || null,
      },
      update: {
        status: input.status,
        checkedInAt: input.status === "PRESENT" ? now : null,
        recordedByUserId: actor.userId,
        note: input.note?.trim() || null,
      },
    });
    await writeMutationRecords(transaction, {
      schoolId: actor.schoolId,
      actorUserId: actor.userId,
      appointmentId: appointment.id,
      action: "MENTOR_APPOINTMENT_ATTENDANCE_RECORDED",
      eventType: "MENTOR_APPOINTMENT_ATTENDANCE_RECORDED",
      after: { userId: input.userId, status: input.status },
    });
  });
}

export { AppointmentTransitionError };
