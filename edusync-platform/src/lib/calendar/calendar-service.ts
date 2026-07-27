import "server-only";

import { randomUUID } from "node:crypto";

import type { AuthorizationContext } from "@/lib/auth/policies";
import { hasPermission, getSchoolPermissions, permissions } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import {
  computeReminderDueAt,
  expandRecurringEvent,
  isReminderDue,
  isValidReminderMinutes,
  nextWaitlistPosition,
} from "@/lib/calendar/calendar-domain";

export class CalendarAuthorizationError extends Error {
  readonly code = "CALENDAR_FORBIDDEN";
}
export class CalendarValidationError extends Error {
  readonly code = "CALENDAR_INVALID";
}
export class CalendarConflictError extends Error {
  readonly code = "CALENDAR_CONFLICT";
}

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

export async function listBookableResources(actor: AuthorizationContext) {
  requireCalendarActor(actor, permissions.calendarEventRead);
  return db.bookableResource.findMany({
    where: { schoolId: actor.schoolId },
    include: {
      blockedPeriods: {
        where: { endsAt: { gt: new Date() } },
        orderBy: { startsAt: "asc" },
        take: 20,
      },
      _count: { select: { events: true } },
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export async function createBookableResource(
  actor: AuthorizationContext,
  input: Readonly<{ name: string; kind?: string; capacity?: number }>,
) {
  requireCalendarActor(actor, permissions.calendarSchoolManage);
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) {
    throw new CalendarValidationError("Tên phòng hoặc tài nguyên phải dài 2–120 ký tự.");
  }
  const capacity = Math.max(1, Math.min(input.capacity ?? 1, 10_000));
  const kind = input.kind?.trim().toUpperCase() || "ROOM";
  if (!["ROOM", "HALL", "EQUIPMENT"].includes(kind)) {
    throw new CalendarValidationError("Loại tài nguyên không hợp lệ.");
  }
  return db.bookableResource.create({
    data: {
      schoolId: actor.schoolId,
      createdById: actor.userId,
      name,
      kind,
      capacity,
    },
  });
}

export async function updateBookableResource(
  actor: AuthorizationContext,
  input: Readonly<{ resourceId: string; active: boolean; capacity?: number }>,
) {
  requireCalendarActor(actor, permissions.calendarSchoolManage);
  const resource = await db.bookableResource.findFirst({
    where: { id: input.resourceId, schoolId: actor.schoolId },
    select: { id: true },
  });
  if (!resource) throw new CalendarAuthorizationError("Không tìm thấy tài nguyên.");
  return db.bookableResource.update({
    where: { id: resource.id },
    data: {
      active: input.active,
      capacity: Math.max(1, Math.min(input.capacity ?? 1, 10_000)),
    },
  });
}

export async function createBlockedPeriod(
  actor: AuthorizationContext,
  input: Readonly<{ resourceId: string; startsAt: Date; endsAt: Date; reason?: string }>,
) {
  requireCalendarActor(actor, permissions.calendarSchoolManage);
  if (
    Number.isNaN(input.startsAt.getTime()) ||
    Number.isNaN(input.endsAt.getTime()) ||
    input.startsAt >= input.endsAt ||
    input.endsAt <= new Date()
  ) {
    throw new CalendarValidationError("Khoảng thời gian khóa không hợp lệ.");
  }
  const reason = input.reason?.trim();
  if (reason && reason.length > 300) {
    throw new CalendarValidationError("Lý do khóa không được quá 300 ký tự.");
  }
  const resource = await db.bookableResource.findFirst({
    where: { id: input.resourceId, schoolId: actor.schoolId },
    select: { id: true },
  });
  if (!resource) throw new CalendarAuthorizationError("Không tìm thấy tài nguyên.");
  return db.$transaction(async (transaction) => {
    await transaction.$queryRaw<Array<{ locked: string }>>`
      SELECT pg_advisory_xact_lock(hashtextextended(${`resource:${actor.schoolId}:${resource.id}`}, 0))::text AS locked
    `;
    const conflict = await transaction.calendarEvent.findFirst({
      where: {
        schoolId: actor.schoolId,
        resourceId: resource.id,
        status: "CONFIRMED",
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt },
      },
      select: { title: true },
    });
    if (conflict) throw new CalendarConflictError(`Đã có sự kiện “${conflict.title}” trong khung giờ này.`);
    return transaction.blockedPeriod.create({
      data: {
        schoolId: actor.schoolId,
        resourceId: resource.id,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        reason: reason || undefined,
      },
    });
  });
}

export async function deleteBlockedPeriod(actor: AuthorizationContext, blockedPeriodId: string) {
  requireCalendarActor(actor, permissions.calendarSchoolManage);
  const blockedPeriod = await db.blockedPeriod.findFirst({
    where: { id: blockedPeriodId, schoolId: actor.schoolId },
    select: { id: true },
  });
  if (!blockedPeriod) throw new CalendarAuthorizationError("Không tìm thấy khoảng khóa.");
  return db.blockedPeriod.delete({ where: { id: blockedPeriod.id } });
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
  const events = await db.calendarEvent.findMany({
    where: {
      schoolId: actor.schoolId,
      calendarId: calendar.id,
      status: "CONFIRMED",
      startsAt: { lt: input.to },
    },
    include: {
      recurrenceRule: true,
      exceptions: true,
      resource: { select: { id: true, name: true, capacity: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { startsAt: "asc" },
  });
  const expanded = events.flatMap((event) => {
    if (!event.recurrenceRule) {
      return event.endsAt > input.from
        ? [{ ...event, sourceEventId: event.id, occurrenceStartsAt: event.startsAt.toISOString() }]
        : [];
    }
    const instances = expandRecurringEvent({
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      frequency: event.recurrenceRule.frequency,
      interval: event.recurrenceRule.interval,
      count: event.recurrenceRule.count ?? undefined,
      until: event.recurrenceRule.until ?? undefined,
      exceptions: event.exceptions.map((exception) => ({
        startsAt: exception.startsAt.toISOString(),
        cancelled: exception.cancelled,
        movedTo: exception.movedTo?.toISOString(),
      })),
    });
    return instances
      .map((instance) => ({
        ...event,
        id: `${event.id}:${instance.startsAt}`,
        sourceEventId: event.id,
        occurrenceStartsAt: instance.startsAt,
        startsAt: new Date(instance.startsAt),
        endsAt: new Date(instance.endsAt),
      }))
      .filter((instance) => instance.startsAt < input.to && instance.endsAt > input.from);
  });
  return expanded.sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
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
  const resource = input.resourceId
    ? await db.bookableResource.findFirst({
        where: { id: input.resourceId, schoolId: actor.schoolId, active: true },
        select: { id: true, capacity: true },
      })
    : null;
  if (input.resourceId && !resource) {
    throw new CalendarValidationError("Phòng hoặc tài nguyên không khả dụng.");
  }
  if (resource && input.capacity && input.capacity > resource.capacity) {
    throw new CalendarValidationError("Sức chứa sự kiện vượt quá sức chứa tài nguyên.");
  }
  return db.$transaction(async (transaction) => {
    const lockKey = input.resourceId
      ? `resource:${actor.schoolId}:${input.resourceId}`
      : `calendar:${actor.schoolId}:${calendar.id}`;
    await transaction.$queryRaw<Array<{ locked: string }>>`
      SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))::text AS locked
    `;
    const conflict = await transaction.calendarEvent.findFirst({
      where: {
        schoolId: actor.schoolId,
        status: "CONFIRMED",
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt },
        ...(input.resourceId ? { resourceId: input.resourceId } : { calendarId: calendar.id }),
      },
      select: { id: true, title: true, startsAt: true, endsAt: true },
    });
    if (conflict) throw new CalendarConflictError(`Trùng lịch với “${conflict.title}”.`);
    if (input.resourceId) {
      const blocked = await transaction.blockedPeriod.findFirst({
        where: {
          schoolId: actor.schoolId,
          resourceId: input.resourceId,
          startsAt: { lt: input.endsAt },
          endsAt: { gt: input.startsAt },
        },
        select: { reason: true },
      });
      if (blocked) {
        throw new CalendarConflictError(
          blocked.reason ? `Tài nguyên đang khóa: ${blocked.reason}.` : "Tài nguyên đang bị khóa.",
        );
      }
    }
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

/**
 * Cancel the actor's own booking or waitlist entry. Freeing a BOOKED slot
 * promotes the earliest-joined WAITLISTED entry (transactional, advisory
 * lock) and notifies the promoted user through the durable notification
 * center (in-app row now, SSE push if connected, poll fallback otherwise).
 */
export async function cancelCalendarBooking(actor: AuthorizationContext, eventId: string) {
  requireCalendarActor(actor, permissions.calendarEventCancel);
  return db.$transaction(async (transaction) => {
    await transaction.$queryRaw<Array<{ locked: string }>>`SELECT pg_advisory_xact_lock(hashtextextended(${`booking:${eventId}`}, 0))::text AS locked`;
    const booking = await transaction.calendarBooking.findFirst({
      where: {
        eventId,
        userId: actor.userId,
        schoolId: actor.schoolId,
        status: { in: ["BOOKED", "WAITLISTED"] },
      },
    });
    if (!booking) throw new CalendarValidationError("Không tìm thấy đăng ký để hủy.");

    await transaction.calendarBooking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED", position: null },
    });

    let promotedUserId: string | null = null;
    if (booking.status === "BOOKED") {
      const next = await transaction.calendarBooking.findFirst({
        where: { eventId, status: "WAITLISTED" },
        orderBy: { position: "asc" },
      });
      if (next) {
        await transaction.calendarBooking.update({
          where: { id: next.id },
          data: { status: "BOOKED", position: null },
        });
        promotedUserId = next.userId;
        const event = await transaction.calendarEvent.findUnique({
          where: { id: eventId },
          select: { title: true },
        });
        await transaction.notification.create({
          data: {
            schoolId: actor.schoolId,
            userId: next.userId,
            type: "CALENDAR_WAITLIST_PROMOTED",
            title: `Bạn đã được chuyển từ danh sách chờ sang tham gia "${event?.title ?? "sự kiện"}"`,
            href: `/dashboard/calendar/${eventId}`,
            dedupeKey: `calendar.booking.promoted:${eventId}:${next.userId}`,
          },
        });
      }
    }

    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        actorType: "USER",
        action: "calendar.booking.cancel",
        entityType: "CalendarBooking",
        entityId: booking.id,
        afterJson: { promotedUserId },
        requestId: randomUUID(),
      },
    });

    return { cancelled: true, promotedUserId };
  });
}

/** Configure a reminder lead time (in minutes) for an event. Idempotent per (event, lead time). */
export async function scheduleEventReminder(
  actor: AuthorizationContext,
  eventId: string,
  minutesBefore: number,
) {
  requireCalendarActor(actor, permissions.calendarEventUpdate);
  if (!isValidReminderMinutes(minutesBefore)) {
    throw new CalendarValidationError("Thời gian nhắc việc không hợp lệ.");
  }
  const event = await db.calendarEvent.findFirst({
    where: { id: eventId, schoolId: actor.schoolId },
    select: { id: true },
  });
  if (!event) throw new CalendarValidationError("Không tìm thấy sự kiện.");
  return db.calendarReminder.upsert({
    where: { eventId_minutesBefore: { eventId, minutesBefore } },
    create: { schoolId: actor.schoolId, eventId, minutesBefore },
    update: {},
  });
}

/**
 * System job: notify every booked user for each reminder whose due time has
 * passed and that has not yet been sent. Idempotent — a reminder cannot be
 * sent twice. Returns the number of reminders sent.
 */
export async function sendDueCalendarReminders(now: Date = new Date()): Promise<number> {
  const pending = await db.calendarReminder.findMany({
    where: { sentAt: null },
    include: {
      event: {
        select: {
          id: true,
          schoolId: true,
          title: true,
          startsAt: true,
          bookings: { where: { status: "BOOKED" }, select: { userId: true } },
        },
      },
    },
    take: 200,
  });
  let sent = 0;
  for (const reminder of pending) {
    if (!isReminderDue(computeReminderDueAt(reminder.event.startsAt, reminder.minutesBefore), now)) {
      continue;
    }
    await db.$transaction(async (transaction) => {
      const marked = await transaction.calendarReminder.updateMany({
        where: { id: reminder.id, sentAt: null },
        data: { sentAt: now },
      });
      if (marked.count !== 1) return;
      if (reminder.event.bookings.length > 0) {
        await transaction.notification.createMany({
          data: reminder.event.bookings.map((booking) => ({
            schoolId: reminder.event.schoolId,
            userId: booking.userId,
            type: "CALENDAR_REMINDER",
            title: `Sắp diễn ra: "${reminder.event.title}"`,
            href: `/dashboard/calendar/${reminder.event.id}`,
            dedupeKey: `calendar.reminder:${reminder.id}:${booking.userId}`,
          })),
          skipDuplicates: true,
        });
      }
    });
    sent += 1;
  }
  return sent;
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
      recurrenceRule: true,
      exceptions: { orderBy: { startsAt: "asc" } },
      resource: { select: { name: true, capacity: true } },
      bookings: { where: { status: { in: ["BOOKED", "WAITLISTED"] } }, include: { user: { select: { id: true, displayName: true } } }, orderBy: { position: "asc" } },
      attendance: { include: { user: { select: { id: true, displayName: true } } } },
      reminders: { orderBy: { minutesBefore: "asc" } },
    },
  });
}

