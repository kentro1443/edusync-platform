import "server-only";

import type { AuthorizationContext } from "@/lib/auth/policies";
import { hasPermission, getSchoolPermissions, permissions } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { nextWaitlistPosition } from "@/lib/calendar/calendar-domain";

export class CalendarAuthorizationError extends Error {}
export class CalendarValidationError extends Error {}
export class CalendarConflictError extends Error {}

type SchoolActor = AuthorizationContext & { schoolId: string; membershipId: string };

function requireCalendarActor(
  actor: AuthorizationContext,
  permission: (typeof permissions)[keyof typeof permissions],
): asserts actor is SchoolActor {
  if (
    !actor.schoolId ||
    !actor.membershipId ||
    !hasPermission(getSchoolPermissions(actor.schoolRoles), permission)
  ) {
    throw new CalendarAuthorizationError("Bạn không có quyền thao tác lịch.");
  }
}

async function ensureDefaultCalendar(actor: SchoolActor) {
  const existing = await db.calendar.findFirst({
    where: { schoolId: actor.schoolId, active: true },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;
  return db.calendar.upsert({
    where: { schoolId_name: { schoolId: actor.schoolId, name: "Lịch chung trường" } },
    create: {
      schoolId: actor.schoolId,
      name: "Lịch chung trường",
      description: "Lịch dùng chung cho lịch học, hoạt động và đặt chỗ.",
      visibility: "SCHOOL",
      ownerUserId: actor.userId,
    },
    update: { active: true },
  });
}

export async function listCalendars(actor: AuthorizationContext) {
  requireCalendarActor(actor, permissions.calendarEventRead);
  await ensureDefaultCalendar(actor);
  return db.calendar.findMany({
    where: {
      schoolId: actor.schoolId,
      active: true,
      OR: [
        { visibility: "SCHOOL" },
        { ownerUserId: actor.userId },
      ],
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, description: true, visibility: true, timezone: true },
  });
}

export async function listCalendarEvents(
  actor: AuthorizationContext,
  input: Readonly<{ calendarId?: string; from: Date; to: Date }>,
) {
  requireCalendarActor(actor, permissions.calendarEventRead);
  const calendar = input.calendarId
    ? await db.calendar.findFirst({
        where: {
          id: input.calendarId,
          schoolId: actor.schoolId,
          active: true,
          OR: [{ visibility: "SCHOOL" }, { ownerUserId: actor.userId }],
        },
      })
    : await ensureDefaultCalendar(actor);
  if (!calendar) throw new CalendarAuthorizationError("Không tìm thấy lịch được phép xem.");
  return db.calendarEvent.findMany({
    where: {
      schoolId: actor.schoolId,
      calendarId: calendar.id,
      status: "CONFIRMED",
      startsAt: { lt: input.to },
      endsAt: { gt: input.from },
    },
    include: {
      recurrenceRule: true,
      exceptions: true,
      resource: { select: { id: true, name: true, capacity: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { startsAt: "asc" },
  });
}

export async function createCalendarEvent(
  actor: AuthorizationContext,
  input: Readonly<{
    calendarId?: string;
    title: string;
    description?: string;
    startsAt: Date;
    endsAt: Date;
    location?: string;
    capacity?: number;
    resourceId?: string;
    recurrence?: Readonly<{
      frequency: "DAILY" | "WEEKLY" | "MONTHLY";
      interval: number;
      count?: number;
      until?: Date;
    }>;
  }>,
) {
  requireCalendarActor(actor, permissions.calendarEventCreate);
  if (
    !input.title.trim() ||
    input.title.trim().length > 160 ||
    !(input.startsAt instanceof Date) ||
    !(input.endsAt instanceof Date) ||
    input.startsAt >= input.endsAt ||
    input.startsAt <= new Date()
  ) {
    throw new CalendarValidationError("Thông tin sự kiện không hợp lệ.");
  }
  const calendar = input.calendarId
    ? await db.calendar.findFirst({ where: { id: input.calendarId, schoolId: actor.schoolId, active: true } })
    : await ensureDefaultCalendar(actor);
  if (!calendar) throw new CalendarAuthorizationError("Không tìm thấy lịch.");
  return db.$transaction(async (transaction) => {
    await transaction.$queryRaw<Array<{ locked: string }>>`SELECT pg_advisory_xact_lock(hashtextextended(${`calendar:${actor.schoolId}:${calendar.id}`}, 0))::text AS locked`;
    const conflict = await transaction.calendarEvent.findFirst({
      where: {
        schoolId: actor.schoolId,
        calendarId: calendar.id,
        status: "CONFIRMED",
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt },
        ...(input.resourceId ? { resourceId: input.resourceId } : {}),
      },
      select: { id: true, title: true, startsAt: true, endsAt: true },
    });
    if (conflict) throw new CalendarConflictError(`Trùng lịch với “${conflict.title}”.`);
    let recurrenceRuleId: string | undefined;
    if (input.recurrence) {
      const recurrence = await transaction.recurrenceRule.create({
        data: {
          frequency: input.recurrence.frequency,
          interval: Math.max(1, Math.min(input.recurrence.interval, 52)),
          count: input.recurrence.count,
          until: input.recurrence.until,
          byWeekday: [],
        },
      });
      recurrenceRuleId = recurrence.id;
    }
    return transaction.calendarEvent.create({
      data: {
        schoolId: actor.schoolId,
        calendarId: calendar.id,
        createdByUserId: actor.userId,
        resourceId: input.resourceId,
        recurrenceRuleId,
        title: input.title.trim(),
        description: input.description?.trim() || undefined,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        location: input.location?.trim() || undefined,
        capacity: Math.max(0, Math.min(input.capacity ?? 0, 10_000)),
      },
    });
  });
}

export async function bookCalendarEvent(actor: AuthorizationContext, eventId: string) {
  requireCalendarActor(actor, permissions.calendarEventCreate);
  const event = await db.calendarEvent.findFirst({
    where: {
      id: eventId,
      schoolId: actor.schoolId,
      status: "CONFIRMED",
      calendar: { OR: [{ visibility: "SCHOOL" }, { ownerUserId: actor.userId }] },
    },
    select: { id: true, calendarId: true, capacity: true, _count: { select: { bookings: true } } },
  });
  if (!event) throw new CalendarValidationError("Sự kiện không tồn tại hoặc đã đóng.");

  return db.$transaction(async (transaction) => {
    await transaction.$queryRaw<Array<{ locked: string }>>`SELECT pg_advisory_xact_lock(hashtextextended(${`booking:${event.id}`}, 0))::text AS locked`;
    const existing = await transaction.calendarBooking.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: actor.userId } },
    });
    if (existing?.status === "BOOKED" || existing?.status === "WAITLISTED") return existing;
    const bookedCount = await transaction.calendarBooking.count({
      where: { eventId: event.id, status: "BOOKED" },
    });
    const status = event.capacity > 0 && bookedCount >= event.capacity ? "WAITLISTED" : "BOOKED";
    const positions = await transaction.calendarBooking.findMany({
      where: { eventId: event.id, status: "WAITLISTED" },
      select: { position: true },
    });
    return transaction.calendarBooking.upsert({
      where: { eventId_userId: { eventId: event.id, userId: actor.userId } },
      create: {
        schoolId: actor.schoolId,
        calendarId: event.calendarId,
        eventId: event.id,
        userId: actor.userId,
        status,
        position: status === "WAITLISTED" ? nextWaitlistPosition(positions.map((item) => item.position ?? 0)) : null,
      },
      update: { status, position: status === "WAITLISTED" ? nextWaitlistPosition(positions.map((item) => item.position ?? 0)) : null },
    });
  });
}

