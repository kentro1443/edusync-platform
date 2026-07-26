import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AuthorizationContext } from "@/lib/auth/policies";
import { db } from "@/lib/db";
import {
  bookCalendarEvent,
  cancelCalendarBooking,
  exportCalendarIcal,
} from "@/lib/calendar/calendar-service";

describe.sequential("Phase 5 calendar booking, waitlist promotion, and export scope", () => {
  const suffix = randomUUID().slice(0, 8);
  const schoolId = randomUUID();
  const otherSchoolId = randomUUID();
  const adminId = randomUUID();
  const adminMembershipId = randomUUID();
  const studentAId = randomUUID();
  const studentAMembershipId = randomUUID();
  const studentBId = randomUUID();
  const studentBMembershipId = randomUUID();
  const outsiderId = randomUUID();
  const outsiderMembershipId = randomUUID();
  const calendarId = randomUUID();
  const otherCalendarId = randomUUID();
  const eventId = randomUUID();
  const otherEventId = randomUUID();
  const passwordHash = "not-used";

  const adminActor: AuthorizationContext = { userId: adminId, schoolId, membershipId: adminMembershipId, schoolRoles: ["SCHOOL_ADMIN"], platformRoles: [] };
  const studentAActor: AuthorizationContext = { userId: studentAId, schoolId, membershipId: studentAMembershipId, schoolRoles: ["STUDENT"], platformRoles: [] };
  const studentBActor: AuthorizationContext = { userId: studentBId, schoolId, membershipId: studentBMembershipId, schoolRoles: ["STUDENT"], platformRoles: [] };
  const outsiderActor: AuthorizationContext = { userId: outsiderId, schoolId: otherSchoolId, membershipId: outsiderMembershipId, schoolRoles: ["STUDENT"], platformRoles: [] };

  beforeAll(async () => {
    await db.school.createMany({
      data: [
        { id: schoolId, slug: `cal-${suffix}`, name: `Trường Lịch ${suffix}`, shortName: "CAL" },
        { id: otherSchoolId, slug: `cal-other-${suffix}`, name: `Trường khác ${suffix}`, shortName: "OTH" },
      ],
    });
    await db.user.createMany({
      data: [
        { id: adminId, email: `admin-${suffix}@cal.local`, normalizedEmail: `admin-${suffix}@cal.local`, displayName: "Quản trị", passwordHash, mustChangePassword: false },
        { id: studentAId, email: `studenta-${suffix}@cal.local`, normalizedEmail: `studenta-${suffix}@cal.local`, displayName: "Học sinh A", passwordHash, mustChangePassword: false },
        { id: studentBId, email: `studentb-${suffix}@cal.local`, normalizedEmail: `studentb-${suffix}@cal.local`, displayName: "Học sinh B", passwordHash, mustChangePassword: false },
        { id: outsiderId, email: `outsider-${suffix}@cal.local`, normalizedEmail: `outsider-${suffix}@cal.local`, displayName: "Người trường khác", passwordHash, mustChangePassword: false },
      ],
    });
    await db.schoolMembership.createMany({
      data: [
        { id: adminMembershipId, schoolId, userId: adminId, status: "ACTIVE", joinedAt: new Date() },
        { id: studentAMembershipId, schoolId, userId: studentAId, status: "ACTIVE", joinedAt: new Date() },
        { id: studentBMembershipId, schoolId, userId: studentBId, status: "ACTIVE", joinedAt: new Date() },
        { id: outsiderMembershipId, schoolId: otherSchoolId, userId: outsiderId, status: "ACTIVE", joinedAt: new Date() },
      ],
    });
    await db.schoolRoleAssignment.createMany({
      data: [
        { membershipId: adminMembershipId, role: "SCHOOL_ADMIN" },
        { membershipId: studentAMembershipId, role: "STUDENT" },
        { membershipId: studentBMembershipId, role: "STUDENT" },
        { membershipId: outsiderMembershipId, role: "STUDENT" },
      ],
    });
    await db.calendar.createMany({
      data: [
        { id: calendarId, schoolId, name: `Lịch test ${suffix}`, visibility: "SCHOOL" },
        { id: otherCalendarId, schoolId: otherSchoolId, name: `Lịch khác ${suffix}`, visibility: "SCHOOL" },
      ],
    });
    const start = new Date(Date.now() + 3 * 86_400_000);
    const end = new Date(start.getTime() + 3_600_000);
    await db.calendarEvent.create({
      data: {
        id: eventId,
        schoolId,
        calendarId,
        createdByUserId: adminId,
        title: "Sự kiện sức chứa 1",
        startsAt: start,
        endsAt: end,
        capacity: 1,
        status: "CONFIRMED",
      },
    });
    await db.calendarEvent.create({
      data: {
        id: otherEventId,
        schoolId: otherSchoolId,
        calendarId: otherCalendarId,
        createdByUserId: outsiderId,
        title: "Sự kiện trường khác",
        startsAt: start,
        endsAt: end,
        capacity: 0,
        status: "CONFIRMED",
      },
    });
  });

  afterAll(async () => {
    await db.notification.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
    await db.auditEvent.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
    await db.calendarBooking.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
    await db.calendarEvent.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
    await db.calendar.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
    await db.schoolRoleAssignment.deleteMany({ where: { membership: { schoolId: { in: [schoolId, otherSchoolId] } } } });
    await db.schoolMembership.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
    await db.user.deleteMany({ where: { id: { in: [adminId, studentAId, studentBId, outsiderId] } } });
    await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  });

  it("only books one of two concurrent requests for a capacity-1 event; the other is waitlisted", async () => {
    const [resultA, resultB] = await Promise.all([
      bookCalendarEvent(studentAActor, eventId),
      bookCalendarEvent(studentBActor, eventId),
    ]);
    const statuses = [resultA.status, resultB.status].sort();
    expect(statuses).toEqual(["BOOKED", "WAITLISTED"]);

    const booked = await db.calendarBooking.findMany({ where: { eventId, status: "BOOKED" } });
    expect(booked).toHaveLength(1);
    const waitlisted = await db.calendarBooking.findMany({ where: { eventId, status: "WAITLISTED" } });
    expect(waitlisted).toHaveLength(1);
  });

  it("promotes the waitlisted user and notifies them when the booked slot is cancelled", async () => {
    const bookedBefore = await db.calendarBooking.findFirstOrThrow({ where: { eventId, status: "BOOKED" } });
    const bookedActor = bookedBefore.userId === studentAId ? studentAActor : studentBActor;
    const waitlistedUserId = bookedBefore.userId === studentAId ? studentBId : studentAId;

    const result = await cancelCalendarBooking(bookedActor, eventId);
    expect(result.promotedUserId).toBe(waitlistedUserId);

    const promoted = await db.calendarBooking.findFirstOrThrow({ where: { eventId, userId: waitlistedUserId } });
    expect(promoted.status).toBe("BOOKED");

    const notification = await db.notification.findFirst({
      where: { schoolId, userId: waitlistedUserId, type: "CALENDAR_WAITLIST_PROMOTED" },
    });
    expect(notification).not.toBeNull();

    const audit = await db.auditEvent.findFirst({
      where: { schoolId, action: "calendar.booking.cancel" },
    });
    expect(audit).not.toBeNull();
  });

  it("scopes iCalendar export to the requested calendar and excludes other schools' events", async () => {
    const ical = await exportCalendarIcal(adminActor, {
      calendarId,
      from: new Date(Date.now()),
      to: new Date(Date.now() + 10 * 86_400_000),
    });
    expect(ical).toContain("Sự kiện sức chứa 1");
    expect(ical).not.toContain("Sự kiện trường khác");

    await expect(
      exportCalendarIcal(adminActor, {
        calendarId: otherCalendarId,
        from: new Date(),
        to: new Date(Date.now() + 10 * 86_400_000),
      }),
    ).rejects.toThrow();
  });
});
