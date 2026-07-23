import { notFound } from "next/navigation";

import {
  caseStatusAction,
  goalAction,
  noteAction,
  outcomeAction,
  referralAction,
  taskAction,
} from "@/app/(app)/dashboard/mentoring/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { listMentoringAppointments } from "@/lib/mentoring/directory-service";
import { CaseAuthorizationError, getMentoringCase } from "@/lib/mentoring/case-service";
import { formatMentoringDate, translateCaseStatus } from "@/lib/mentoring/ui";

export default async function MentoringCaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ result?: string; error?: string }>;
}) {
  const [{ caseId }, query] = await Promise.all([params, searchParams]);
  const { actor } = await requireSchoolContext(permissions.mentorAppointmentRead);
  if (!actor.schoolId) notFound();
  const schoolId = actor.schoolId;
  let mentoringCase;
  try {
    mentoringCase = await getMentoringCase(actor, caseId);
  } catch (error) {
    if (error instanceof CaseAuthorizationError) notFound();
    throw error;
  }
  const [appointments, activity, files] = await Promise.all([
    listMentoringAppointments(actor),
    db.auditEvent.findMany({
      where: { schoolId, entityType: "MentoringCase", entityId: caseId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, action: true, actor: { select: { displayName: true } }, createdAt: true, afterJson: true },
    }),
    db.fileLink.findMany({
      where: { schoolId, entityType: "MentoringCase", entityId: caseId },
      orderBy: { createdAt: "desc" },
      select: { id: true, visibility: true, createdAt: true, file: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true } } },
    }),
  ]);
  const caseAppointments = appointments.filter(
    (appointment) =>
      appointment.student.id === mentoringCase.student.id &&
      ["CONFIRMED", "COMPLETED"].includes(appointment.status),
  );
  const canWrite =
    actor.schoolRoles.includes("MENTOR_COUNSELOR") ||
    actor.schoolRoles.includes("TEACHER_STAFF") ||
    actor.schoolRoles.includes("SCHOOL_ADMIN");
  const isMentor = actor.schoolRoles.includes("MENTOR_COUNSELOR");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Hồ sơ · ${mentoringCase.priority}`}
        title={mentoringCase.title}
        description={`${mentoringCase.student.displayName} · Cố vấn ${mentoringCase.primaryMentor.user.displayName}`}
        actions={<LinkButton href="/dashboard/mentoring/cases" variant="outline" size="sm">Danh sách hồ sơ</LinkButton>}
      />

      {query.result ? <Alert tone="success" title="Đã lưu thay đổi hồ sơ" /> : null}
      {query.error ? <Alert tone="danger" title="Không thể lưu thay đổi" /> : null}

      <nav aria-label="Các phần hồ sơ" className="sticky top-0 z-10 -mx-2 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-ink-200)] bg-[var(--color-surface)]/95 px-2 py-2 backdrop-blur">
        <div className="flex min-w-max gap-1">
          {[
            ["overview", "Tổng quan"],
            ["goals", "Mục tiêu"],
            ["sessions", "Buổi gặp"],
            ["tasks", "Công việc"],
            ["files", "Tệp"],
            ["activity", "Hoạt động"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-[var(--color-ink-600)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-800)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-500)]">
              {label}
            </a>
          ))}
        </div>
      </nav>

      <section id="overview" aria-labelledby="overview-heading" className="scroll-mt-20">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="overview-heading" className="text-lg font-bold text-[var(--color-ink-900)]">Tổng quan</h2>
              <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-[var(--color-ink-600)]">
                {mentoringCase.summary || "Chưa có tóm tắt. Hãy bổ sung bối cảnh để cả nhóm cùng nhìn một hướng."}
              </p>
            </div>
            <Badge tone={mentoringCase.status === "OPEN" ? "success" : mentoringCase.status === "ON_HOLD" ? "warning" : "neutral"}>
              {translateCaseStatus(mentoringCase.status)}
            </Badge>
          </div>
          {canWrite && mentoringCase.status !== "CLOSED" ? (
            <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--color-ink-100)] pt-5">
              {mentoringCase.status === "OPEN" ? (
                <form action={caseStatusAction}><input type="hidden" name="caseId" value={caseId} /><input type="hidden" name="status" value="ON_HOLD" /><Button type="submit" variant="outline" size="sm">Tạm giữ</Button></form>
              ) : (
                <form action={caseStatusAction}><input type="hidden" name="caseId" value={caseId} /><input type="hidden" name="status" value="OPEN" /><Button type="submit" variant="outline" size="sm">Mở lại</Button></form>
              )}
              <form action={caseStatusAction}><input type="hidden" name="caseId" value={caseId} /><input type="hidden" name="status" value="CLOSED" /><Button type="submit" variant="danger" size="sm">Đóng hồ sơ</Button></form>
            </div>
          ) : null}
        </Card>
      </section>

      <section id="goals" aria-labelledby="goals-heading" className="scroll-mt-20">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="goals-heading" className="text-lg font-bold text-[var(--color-ink-900)]">Mục tiêu</h2>
              <p className="mt-1 text-sm text-[var(--color-ink-500)]">Mỗi mục tiêu có tiến độ nhìn thấy được và có thể cập nhật theo buổi gặp.</p>
            </div>
            <Badge tone="brand">{mentoringCase.goals.length} mục tiêu</Badge>
          </div>
          {mentoringCase.goals.length === 0 ? <EmptyState title="Chưa có mục tiêu" description="Bắt đầu bằng một thay đổi cụ thể, đo được." /> : (
            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {mentoringCase.goals.map((goal) => (
                <li key={goal.id} className="rounded-[var(--radius-md)] border border-[var(--color-ink-200)] p-4">
                  <div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-[var(--color-ink-900)]">{goal.title}</h3><Badge tone={goal.status === "ACHIEVED" ? "success" : "brand"}>{goal.progressPercent}%</Badge></div>
                  {goal.description ? <p className="mt-2 text-sm leading-6 text-[var(--color-ink-500)]">{goal.description}</p> : null}
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-ink-100)]"><div className="h-full rounded-full bg-[var(--color-brand-600)]" style={{ width: `${goal.progressPercent}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
          {canWrite ? (
            <form action={goalAction} className="mt-6 grid gap-4 border-t border-[var(--color-ink-100)] pt-6 md:grid-cols-2">
              <input type="hidden" name="caseId" value={caseId} />
              <Field id="goalTitle" label="Tên mục tiêu" required><Input id="goalTitle" name="title" minLength={3} maxLength={180} required /></Field>
              <Field id="progressPercent" label="Tiến độ (%)"><Input id="progressPercent" name="progressPercent" type="number" min={0} max={100} defaultValue={0} /></Field>
              <Field id="goalDescription" label="Mô tả" className="md:col-span-2"><Textarea id="goalDescription" name="description" maxLength={1000} /></Field>
              <div><Button type="submit" size="sm">Thêm mục tiêu</Button></div>
            </form>
          ) : null}
        </Card>
      </section>

      <section id="sessions" aria-labelledby="sessions-heading" className="scroll-mt-20">
        <Card>
          <div className="flex items-center justify-between gap-3"><div><h2 id="sessions-heading" className="text-lg font-bold text-[var(--color-ink-900)]">Buổi gặp & kết quả</h2><p className="mt-1 text-sm text-[var(--color-ink-500)]">Kết quả là bản tóm tắt bền vững; ghi chú riêng tư nằm ở phần quyền riêng tư bên dưới.</p></div><Badge tone="brand">{mentoringCase.sessionOutcomes.length} kết quả</Badge></div>
          {mentoringCase.sessionOutcomes.length === 0 ? <EmptyState title="Chưa ghi kết quả buổi gặp" description="Sau mỗi buổi, ghi lại tiến bộ và bước tiếp theo để không mất nhịp." /> : (
            <ul className="mt-5 space-y-3">{mentoringCase.sessionOutcomes.map((outcome) => <li key={outcome.id} className="rounded-[var(--radius-md)] bg-[var(--color-ink-50)] p-4"><p className="text-xs text-[var(--color-ink-400)]">{formatMentoringDate(outcome.completedAt)} · {outcome.completedBy.displayName}</p><p className="mt-2 text-sm font-semibold text-[var(--color-ink-900)]">{outcome.summary}</p>{outcome.nextSteps ? <p className="mt-1 text-sm text-[var(--color-ink-600)]">Bước tiếp: {outcome.nextSteps}</p> : null}</li>)}</ul>
          )}
          {isMentor && caseAppointments.length > 0 ? (
            <form action={outcomeAction} className="mt-6 grid gap-4 border-t border-[var(--color-ink-100)] pt-6 md:grid-cols-2">
              <input type="hidden" name="caseId" value={caseId} />
              <Field id="outcomeAppointmentId" label="Buổi gặp" required><Select id="outcomeAppointmentId" name="appointmentId" required>{caseAppointments.map((appointment) => <option key={appointment.id} value={appointment.id}>{formatMentoringDate(appointment.startsAt)} · {appointment.appointmentType.name}</option>)}</Select></Field>
              <Field id="outcomeSummary" label="Tóm tắt" required><Input id="outcomeSummary" name="summary" minLength={3} maxLength={2000} required /></Field>
              <Field id="outcomeProgress" label="Tiến bộ"><Textarea id="outcomeProgress" name="progress" maxLength={1000} /></Field>
              <Field id="outcomeNextSteps" label="Bước tiếp theo"><Textarea id="outcomeNextSteps" name="nextSteps" maxLength={1000} /></Field>
              <div><Button type="submit" size="sm">Lưu kết quả</Button></div>
            </form>
          ) : null}
        </Card>
      </section>

      <section id="tasks" aria-labelledby="tasks-heading" className="scroll-mt-20">
        <Card>
          <div className="flex items-center justify-between gap-3"><div><h2 id="tasks-heading" className="text-lg font-bold text-[var(--color-ink-900)]">Công việc</h2><p className="mt-1 text-sm text-[var(--color-ink-500)]">Việc nhỏ, rõ người nhận và rõ thời điểm.</p></div><Badge tone="brand">{mentoringCase.tasks.length} việc</Badge></div>
          {mentoringCase.tasks.length === 0 ? <EmptyState title="Chưa có công việc" description="Thêm một hành động cụ thể để mục tiêu tiến lên." /> : <ul className="mt-5 divide-y divide-[var(--color-ink-100)]">{mentoringCase.tasks.map((task) => <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold text-[var(--color-ink-900)]">{task.title}</p><p className="mt-1 text-xs text-[var(--color-ink-500)]">{task.assignee.displayName}{task.dueAt ? ` · hạn ${formatMentoringDate(task.dueAt, { day: "2-digit", month: "2-digit" })}` : ""}</p></div><Badge tone={task.status === "DONE" ? "success" : "neutral"}>{task.status === "DONE" ? "Hoàn tất" : task.status === "IN_PROGRESS" ? "Đang làm" : "Chưa làm"}</Badge></li>)}</ul>}
          {canWrite ? <form action={taskAction} className="mt-6 grid gap-4 border-t border-[var(--color-ink-100)] pt-6 md:grid-cols-2"><input type="hidden" name="caseId" value={caseId} /><Field id="taskTitle" label="Tên việc" required><Input id="taskTitle" name="title" minLength={3} maxLength={180} required /></Field><Field id="assigneeUserId" label="Người nhận" required><Select id="assigneeUserId" name="assigneeUserId" defaultValue={mentoringCase.student.id} required><option value={mentoringCase.student.id}>{mentoringCase.student.displayName}</option><option value={mentoringCase.primaryMentor.user.id}>{mentoringCase.primaryMentor.user.displayName}</option></Select></Field><Field id="taskDescription" label="Mô tả" className="md:col-span-2"><Textarea id="taskDescription" name="description" maxLength={1000} /></Field><div><Button type="submit" size="sm">Thêm việc</Button></div></form> : null}
        </Card>
      </section>

      <section id="files" aria-labelledby="files-heading" className="scroll-mt-20">
        <Card>
          <div className="flex items-center justify-between gap-3"><div><h2 id="files-heading" className="text-lg font-bold text-[var(--color-ink-900)]">Tệp liên quan</h2><p className="mt-1 text-sm text-[var(--color-ink-500)]">Tệp chỉ xuất hiện khi đã được liên kết và kiểm tra quyền ở server.</p></div><Badge tone="neutral">{files.length} tệp</Badge></div>
          {files.length === 0 ? <EmptyState title="Chưa có tệp" description="Tệp sẽ xuất hiện khi được liên kết từ mô-đun tài nguyên." /> : <ul className="mt-5 space-y-2">{files.map((file) => <li key={file.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-ink-50)] px-3.5 py-3 text-sm"><span className="font-medium text-[var(--color-ink-800)]">{file.file.originalName}</span><span className="text-xs text-[var(--color-ink-500)]">{file.file.mimeType} · {file.visibility}</span></li>)}</ul>}
        </Card>
      </section>

      <section id="activity" aria-labelledby="activity-heading" className="scroll-mt-20">
        <Card>
          <div className="flex items-center justify-between gap-3"><div><h2 id="activity-heading" className="text-lg font-bold text-[var(--color-ink-900)]">Hoạt động</h2><p className="mt-1 text-sm text-[var(--color-ink-500)]">Nhật ký append-only của hồ sơ và các mutation liên quan.</p></div><Badge tone="neutral">{activity.length} sự kiện</Badge></div>
          {activity.length === 0 ? <EmptyState title="Chưa có hoạt động" description="Mọi thay đổi tiếp theo sẽ xuất hiện ở đây." /> : <ol className="mt-5 space-y-4 border-l-2 border-[var(--color-brand-100)] pl-5">{activity.map((event) => <li key={event.id} className="relative"><span aria-hidden="true" className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 border-[var(--color-brand-600)] bg-white" /><p className="text-xs text-[var(--color-ink-400)]">{formatMentoringDate(event.createdAt)} · {event.actor?.displayName ?? "Hệ thống"}</p><p className="mt-1 text-sm font-semibold text-[var(--color-ink-800)]">{event.action}</p></li>)}</ol>}
        </Card>
      </section>

      <section aria-labelledby="notes-heading" className="scroll-mt-20">
        <Card className="border-[var(--color-warning-200)]">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="notes-heading" className="text-lg font-bold text-[var(--color-ink-900)]">Ghi chú & quyền riêng tư</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-ink-500)]">Nội dung được mã hóa khi lưu. Projection hiện tại chỉ trả những ghi chú actor được phép đọc.</p></div><Badge tone="warning">Không xuất mặc định</Badge></div>
          {mentoringCase.notes.length === 0 ? <EmptyState title="Không có ghi chú hiển thị" description="Có thể ghi chú tồn tại nhưng không thuộc quyền xem của actor hiện tại." /> : <ul className="mt-5 space-y-3">{mentoringCase.notes.map((note) => <li key={note.id} className="rounded-[var(--radius-md)] bg-[var(--color-ink-50)] p-4"><div className="flex items-center justify-between gap-3"><Badge tone={note.visibility === "PRIVATE_COUNSELOR" ? "warning" : "brand"}>{note.visibility === "PRIVATE_COUNSELOR" ? "Riêng tư cố vấn" : note.visibility === "STUDENT_VISIBLE" ? "Học sinh thấy" : note.visibility === "GUARDIAN_VISIBLE" ? "Phụ huynh thấy" : "Nhân sự thấy"}</Badge><span className="text-xs text-[var(--color-ink-400)]">{formatMentoringDate(note.createdAt)}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-ink-700)]">{note.body}</p></li>)}</ul>}
          {isMentor ? <form action={noteAction} className="mt-6 grid gap-4 border-t border-[var(--color-ink-100)] pt-6 md:grid-cols-2"><input type="hidden" name="caseId" value={caseId} /><Field id="noteVisibility" label="Mức hiển thị" required><Select id="noteVisibility" name="visibility" defaultValue="PRIVATE_COUNSELOR" required><option value="PRIVATE_COUNSELOR">Riêng tư cố vấn</option><option value="STUDENT_VISIBLE">Học sinh thấy</option><option value="GUARDIAN_VISIBLE">Phụ huynh thấy</option><option value="STAFF_VISIBLE">Nhân sự thấy</option></Select></Field><Field id="noteAppointmentId" label="Gắn với buổi gặp (tùy chọn)"><Select id="noteAppointmentId" name="appointmentId"><option value="">Không gắn</option>{caseAppointments.map((appointment) => <option key={appointment.id} value={appointment.id}>{formatMentoringDate(appointment.startsAt)} · {appointment.appointmentType.name}</option>)}</Select></Field><Field id="noteBody" label="Nội dung" required className="md:col-span-2"><Textarea id="noteBody" name="body" minLength={2} maxLength={10000} required /></Field><div><Button type="submit" size="sm">Lưu ghi chú mã hóa</Button></div></form> : null}
        </Card>
      </section>

      {isMentor ? <Card><h2 className="text-lg font-bold text-[var(--color-ink-900)]">Giới thiệu nguồn lực</h2><p className="mt-1 text-sm text-[var(--color-ink-500)]">Chuyển tiếp có lý do, trạng thái và nhật ký.</p><form action={referralAction} className="mt-5 grid gap-4 md:grid-cols-2"><input type="hidden" name="caseId" value={caseId} /><Field id="destination" label="Nơi tiếp nhận" required><Input id="destination" name="destination" maxLength={180} required /></Field><Field id="referralReason" label="Lý do" required><Input id="referralReason" name="reason" maxLength={1000} required /></Field><div><Button type="submit" variant="outline" size="sm">Tạo referral</Button></div></form></Card> : null}
    </div>
  );
}