export async function setRecurrenceException(
  actor: AuthorizationContext,
  input: Readonly<{ eventId: string; startsAt: Date; cancelled: boolean; movedTo?: Date }>,
) {
  requireCalendarActor(actor, permissions.calendarEventUpdate);
  if (!(input.startsAt instanceof Date) || Number.isNaN(input.startsAt.getTime())) {
    throw new CalendarValidationError("Ngày ngoại lệ không hợp lệ.");
  }
  if (!input.cancelled && (!input.movedTo || Number.isNaN(input.movedTo.getTime()))) {
    throw new CalendarValidationError("Cần chọn thời điểm chuyển lịch.");
  }
  const event = await db.calendarEvent.findFirst({
    where: { id: input.eventId, schoolId: actor.schoolId, recurrenceRuleId: { not: null } },
    select: { id: true },
  });
  if (!event) throw new CalendarValidationError("Sự kiện không có lịch lặp.");
  if (!input.cancelled && input.movedTo && input.movedTo <= input.startsAt) {
    throw new CalendarValidationError("Ngày chuyển phải sau ngày gốc.");
  }
  return db.recurrenceException.upsert({
    where: { eventId_startsAt: { eventId: input.eventId, startsAt: input.startsAt } },
    create: {
      eventId: input.eventId,
      startsAt: input.startsAt,
      cancelled: input.cancelled,
      movedTo: input.cancelled ? null : input.movedTo,
    },
    update: {
      cancelled: input.cancelled,
      movedTo: input.cancelled ? null : input.movedTo,
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
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EduSync//Calendar//VI"];
  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@edusync.local`,
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
