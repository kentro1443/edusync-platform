import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AuthorizationContext } from "@/lib/auth/policies";
import { db } from "@/lib/db";
import {
  BookingConflictError,
  createAppointmentBooking,
  recordAppointmentAttendance,
  transitionAppointmentBooking,
} from "@/lib/mentoring/booking-service";

describe.sequential("Phase 3 transactional booking", () => {
  const suffix = randomUUID().slice(0, 8);
  const schoolId = randomUUID();
  const mentorId = randomUUID();
  const mentorMembershipId = randomUUID();
  const mentorProfileId = randomUUID();
  const studentId = randomUUID();
  const studentMembershipId = randomUUID();
  const secondStudentId = randomUUID();
  const secondStudentMembershipId = randomUUID();
  const appointmentTypeId = randomUUID();
  const passwordHash = "not-used-in-this-integration-test";

  const studentActor: AuthorizationContext = {
    userId: studentId,
    schoolId,
    membershipId: studentMembershipId,
    schoolRoles: ["STUDENT"],
    platformRoles: [],
  };
  const secondStudentActor: AuthorizationContext = {
    userId: secondStudentId,
    schoolId,
    membershipId: secondStudentMembershipId,
    schoolRoles: ["STUDENT"],
    platformRoles: [],
  };
  const mentorActor: AuthorizationContext = {
    userId: mentorId,
    schoolId,
    membershipId: mentorMembershipId,
    schoolRoles: ["MENTOR_COUNSELOR"],
    platformRoles: [],
  };

  beforeAll(async () => {
    await db.school.create({
      data: {
        id: schoolId,
        slug: `phase3-booking-${suffix}`,
        name: `Trường Phase 3 ${suffix}`,
        shortName: "P3",
      },
    });
    await db.user.createMany({
      data: [
        {
          id: mentorId,
          email: `mentor-${suffix}@phase3.local`,
          normalizedEmail: `mentor-${suffix}@phase3.local`,
          displayName: "Cố vấn Phase 3",
          passwordHash,
          mustChangePassword: false,
        },
        {
          id: studentId,
          email: `student-${suffix}@phase3.local`,
          normalizedEmail: `student-${suffix}@phase3.local`,
          displayName: "Học sinh Phase 3",
          passwordHash,
          mustChangePassword: false,
        },
        {
          id: secondStudentId,
          email: `student-2-${suffix}@phase3.local`,
          normalizedEmail: `student-2-${suffix}@phase3.local`,
          displayName: "Học sinh Phase 3 thứ hai",
          passwordHash,
          mustChangePassword: false,
        },
      ],
    });
    await db.schoolMembership.createMany({
      data: [
        {
          id: mentorMembershipId,
          schoolId,
          userId: mentorId,
          status: "ACTIVE",
          joinedAt: new Date(),
        },
        {
          id: studentMembershipId,
          schoolId,
          userId: studentId,
          status: "ACTIVE",
          joinedAt: new Date(),
        },
        {
          id: secondStudentMembershipId,
          schoolId,
          userId: secondStudentId,
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      ],
    });
    await db.schoolRoleAssignment.createMany({
      data: [
        {
          membershipId: mentorMembershipId,
          role: "MENTOR_COUNSELOR",
        },
        { membershipId: studentMembershipId, role: "STUDENT" },
        { membershipId: secondStudentMembershipId, role: "STUDENT" },
      ],
    });
    await db.mentorProfile.create({
      data: {
        id: mentorProfileId,
        schoolId,
        userId: mentorId,
        headline: "Cố vấn thử nghiệm",
        bio: "Hồ sơ dùng cho integration test.",
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
      },
    });
    await db.mentorAvailabilityRule.create({
      data: {
        mentorProfileId,
        weekday: 1,
        startsAtLocal: "08:00",
        endsAtLocal: "17:00",
        timezone: "Asia/Ho_Chi_Minh",
      },
    });
    await db.appointmentType.create({
      data: {
        id: appointmentTypeId,
        schoolId,
        mentorProfileId,
        name: "Tư vấn cá nhân",
        durationMinutes: 60,
        requiresApproval: true,
      },
    });
  });

  afterAll(async () => {
    await db.auditEvent.deleteMany({ where: { schoolId } });
    await db.domainOutboxEvent.deleteMany({ where: { schoolId } });
    await db.appointmentTransition.deleteMany({
      where: { appointment: { schoolId } },
    });
    await db.appointmentAttendance.deleteMany({
      where: { appointment: { schoolId } },
    });
    await db.appointmentWaitlistEntry.deleteMany({
      where: { appointment: { schoolId } },
    });
    await db.mentoringSessionOutcome.deleteMany({
      where: { appointment: { schoolId } },
    });
    await db.appointment.deleteMany({ where: { schoolId } });
    await db.appointmentType.deleteMany({ where: { schoolId } });
    await db.mentorAvailabilityRule.deleteMany({
      where: { mentorProfileId },
    });
    await db.mentorProfile.deleteMany({ where: { schoolId } });
    await db.schoolRoleAssignment.deleteMany({
      where: { membership: { schoolId } },
    });
    await db.schoolMembership.deleteMany({ where: { schoolId } });
    await db.user.deleteMany({
      where: { id: { in: [mentorId, studentId, secondStudentId] } },
    });
    await db.school.delete({ where: { id: schoolId } });
  });

  it("chỉ một request đồng thời giữ được cùng slot", async () => {
    const input = {
      mentorProfileId,
      appointmentTypeId,
      studentUserId: studentId,
      startsAt: new Date("2026-08-03T02:00:00.000Z"),
      timezone: "Asia/Ho_Chi_Minh",
      joinWaitlistOnConflict: false,
    };

    const results = await Promise.allSettled([
      createAppointmentBooking(studentActor, input),
      createAppointmentBooking(studentActor, input),
    ]);

    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    const rejection = results.find(({ status }) => status === "rejected");
    expect(rejection).toMatchObject({
      status: "rejected",
      reason: expect.any(BookingConflictError),
    });
  });

  it("đưa conflict vào waitlist và promote người vào trước khi slot được hủy", async () => {
    const startsAt = new Date("2026-08-03T04:00:00.000Z");
    const first = await createAppointmentBooking(studentActor, {
      mentorProfileId,
      appointmentTypeId,
      studentUserId: studentId,
      startsAt,
      timezone: "Asia/Ho_Chi_Minh",
      joinWaitlistOnConflict: false,
    });
    const waiting = await createAppointmentBooking(secondStudentActor, {
      mentorProfileId,
      appointmentTypeId,
      studentUserId: secondStudentId,
      startsAt,
      timezone: "Asia/Ho_Chi_Minh",
      joinWaitlistOnConflict: true,
    });

    expect(first.status).toBe("REQUESTED");
    expect(waiting).toMatchObject({
      status: "WAITLISTED",
      waitlistPosition: 1,
    });
    expect(
      await db.auditEvent.count({
        where: {
          schoolId,
          action: "MENTOR_APPOINTMENT_CREATED",
          entityId: { in: [first.appointmentId, waiting.appointmentId] },
        },
      }),
    ).toBe(2);
    expect(
      await db.domainOutboxEvent.count({
        where: {
          schoolId,
          aggregateId: { in: [first.appointmentId, waiting.appointmentId] },
          eventType: "MENTOR_APPOINTMENT_CREATED",
        },
      }),
    ).toBe(2);

    await transitionAppointmentBooking(studentActor, first.appointmentId, {
      action: "CANCEL",
      reason: "Học sinh đổi kế hoạch",
    });

    expect(
      await db.appointment.findUniqueOrThrow({
        where: { id: waiting.appointmentId },
        select: {
          status: true,
          waitlistEntry: { select: { status: true } },
        },
      }),
    ).toEqual({
      status: "REQUESTED",
      waitlistEntry: { status: "PROMOTED" },
    });
  });

  it("duyệt, điểm danh và hoàn tất lịch với history/audit/outbox", async () => {
    const booking = await createAppointmentBooking(secondStudentActor, {
      mentorProfileId,
      appointmentTypeId,
      studentUserId: secondStudentId,
      startsAt: new Date("2026-08-03T06:00:00.000Z"),
      timezone: "Asia/Ho_Chi_Minh",
      joinWaitlistOnConflict: false,
    });

    await transitionAppointmentBooking(mentorActor, booking.appointmentId, {
      action: "APPROVE",
    });
    await recordAppointmentAttendance(mentorActor, booking.appointmentId, {
      userId: secondStudentId,
      status: "PRESENT",
      note: "Đến đúng giờ",
    });
    await transitionAppointmentBooking(mentorActor, booking.appointmentId, {
      action: "COMPLETE",
    });

    const appointment = await db.appointment.findUniqueOrThrow({
      where: { id: booking.appointmentId },
      select: {
        status: true,
        transitions: { select: { action: true }, orderBy: { createdAt: "asc" } },
        attendance: { select: { status: true, userId: true } },
      },
    });
    expect(appointment.status).toBe("COMPLETED");
    expect(appointment.transitions.map(({ action }) => action)).toEqual([
      "CREATE",
      "APPROVE",
      "COMPLETE",
    ]);
    expect(appointment.attendance).toContainEqual({
      userId: secondStudentId,
      status: "PRESENT",
    });
    expect(
      await db.domainOutboxEvent.count({
        where: { aggregateId: booking.appointmentId },
      }),
    ).toBeGreaterThanOrEqual(4);
  });
});
