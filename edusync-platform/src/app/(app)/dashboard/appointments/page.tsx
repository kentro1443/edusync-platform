import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Select } from "@/components/ui/Field";
import { LinkButton } from "@/components/ui/Button";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { listMentoringAppointments } from "@/lib/mentoring/directory-service";
import {
  appointmentTone,
  formatMentoringDate,
  translateAppointmentStatus,
} from "@/lib/mentoring/ui";

function getRange(view: string | undefined) {
  const now = new Date();
  if (view === "day") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      to: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
    };
  }
  return {
    from: now,
    to: new Date(now.getTime() + 14 * 24 * 60 * 60_000),
  };
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string; result?: string }>;
}) {
  const [{ actor }, params] = await Promise.all([
    requireSchoolContext(permissions.mentorAppointmentRead),
    searchParams,
  ]);
  const range = getRange(params.view);
  const appointments = await listMentoringAppointments(actor, {
    ...range,
    status: params.status,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Lịch hẹn"
        title="Agenda ngày / tuần"
        description="Theo dõi yêu cầu, slot đã xác nhận, danh sách chờ và kết quả buổi gặp."
        actions={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/dashboard/mentoring/mentors" size="sm">
              Đặt lịch mới
            </LinkButton>
            <LinkButton href="/dashboard/mentoring/availability" variant="outline" size="sm">
              Lịch rảnh
            </LinkButton>
          </div>
        }
      />

      {params.result ? (
        <Alert tone="success" title="Đã cập nhật lịch hẹn">
          Dữ liệu agenda đã được làm mới sau thao tác của bạn.
        </Alert>
      ) : null}

      <Card>
        <form method="get" className="grid gap-4 md:grid-cols-[12rem_12rem_auto] md:items-end">
          <div>
            <label htmlFor="view" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-800)]">
              Phạm vi
            </label>
            <Select id="view" name="view" defaultValue={params.view ?? "week"}>
              <option value="week">14 ngày tới</option>
              <option value="day">Hôm nay</option>
            </Select>
          </div>
          <div>
            <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-800)]">
              Trạng thái
            </label>
            <Select id="status" name="status" defaultValue={params.status ?? ""}>
              <option value="">Tất cả</option>
              <option value="REQUESTED">Chờ duyệt</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="WAITLISTED">Danh sách chờ</option>
              <option value="COMPLETED">Đã hoàn tất</option>
              <option value="CANCELLED">Đã hủy</option>
            </Select>
          </div>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-ink-300)] bg-white px-5 text-sm font-semibold text-[var(--color-ink-800)] hover:bg-[var(--color-ink-50)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-500)]"
          >
            Lọc agenda
          </button>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-ink-100)] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Lịch hẹn trong phạm vi chọn</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-500)]">
              {appointments.length} lịch · hiển thị giờ Việt Nam
            </p>
          </div>
          <Badge tone="brand">{params.view === "day" ? "Hôm nay" : "14 ngày tới"}</Badge>
        </div>
        {appointments.length === 0 ? (
          <EmptyState
            title="Không có lịch hẹn phù hợp"
            description="Thử đổi bộ lọc hoặc mở danh bạ cố vấn để tạo yêu cầu mới."
            action={<LinkButton href="/dashboard/mentoring/mentors" size="sm">Tìm cố vấn</LinkButton>}
          />
        ) : (
          <ul className="divide-y divide-[var(--color-ink-100)]">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="py-5 first:pt-1 last:pb-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/dashboard/appointments/${appointment.id}`} className="text-base font-bold text-[var(--color-ink-900)] hover:text-[var(--color-brand-700)] hover:underline">
                      {appointment.appointmentType.name}
                    </Link>
                    <p className="mt-1 text-sm font-medium text-[var(--color-brand-800)]">
                      {formatMentoringDate(appointment.startsAt)} –{" "}
                      {formatMentoringDate(appointment.endsAt, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                      Học sinh: {appointment.student.displayName} · Cố vấn: {appointment.mentor.displayName}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={appointmentTone(appointment.status)}>
                      {translateAppointmentStatus(appointment.status)}
                    </Badge>
                    {appointment.waitlistEntry ? (
                      <Badge tone="warning">Vị trí {appointment.waitlistEntry.position}</Badge>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
