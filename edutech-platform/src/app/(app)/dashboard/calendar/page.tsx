import Link from "next/link";

import { createCalendarEventAction, bookCalendarEventAction } from "@/app/(app)/dashboard/calendar/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { listCalendarEvents, listCalendars } from "@/lib/calendar/calendar-service";

function rangeFor(view: string, dateValue?: string) {
  const anchor = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  if (view === "day") return { from: start, to: new Date(start.getTime() + 86_400_000) };
  if (view === "month") {
    return {
      from: new Date(start.getFullYear(), start.getMonth(), 1),
      to: new Date(start.getFullYear(), start.getMonth() + 1, 1),
    };
  }
  const day = start.getDay() || 7;
  const from = new Date(start);
  from.setDate(start.getDate() - day + 1);
  return { from, to: new Date(from.getTime() + 7 * 86_400_000) };
}

const dateTime = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; calendarId?: string; result?: string; error?: string }>;
}) {
  const [{ actor }, params] = await Promise.all([
    requireSchoolContext(permissions.calendarEventRead),
    searchParams,
  ]);
  const view = ["day", "week", "month"].includes(params.view ?? "") ? params.view! : "week";
  const range = rangeFor(view, params.date);
  const [calendars, events] = await Promise.all([
    listCalendars(actor),
    listCalendarEvents(actor, { calendarId: params.calendarId, ...range }),
  ]);
  const calendarId = params.calendarId ?? calendars[0]?.id;
  const canCreate = actor.schoolRoles.some((role) =>
    ["SCHOOL_ADMIN", "TEACHER_STAFF", "MENTOR_COUNSELOR", "STUDENT", "CLUB_LEADER", "APPROVER_REVIEWER"].includes(role),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lịch & đặt chỗ"
        title="Lịch trường rõ ràng, dễ điều phối"
        description="Xem theo ngày, tuần hoặc tháng; tạo sự kiện, giữ chỗ và xuất lịch iCalendar trong phạm vi được phép."
        actions={
          <div className="flex flex-wrap gap-2">
            <a
              href={`/dashboard/calendar/ical?calendarId=${calendarId ?? ""}&from=${range.from.toISOString()}&to=${range.to.toISOString()}`}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-ink-300)] bg-white px-4 text-sm font-semibold text-[var(--color-ink-800)] hover:bg-[var(--color-ink-50)]"
            >
              Xuất iCalendar
            </a>
            <LinkButton href="/dashboard/appointments" variant="outline" size="sm">Lịch hẹn cố vấn</LinkButton>
          </div>
        }
      />

      {params.result ? <Alert tone="success" title="Đã cập nhật lịch">Thay đổi đã được lưu.</Alert> : null}
      {params.error ? <Alert tone={params.error === "conflict" ? "warning" : "danger"} title={params.error === "conflict" ? "Khung giờ bị trùng" : "Không thể cập nhật lịch"}>Kiểm tra lại dữ liệu hoặc quyền truy cập.</Alert> : null}

      <Card>
        <form method="get" className="grid gap-4 md:grid-cols-[10rem_12rem_1fr_auto] md:items-end">
          <Field id="view" label="Hiển thị">
            <Select id="view" name="view" defaultValue={view}>
              <option value="day">Ngày</option>
              <option value="week">Tuần</option>
              <option value="month">Tháng</option>
            </Select>
          </Field>
          <Field id="date" label="Mốc thời gian">
            <Input id="date" name="date" type="date" defaultValue={params.date ?? new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field id="calendarId" label="Lịch">
            <Select id="calendarId" name="calendarId" defaultValue={calendarId ?? ""}>
              {calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.name}</option>)}
            </Select>
          </Field>
          <Button type="submit" variant="outline">Áp dụng</Button>
        </form>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-ink-100)] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-ink-900)]">{view === "day" ? "Agenda ngày" : view === "month" ? "Tổng quan tháng" : "Tuần làm việc"}</h2>
              <p className="mt-1 text-sm text-[var(--color-ink-500)]">{events.length} sự kiện trong phạm vi · múi giờ Asia/Ho_Chi_Minh</p>
            </div>
            <Badge tone="brand">{calendars.find((calendar) => calendar.id === calendarId)?.name ?? "Lịch chung"}</Badge>
          </div>
          {events.length === 0 ? (
            <EmptyState title="Chưa có sự kiện" description="Tạo lịch đầu tiên hoặc đổi mốc thời gian để xem dữ liệu." />
          ) : (
            <ul className="divide-y divide-[var(--color-ink-100)]">
              {events.map((event) => (
                <li key={event.id} className="py-4 first:pt-1 last:pb-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-brand-800)]">{dateTime.format(event.startsAt)} – {new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(event.endsAt)}</p>
                      <h3 className="mt-1 text-base font-bold text-[var(--color-ink-900)]"><Link href={`/dashboard/calendar/${event.id}`} className="hover:text-[var(--color-brand-700)] hover:underline">{event.title}</Link></h3>
                      <p className="mt-1 text-sm text-[var(--color-ink-500)]">{event.location || "Chưa có địa điểm"} · {event._count.bookings} lượt giữ chỗ{event.capacity > 0 ? ` / ${event.capacity}` : ""}</p>
                    </div>
                    {canCreate ? (
                      <form action={bookCalendarEventAction}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <Button type="submit" size="sm" variant="outline">Giữ chỗ</Button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {canCreate ? (
          <Card>
            <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Tạo sự kiện</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-ink-500)]">Form ngắn, có kiểm tra trùng lịch và lặp lại tùy chọn.</p>
            <form action={createCalendarEventAction} className="mt-5 space-y-4">
              <input type="hidden" name="calendarId" value={calendarId ?? ""} />
              <Field id="title" label="Tên sự kiện" required><Input id="title" name="title" required maxLength={160} placeholder="Ví dụ: Họp tổ chuyên môn" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="startsAt" label="Bắt đầu" required><Input id="startsAt" name="startsAt" type="datetime-local" required /></Field>
                <Field id="endsAt" label="Kết thúc" required><Input id="endsAt" name="endsAt" type="datetime-local" required /></Field>
              </div>
              <Field id="location" label="Địa điểm"><Input id="location" name="location" placeholder="Phòng 203 hoặc trực tuyến" /></Field>
              <Field id="capacity" label="Sức chứa (0 = không giới hạn)"><Input id="capacity" name="capacity" type="number" min="0" max="10000" defaultValue="0" /></Field>
              <Field id="description" label="Mô tả"><Textarea id="description" name="description" rows={3} maxLength={1000} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="frequency" label="Lặp lại"><Select id="frequency" name="frequency" defaultValue=""><option value="">Không lặp</option><option value="WEEKLY">Mỗi tuần</option><option value="DAILY">Mỗi ngày</option><option value="MONTHLY">Mỗi tháng</option></Select></Field>
                <Field id="count" label="Số lần"><Input id="count" name="count" type="number" min="1" max="366" placeholder="Ví dụ: 6" /></Field>
              </div>
              <Button type="submit" className="w-full">Tạo sự kiện</Button>
            </form>
          </Card>
        ) : null}
      </div>

      <p className="text-xs leading-5 text-[var(--color-ink-400)]">Lịch riêng chỉ hiển thị với chủ sở hữu. Sự kiện đã hủy không xuất hiện trong iCalendar.</p>
    </div>
  );
}
