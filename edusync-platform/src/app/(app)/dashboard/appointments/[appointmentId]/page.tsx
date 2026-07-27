import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Button, LinkButton } from "@/components/ui/Button";
import {
  attendanceAction,
  transitionAppointmentAction,
} from "@/app/(app)/dashboard/mentoring/actions";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { getMentoringAppointment } from "@/lib/mentoring/directory-service";
import {
  appointmentTone,
  formatMentoringDate,
  translateAppointmentStatus,
} from "@/lib/mentoring/ui";

function canApprove(roleNames: readonly string[], mentorUserId: string, actorUserId: string) {
  return (
    actorUserId === mentorUserId ||
    roleNames.some((role) => ["SCHOOL_ADMIN", "TEACHER_STAFF", "APPROVER_REVIEWER"].includes(role))
  );
}

export default async function AppointmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ appointmentId: string }>;
  searchParams: Promise<{ result?: string; error?: string }>;
}) {
  const [{ appointmentId }, query] = await Promise.all([params, searchParams]);
  const { actor } = await requireSchoolContext(permissions.mentorAppointmentRead);
  const appointment = await getMentoringAppointment(actor, appointmentId);
  if (!appointment) notFound();

  const isOwner =
    appointment.student.id === actor.userId ||
    appointment.mentor.id === actor.userId ||
    appointment.organizerUserId === actor.userId;
  const canApproveAppointment = canApprove(
    actor.schoolRoles,
    appointment.mentor.id,
    actor.userId,
  );
  const canRecordAttendance =
    actor.schoolRoles.includes("MENTOR_COUNSELOR") ||
    actor.schoolRoles.includes("TEACHER_STAFF");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Chi tiết lịch hẹn"
        title={appointment.appointmentType.name}
        description={`${appointment.student.displayName} · ${appointment.mentor.displayName}`}
        actions={<LinkButton href="/dashboard/appointments" variant="outline" size="sm">Quay lại agenda</LinkButton>}
      />

      {query.result ? (
        <Alert tone="success" title="Đã cập nhật lịch hẹn">
          Trạng thái và lịch sử thao tác đã được lưu.
        </Alert>
      ) : null}
      {query.error === "conflict" ? (
        <Alert tone="warning" title="Không thể cập nhật vì bị trùng lịch">
          Khung giờ mới đã có lịch khác. Chọn một giờ khác.
        </Alert>
      ) : query.error === "invalid" ? (
        <Alert tone="danger" title="Thao tác chưa hợp lệ">
          Kiểm tra quyền, trạng thái hoặc dữ liệu gửi lên.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink-500)]">
                {formatMentoringDate(appointment.startsAt)} –{" "}
                {formatMentoringDate(appointment.endsAt, { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="mt-2 text-sm text-[var(--color-ink-500)]">
                Múi giờ {appointment.timezone} · thời lượng {appointment.appointmentType.durationMinutes} phút
              </p>
            </div>
            <Badge tone={appointmentTone(appointment.status)}>
              {translateAppointmentStatus(appointment.status)}
            </Badge>
          </div>
          <dl className="mt-8 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-400)]">Học sinh</dt>
              <dd className="mt-1 font-semibold text-[var(--color-ink-900)]">{appointment.student.displayName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-400)]">Cố vấn</dt>
              <dd className="mt-1 font-semibold text-[var(--color-ink-900)]">{appointment.mentor.displayName}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-400)]">Điều muốn trao đổi</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--color-ink-600)]">
                {appointment.studentMessage || "Chưa có mô tả thêm."}
              </dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-2">
            {appointment.status === "REQUESTED" && canApproveAppointment ? (
              <>
                <form action={transitionAppointmentAction}>
                  <input type="hidden" name="appointmentId" value={appointment.id} />
                  <input type="hidden" name="action" value="APPROVE" />
                  <Button type="submit">Duyệt lịch</Button>
                </form>
                <form action={transitionAppointmentAction}>
                  <input type="hidden" name="appointmentId" value={appointment.id} />
                  <input type="hidden" name="action" value="DECLINE" />
                  <Button type="submit" variant="outline">Từ chối</Button>
                </form>
              </>
            ) : null}
            {isOwner && ["REQUESTED", "CONFIRMED", "WAITLISTED"].includes(appointment.status) ? (
              <form action={transitionAppointmentAction}>
                <input type="hidden" name="appointmentId" value={appointment.id} />
                <input type="hidden" name="action" value="CANCEL" />
                <Button type="submit" variant="danger">Hủy lịch</Button>
              </form>
            ) : null}
            {appointment.status === "CONFIRMED" && canApproveAppointment ? (
              <form action={transitionAppointmentAction}>
                <input type="hidden" name="appointmentId" value={appointment.id} />
                <input type="hidden" name="action" value="COMPLETE" />
                <Button type="submit" variant="secondary">Đánh dấu hoàn tất</Button>
              </form>
            ) : null}
          </div>
        </Card>

        <div className="space-y-6">
          {isOwner && ["REQUESTED", "CONFIRMED"].includes(appointment.status) ? (
            <Card>
              <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Đổi lịch</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-ink-500)]">
                Hệ thống kiểm tra lại slot và từ chối nếu bị trùng.
              </p>
              <form action={transitionAppointmentAction} className="mt-5 space-y-4">
                <input type="hidden" name="appointmentId" value={appointment.id} />
                <input type="hidden" name="action" value="RESCHEDULE" />
                <Field id="startsAt" label="Bắt đầu mới" required>
                  <Input
                    id="startsAt"
                    name="startsAt"
                    type="datetime-local"
                    defaultValue={appointment.startsAt.toISOString().slice(0, 16)}
                    required
                  />
                </Field>
                <Field id="rescheduleReason" label="Lý do">
                  <Textarea id="rescheduleReason" name="reason" maxLength={1000} />
                </Field>
                <Button type="submit" variant="outline">Gửi yêu cầu đổi lịch</Button>
              </form>
            </Card>
          ) : null}

          {canRecordAttendance && appointment.status === "CONFIRMED" ? (
            <Card>
              <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Điểm danh</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-ink-500)]">
                Ghi nhận từng người tham dự; thay đổi được lưu vào activity.
              </p>
              <form action={attendanceAction} className="mt-5 space-y-4">
                <input type="hidden" name="appointmentId" value={appointment.id} />
                <Field id="attendanceUserId" label="Người tham dự" required>
                  <Select id="attendanceUserId" name="userId" required>
                    <option value={appointment.student.id}>{appointment.student.displayName}</option>
                    <option value={appointment.mentor.id}>{appointment.mentor.displayName}</option>
                  </Select>
                </Field>
                <Field id="attendanceStatus" label="Trạng thái" required>
                  <Select id="attendanceStatus" name="status" defaultValue="PRESENT" required>
                    <option value="PRESENT">Có mặt</option>
                    <option value="ABSENT">Vắng</option>
                    <option value="EXCUSED">Có phép</option>
                  </Select>
                </Field>
                <Field id="attendanceNote" label="Ghi chú">
                  <Input id="attendanceNote" name="note" maxLength={500} />
                </Field>
                <Button type="submit" size="sm">Lưu điểm danh</Button>
              </form>
            </Card>
          ) : null}

          <Card className="border-[var(--color-warning-200)] bg-[var(--color-warning-50)]">
            <h2 className="text-base font-bold text-[var(--color-warning-900)]">Giải thích quyền</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-warning-900)]">
              Chỉ cố vấn, học sinh liên quan, phụ huynh đã liên kết hoặc nhân sự được cấp quyền mới thấy chi tiết. Thay đổi trạng thái đều có history.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
