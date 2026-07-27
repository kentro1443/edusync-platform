import {
  cancelCalendarBookingAction,
  recordCalendarAttendanceAction,
  scheduleEventReminderAction,
  setRecurrenceExceptionAction,
} from "@/app/(app)/dashboard/calendar/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Field, Input, Select } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { getCalendarEvent } from "@/lib/calendar/calendar-service";

const dateTime = new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeStyle: "short" });
const inputDateTime = (value: Date) => {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

export default async function CalendarEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ result?: string; error?: string }>;
}) {
  const [{ eventId }, query] = await Promise.all([params, searchParams]);
  const { actor } = await requireSchoolContext(permissions.calendarEventRead);
  const event = await getCalendarEvent(actor, eventId);
  if (!event) return null;
  const canRecord = actor.schoolRoles.some((role) => ["SCHOOL_ADMIN", "TEACHER_STAFF", "MENTOR_COUNSELOR"].includes(role));
  const canEditRecurrence = actor.schoolRoles.some((role) => ["SCHOOL_ADMIN", "TEACHER_STAFF", "MENTOR_COUNSELOR", "CLUB_LEADER"].includes(role));
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={event.calendar.name} title={event.title} description={dateTime.format(event.startsAt)} actions={<LinkButton href="/dashboard/calendar" variant="outline" size="sm">Quay lại lịch</LinkButton>} />
      {query.result ? (
        <Alert tone="success" title="Đã lưu thay đổi">
          {query.result === "recurrence"
            ? "Ngoại lệ lịch lặp đã được cập nhật."
            : query.result === "cancelled"
              ? "Đã hủy giữ chỗ. Nếu có người đang chờ, họ đã được tự động chuyển vào và nhận thông báo."
              : query.result === "reminder"
                ? "Đã thêm nhắc việc cho sự kiện."
                : "Trạng thái tham dự đã được cập nhật."}
        </Alert>
      ) : null}
      {query.error ? <Alert tone="danger" title="Không thể cập nhật">Kiểm tra quyền và dữ liệu.</Alert> : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Người giữ chỗ</h2>
          {event.bookings.length === 0 ? <EmptyState title="Chưa có người đăng ký" description="Người dùng có thể giữ chỗ từ agenda." /> : <ul className="mt-4 divide-y divide-[var(--color-ink-100)]">{event.bookings.map((booking) => <li key={booking.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-semibold">{booking.user.displayName}</p><p className="text-xs text-[var(--color-ink-500)]">{booking.status === "WAITLISTED" ? `Danh sách chờ · vị trí ${booking.position ?? "—"}` : "Đã giữ chỗ"}</p></div><div className="flex items-center gap-2"><Badge tone={booking.status === "BOOKED" ? "success" : "warning"}>{booking.status}</Badge>{booking.user.id === actor.userId ? <form action={cancelCalendarBookingAction}><input type="hidden" name="eventId" value={event.id} /><Button type="submit" size="sm" variant="ghost">Hủy giữ chỗ</Button></form> : null}</div></li>)}</ul>}
        </Card>
        {canRecord ? <Card><h2 className="text-lg font-bold text-[var(--color-ink-900)]">Điểm danh</h2><form action={recordCalendarAttendanceAction} className="mt-4 space-y-4"><input type="hidden" name="eventId" value={event.id} /><Field id="userId" label="Người tham dự" required><Select id="userId" name="userId" required>{event.bookings.map((booking) => <option key={booking.user.id} value={booking.user.id}>{booking.user.displayName}</option>)}</Select></Field><Field id="status" label="Trạng thái" required><Select id="status" name="status" defaultValue="PRESENT"><option value="PRESENT">Có mặt</option><option value="ABSENT">Vắng</option><option value="EXCUSED">Có phép</option></Select></Field><Field id="note" label="Ghi chú"><Input id="note" name="note" maxLength={500} /></Field><Button type="submit" className="w-full">Lưu điểm danh</Button></form></Card> : null}
      </div>
      {canEditRecurrence ? (
        <Card className="max-w-md">
          <h2 className="text-base font-bold text-[var(--color-ink-900)]">Nhắc việc</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">Người đã giữ chỗ sẽ nhận thông báo trước giờ diễn ra.</p>
          {event.reminders.length ? (
            <ul className="mt-3 space-y-1.5">
              {event.reminders.map((reminder) => (
                <li key={reminder.id} className="flex items-center justify-between text-sm text-[var(--color-ink-700)]">
                  <span>Trước {reminder.minutesBefore} phút</span>
                  <Badge tone={reminder.sentAt ? "neutral" : "brand"}>{reminder.sentAt ? "Đã gửi" : "Đang chờ"}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
          <form action={scheduleEventReminderAction} className="mt-4 flex items-end gap-2">
            <input type="hidden" name="eventId" value={event.id} />
            <Field id="minutesBefore" label="Trước (phút)" className="flex-1">
              <Input id="minutesBefore" name="minutesBefore" type="number" min={5} max={10080} defaultValue={60} required />
            </Field>
            <Button type="submit" size="sm">Thêm</Button>
          </form>
        </Card>
      ) : null}
      {event.recurrenceRule && canEditRecurrence ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Card>
            <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Ngoại lệ lịch lặp</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-ink-500)]">Hủy một lần diễn ra hoặc chuyển riêng lần đó sang thời điểm khác, không ảnh hưởng cả chuỗi.</p>
            {event.exceptions.length ? <ul className="mt-4 divide-y divide-[var(--color-ink-100)]">{event.exceptions.map((exception) => <li key={exception.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{dateTime.format(exception.startsAt)}</p><p className="text-xs text-[var(--color-ink-500)]">{exception.cancelled ? "Đã hủy" : exception.movedTo ? `Chuyển đến ${dateTime.format(exception.movedTo)}` : "Giữ nguyên"}</p></div><Badge tone={exception.cancelled ? "danger" : "warning"}>{exception.cancelled ? "Hủy" : "Chuyển lịch"}</Badge></li>)}</ul> : <EmptyState title="Chưa có ngoại lệ" description="Các lần diễn ra đang theo đúng quy tắc lặp." />}
          </Card>
          <Card>
            <h2 className="text-base font-bold">Thêm ngoại lệ</h2>
            <form action={setRecurrenceExceptionAction} className="mt-4 space-y-4">
              <input type="hidden" name="eventId" value={event.id} />
              <Field id="startsAt" label="Lần diễn ra gốc" required><Input id="startsAt" name="startsAt" type="datetime-local" required defaultValue={inputDateTime(event.startsAt)} /></Field>
              <Field id="mode" label="Xử lý"><Select id="mode" name="mode" defaultValue="cancel"><option value="cancel">Hủy lần này</option><option value="move">Chuyển lịch</option></Select></Field>
              <Field id="movedTo" label="Chuyển đến (khi chọn chuyển lịch)"><Input id="movedTo" name="movedTo" type="datetime-local" /></Field>
              <Button type="submit" className="w-full">Lưu ngoại lệ</Button>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
