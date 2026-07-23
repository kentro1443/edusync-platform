"use server";

import { redirect } from "next/navigation";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import {
  bookCalendarEvent,
  CalendarConflictError,
  CalendarValidationError,
  createBlockedPeriod,
  createBookableResource,
  createCalendarEvent,
  deleteBlockedPeriod,
  recordCalendarAttendance,
  setRecurrenceException,
  updateBookableResource,
} from "@/lib/calendar/calendar-service";

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

function errorCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;
}

export async function recordCalendarAttendanceAction(formData: FormData): Promise<never> {
  const eventId = value(formData, "eventId");
  const { actor } = await requireSchoolContext(permissions.calendarAttendanceRecord);
  try {
    await recordCalendarAttendance(actor, {
      eventId,
      userId: value(formData, "userId"),
      status: value(formData, "status") as "PRESENT" | "ABSENT" | "EXCUSED",
      note: value(formData, "note"),
    });
  } catch {
    redirect(`/dashboard/calendar/${eventId}?error=attendance`);
  }
  redirect(`/dashboard/calendar/${eventId}?result=attendance`);
}

export async function createCalendarEventAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.calendarEventCreate);
  let failure: "conflict" | "invalid" | "forbidden" | undefined;
  try {
    await createCalendarEvent(actor, {
      calendarId: value(formData, "calendarId") || undefined,
      title: value(formData, "title"),
      description: value(formData, "description"),
      startsAt: new Date(value(formData, "startsAt")),
      endsAt: new Date(value(formData, "endsAt")),
      location: value(formData, "location"),
      capacity: Number(value(formData, "capacity") || 0),
      resourceId: value(formData, "resourceId") || undefined,
      recurrence: value(formData, "frequency")
        ? {
            frequency: value(formData, "frequency") as "DAILY" | "WEEKLY" | "MONTHLY",
            interval: Number(value(formData, "interval") || 1),
            count: Number(value(formData, "count") || 0) || undefined,
          }
        : undefined,
    });
  } catch (error) {
    const code = errorCode(error);
    failure = error instanceof CalendarConflictError || code === "CALENDAR_CONFLICT"
      ? "conflict"
      : error instanceof CalendarValidationError || code === "CALENDAR_INVALID"
        ? "invalid"
        : "forbidden";
  }
  if (failure) redirect(`/dashboard/calendar?error=${failure}`);
  redirect("/dashboard/calendar?result=created");
}

export async function createBookableResourceAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.calendarSchoolManage);
  try {
    await createBookableResource(actor, {
      name: value(formData, "name"),
      kind: value(formData, "kind"),
      capacity: Number(value(formData, "capacity") || 1),
    });
  } catch {
    redirect("/dashboard/calendar/resources?error=resource");
  }
  redirect("/dashboard/calendar/resources?result=resource");
}

export async function updateBookableResourceAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.calendarSchoolManage);
  try {
    await updateBookableResource(actor, {
      resourceId: value(formData, "resourceId"),
      active: value(formData, "active") === "true",
      capacity: Number(value(formData, "capacity") || 1),
    });
  } catch {
    redirect("/dashboard/calendar/resources?error=update");
  }
  redirect("/dashboard/calendar/resources?result=update");
}

export async function createBlockedPeriodAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.calendarSchoolManage);
  let failure: "conflict" | "blocked" | undefined;
  try {
    await createBlockedPeriod(actor, {
      resourceId: value(formData, "resourceId"),
      startsAt: new Date(value(formData, "startsAt")),
      endsAt: new Date(value(formData, "endsAt")),
      reason: value(formData, "reason"),
    });
  } catch (error) {
    failure = error instanceof CalendarConflictError || errorCode(error) === "CALENDAR_CONFLICT"
      ? "conflict"
      : "blocked";
  }
  if (failure) redirect(`/dashboard/calendar/resources?error=${failure}`);
  redirect("/dashboard/calendar/resources?result=blocked");
}

export async function deleteBlockedPeriodAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.calendarSchoolManage);
  try {
    await deleteBlockedPeriod(actor, value(formData, "blockedPeriodId"));
  } catch {
    redirect("/dashboard/calendar/resources?error=delete");
  }
  redirect("/dashboard/calendar/resources?result=delete");
}

export async function bookCalendarEventAction(formData: FormData): Promise<never> {
  const eventId = value(formData, "eventId");
  const { actor } = await requireSchoolContext(permissions.calendarEventCreate);
  try {
    await bookCalendarEvent(actor, eventId);
  } catch {
    redirect("/dashboard/calendar?error=booking");
  }
  redirect("/dashboard/calendar?result=booked");
}

export async function setRecurrenceExceptionAction(formData: FormData): Promise<never> {
  const eventId = value(formData, "eventId");
  const { actor } = await requireSchoolContext(permissions.calendarEventUpdate);
  try {
    const movedTo = value(formData, "movedTo");
    await setRecurrenceException(actor, {
      eventId,
      startsAt: new Date(value(formData, "startsAt")),
      cancelled: value(formData, "mode") === "cancel",
      movedTo: movedTo ? new Date(movedTo) : undefined,
    });
  } catch {
    redirect(`/dashboard/calendar/${eventId}?error=recurrence`);
  }
  redirect(`/dashboard/calendar/${eventId}?result=recurrence`);
}
