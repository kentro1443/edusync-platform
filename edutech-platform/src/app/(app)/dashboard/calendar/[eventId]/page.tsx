import { recordCalendarAttendanceAction } from "@/app/(app)/dashboard/calendar/actions";
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
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={event.calendar.name} title={event.title} description={dateTime.format(event.startsAt)} actions={<LinkButton href="/dashboard/calendar" variant="outline" size="sm">Quay lại lịch</LinkButton>} />
      {query.result ? <Alert tone="success" title="Đã lưu điểm danh">Trạng thái tham dự đã được cập nhật.</Alert> : null}
      {query.error ? <Alert tone="danger" title="Không thể điểm danh">Kiểm tra quyền và dữ liệu.</Alert> : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Người giữ chỗ</h2>
          {event.bookings.length === 0 ? <EmptyState title="Chưa có người đăng ký" description="Người dùng có thể giữ chỗ từ agenda." /> : <ul className="mt-4 divide-y divide-[var(--color-ink-100)]">{event.bookings.map((booking) => <li key={booking.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-semibold">{booking.user.displayName}</p><p className="text-xs text-[var(--color-ink-500)]">{booking.status === "WAITLISTED" ? `Danh sách chờ · vị trí ${booking.position ?? "—"}` : "Đã giữ chỗ"}</p></div><Badge tone={booking.status === "BOOKED" ? "success" : "warning"}>{booking.status}</Badge></li>)}</ul>}
        </Card>
        {canRecord ? <Card><h2 className="text-lg font-bold text-[var(--color-ink-900)]">Điểm danh</h2><form action={recordCalendarAttendanceAction} className="mt-4 space-y-4"><input type="hidden" name="eventId" value={event.id} /><Field id="userId" label="Người tham dự" required><Select id="userId" name="userId" required>{event.bookings.map((booking) => <option key={booking.user.id} value={booking.user.id}>{booking.user.displayName}</option>)}</Select></Field><Field id="status" label="Trạng thái" required><Select id="status" name="status" defaultValue="PRESENT"><option value="PRESENT">Có mặt</option><option value="ABSENT">Vắng</option><option value="EXCUSED">Có phép</option></Select></Field><Field id="note" label="Ghi chú"><Input id="note" name="note" maxLength={500} /></Field><Button type="submit" className="w-full">Lưu điểm danh</Button></form></Card> : null}
      </div>
    </div>
  );
}
