"use server";

import { redirect } from "next/navigation";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import {
  bookCalendarEvent,
  CalendarConflictError,
  CalendarValidationError,
  createCalendarEvent,
  recordCalendarAttendance,
} from "@/lib/calendar/calendar-service";

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
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
  try {
    await createCalendarEvent(actor, {
      calendarId: value(formData, "calendarId") || undefined,
      title: value(formData, "title"),
      description: value(formData, "description"),
      startsAt: new Date(value(formData, "startsAt")),
      endsAt: new Date(value(formData, "endsAt")),
      location: value(formData, "location"),
      capacity: Number(value(formData, "capacity") || 0),
      recurrence: value(formData, "frequency")
        ? {
            frequency: value(formData, "frequency") as "DAILY" | "WEEKLY" | "MONTHLY",
            interval: Number(value(formData, "interval") || 1),
            count: Number(value(formData, "count") || 0) || undefined,
          }
        : undefined,
    });
  } catch (error) {
    if (error instanceof CalendarConflictError) redirect("/dashboard/calendar?error=conflict");
    if (error instanceof CalendarValidationError) redirect("/dashboard/calendar?error=invalid");
    redirect("/dashboard/calendar?error=forbidden");
  }
  redirect("/dashboard/calendar?result=created");
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
