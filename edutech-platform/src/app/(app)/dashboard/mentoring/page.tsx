import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { LinkButton } from "@/components/ui/Button";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import {
  appointmentTone,
  formatMentoringDate,
  translateAppointmentStatus,
} from "@/lib/mentoring/ui";
import { getMentoringDashboard } from "@/lib/mentoring/directory-service";

export default async function MentoringDashboardPage() {
  const { actor } = await requireSchoolContext(permissions.mentorDirectoryRead);
  const dashboard = await getMentoringDashboard(actor);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Cố vấn & tư vấn"
        title="Không gian đồng hành"
        description="Tập trung lịch hẹn, hồ sơ tư vấn và những việc cần theo dõi trong cùng một nhịp làm việc."
        actions={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/dashboard/mentoring/mentors" size="sm">
              Tìm cố vấn
            </LinkButton>
            <LinkButton href="/dashboard/mentoring/cases" variant="outline" size="sm">
              Mở hồ sơ
            </LinkButton>
          </div>
        }
      />

      <section aria-labelledby="mentoring-summary-heading">
        <h2 id="mentoring-summary-heading" className="sr-only">
          Tóm tắt mô-đun cố vấn
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Lịch 14 ngày tới", dashboard.appointments.length, "/dashboard/appointments"],
            ["Yêu cầu chờ duyệt", dashboard.pendingRequests, "/dashboard/appointments?status=REQUESTED"],
            ["Hồ sơ đang theo dõi", dashboard.openCases, "/dashboard/mentoring/cases"],
            ["Việc cần làm", dashboard.openTasks, "/dashboard/mentoring/cases"],
          ].map(([label, value, href]) => (
            <Link key={label} href={href as string} className="group">
              <Card className="h-full transition-transform group-hover:-translate-y-0.5 group-focus-visible:ring-4 group-focus-visible:ring-[var(--color-brand-100)]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-400)]">
                  {label}
                </p>
                <p className="mt-3 text-3xl font-bold text-[var(--color-brand-800)]">
                  {value}
                </p>
                <p className="mt-2 text-sm text-[var(--color-ink-500)]">
                  Xem chi tiết
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-ink-900)]">
                Agenda sắp tới
              </h2>
              <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                Các buổi hẹn trong 14 ngày tới, sắp theo thời gian bắt đầu.
              </p>
            </div>
            <Link
              href="/dashboard/appointments?view=week"
              className="text-sm font-semibold text-[var(--color-brand-700)] hover:underline"
            >
              Xem lịch tuần
            </Link>
          </div>
          {dashboard.appointments.length === 0 ? (
            <EmptyState
              title="Chưa có lịch hẹn sắp tới"
              description="Tìm một cố vấn phù hợp hoặc mở hồ sơ để bắt đầu đồng hành."
              action={<LinkButton href="/dashboard/mentoring/mentors" size="sm">Tìm cố vấn</LinkButton>}
            />
          ) : (
            <ul className="mt-6 divide-y divide-[var(--color-ink-100)]">
              {dashboard.appointments.slice(0, 8).map((appointment) => (
                <li key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/appointments/${appointment.id}`}
                      className="font-semibold text-[var(--color-ink-900)] hover:text-[var(--color-brand-700)] hover:underline"
                    >
                      {appointment.appointmentType.name}
                    </Link>
                    <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                      {formatMentoringDate(appointment.startsAt)} · {appointment.mentor.displayName}
                    </p>
                  </div>
                  <Badge tone={appointmentTone(appointment.status)}>
                    {translateAppointmentStatus(appointment.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">
            Quyền riêng tư
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-ink-500)]">
            Mỗi ghi chú có nhãn hiển thị riêng. Học sinh và phụ huynh chỉ thấy
            nội dung đúng mối quan hệ và chính sách nhà trường.
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-warning-200)] bg-[var(--color-warning-50)] p-3 text-sm text-[var(--color-warning-900)]">
              <span className="font-semibold">Riêng tư cố vấn:</span> chỉ tác giả.
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-3 text-sm text-[var(--color-brand-900)]">
              <span className="font-semibold">Hiển thị có điều kiện:</span>{" "}
              học sinh, phụ huynh hoặc nhân sự được chỉ định.
            </div>
          </div>
          <Link
            href="/help#privacy"
            className="mt-5 inline-flex text-sm font-semibold text-[var(--color-brand-700)] hover:underline"
          >
            Đọc giải thích quyền
          </Link>
        </Card>
      </div>
    </div>
  );
}