export async function recordCalendarAttendance(
  actor: AuthorizationContext,
  input: Readonly<{ eventId: string; userId: string; status: "PRESENT" | "ABSENT" | "EXCUSED"; note?: string }>,
) {
  requireCalendarActor(actor, permissions.calendarAttendanceRecord);
  const event = await db.calendarEvent.findFirst({ where: { id: input.eventId, schoolId: actor.schoolId } });
  if (!event) throw new CalendarValidationError("Không tìm thấy sự kiện.");
  return db.calendarAttendance.upsert({
    where: { eventId_userId: { eventId: input.eventId, userId: input.userId } },
    create: {
      schoolId: actor.schoolId,
      eventId: input.eventId,
      userId: input.userId,
      status: input.status,
      checkedInAt: input.status === "PRESENT" ? new Date() : null,
      recordedByUserId: actor.userId,
      note: input.note?.trim() || undefined,
    },
    update: {
      status: input.status,
      checkedInAt: input.status === "PRESENT" ? new Date() : null,
      recordedByUserId: actor.userId,
      note: input.note?.trim() || undefined,
    },
  });
}

export async function getCalendarEvent(actor: AuthorizationContext, eventId: string) {
  requireCalendarActor(actor, permissions.calendarEventRead);
  return db.calendarEvent.findFirst({
    where: {
      id: eventId,
      schoolId: actor.schoolId,
      calendar: { OR: [{ visibility: "SCHOOL" }, { ownerUserId: actor.userId }] },
    },
    include: {
      calendar: { select: { name: true } },
      resource: { select: { name: true, capacity: true } },
      bookings: { where: { status: { in: ["BOOKED", "WAITLISTED"] } }, include: { user: { select: { id: true, displayName: true } } }, orderBy: { position: "asc" } },
      attendance: { include: { user: { select: { id: true, displayName: true } } } },
    },
  });
}

function escapeIcal(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
}

export async function exportCalendarIcal(
  actor: AuthorizationContext,
  input: Readonly<{ calendarId?: string; from: Date; to: Date }>,
): Promise<string> {
  const events = await listCalendarEvents(actor, input);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EduTech//Calendar//VI"];
  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@edutech.local`,
      `DTSTAMP:${formatIcalDate(new Date())}`,
      `DTSTART:${formatIcalDate(event.startsAt)}`,
      `DTEND:${formatIcalDate(event.endsAt)}`,
      `SUMMARY:${escapeIcal(event.title)}`,
      ...(event.description ? [`DESCRIPTION:${escapeIcal(event.description)}`] : []),
      ...(event.location ? [`LOCATION:${escapeIcal(event.location)}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

function formatIcalDate(date: Date): string {
  return date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
}
