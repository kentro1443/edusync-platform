import {
  addClubExpenseAction,
  applyToClubAction,
  approveClubEventAction,
  createClubAnnouncementAction,
  createClubBudgetAction,
  createClubEventAction,
  createClubTaskAction,
  reviewClubApplicationAction,
  registerClubEventAction,
  saveClubSafetyPlanAction,
  setClubMemberRoleAction,
  submitClubReportAction,
  updateClubTaskStatusAction,
} from "@/app/(app)/dashboard/clubs-events/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Field, Input, Textarea, Select } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { getClub } from "@/lib/clubs/club-service";
import { formatVnd } from "@/lib/marketplace/ui";

const dateTime = new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });
const taskTone: Record<string, "neutral" | "warning" | "success"> = {
  TODO: "neutral",
  IN_PROGRESS: "warning",
  DONE: "success",
  CANCELLED: "neutral",
};

export default async function ClubDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubId: string }>;
  searchParams: Promise<{ result?: string; error?: string }>;
}) {
  const [{ clubId }, query] = await Promise.all([params, searchParams]);
  const { actor } = await requireSchoolContext(permissions.clubRead);
  const club = await getClub(actor, clubId);
  const canReview = club.canManage;
  const canCreateEvent = club.canManage;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Câu lạc bộ" title={club.name} description={club.description ?? "Không có mô tả."} actions={<LinkButton href="/dashboard/clubs-events" variant="outline" size="sm">Quay lại danh sách</LinkButton>} />
      {query.result ? <Alert tone="success" title="Đã cập nhật">Thay đổi đã được lưu.</Alert> : null}
      {query.error ? <Alert tone="danger" title="Không thể cập nhật">Kiểm tra dữ liệu hoặc quyền truy cập.</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Thành viên</h2>
            <Badge tone="brand">{club.memberships.length} đang hoạt động</Badge>
          </div>
          {club.memberships.length === 0 ? <EmptyState title="Chưa có thành viên" description="Đơn được duyệt sẽ xuất hiện ở đây." /> : <ul className="mt-4 divide-y divide-[var(--color-ink-100)]">{club.memberships.map((membership) => <li key={membership.id} className="flex items-center justify-between gap-3 py-3"><p className="font-semibold">{membership.user.displayName}</p><div className="flex items-center gap-2"><Badge tone={membership.role === "LEADER" ? "warning" : "neutral"}>{membership.role}</Badge>{club.canManage && membership.user.id !== actor.userId ? <form action={setClubMemberRoleAction}><input type="hidden" name="clubId" value={club.id} /><input type="hidden" name="userId" value={membership.user.id} /><input type="hidden" name="role" value={membership.role === "LEADER" ? "MEMBER" : "LEADER"} /><Button size="sm" variant="ghost" type="submit">{membership.role === "LEADER" ? "Hạ vai trò" : "Đặt làm trưởng"}</Button></form> : null}</div></li>)}</ul>}
        </Card>
        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Đơn tham gia chờ duyệt</h2>
          {club.applications.length === 0 ? <EmptyState title="Không có đơn chờ" description="Đơn mới sẽ được đưa vào hàng đợi." /> : <ul className="mt-4 space-y-3">{club.applications.map((application) => <li key={application.id} className="rounded-[var(--radius-md)] border border-[var(--color-ink-100)] p-3"><p className="font-semibold">{application.applicant.displayName}</p><p className="mt-1 text-xs text-[var(--color-ink-500)]">{application.motivation || "Không có lời nhắn."}</p>{canReview ? <div className="mt-3 flex gap-2"><form action={reviewClubApplicationAction}><input type="hidden" name="clubId" value={club.id} /><input type="hidden" name="applicationId" value={application.id} /><input type="hidden" name="decision" value="approve" /><Button size="sm" type="submit">Duyệt</Button></form><form action={reviewClubApplicationAction}><input type="hidden" name="clubId" value={club.id} /><input type="hidden" name="applicationId" value={application.id} /><input type="hidden" name="decision" value="reject" /><Button size="sm" type="submit" variant="outline">Từ chối</Button></form></div> : <Badge tone="warning" className="mt-3">Đơn đang chờ duyệt</Badge>}</li>)}</ul>}
          {club.canApply ? <form action={applyToClubAction} className="mt-5 border-t border-[var(--color-ink-100)] pt-5"><input type="hidden" name="clubId" value={club.id} /><Field id="motivation" label="Lời nhắn đăng ký"><Textarea id="motivation" name="motivation" rows={2} maxLength={500} placeholder="Bạn muốn đóng góp gì cho CLB?" /></Field><Button type="submit" variant="outline" className="mt-3">Gửi đơn tham gia</Button></form> : null}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Sự kiện</h2>
          {club.events.length === 0 ? <EmptyState title="Chưa có sự kiện" description="Tạo đề xuất đầu tiên để bắt đầu." /> : <ul className="mt-4 divide-y divide-[var(--color-ink-100)]">{club.events.map((event) => <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{event.title}</p><p className="mt-1 text-xs text-[var(--color-ink-500)]">{dateTime.format(event.startsAt)} · {event._count.registrations} đăng ký{event.capacity ? ` / ${event.capacity}` : ""}</p></div><div className="flex items-center gap-2"><Badge tone={event.status === "APPROVED" ? "success" : "warning"}>{event.status === "APPROVED" ? "Đã duyệt" : "Chờ duyệt"}</Badge>{event.status === "APPROVED" && club.canRegisterEvents ? <form action={registerClubEventAction}><input type="hidden" name="clubId" value={club.id} /><input type="hidden" name="eventId" value={event.id} /><Button size="sm" variant="outline" type="submit">Đăng ký</Button></form> : event.status === "PENDING_APPROVAL" && club.canApproveEvents ? <form action={approveClubEventAction}><input type="hidden" name="clubId" value={club.id} /><input type="hidden" name="eventId" value={event.id} /><input type="hidden" name="decision" value="approve" /><Button size="sm" type="submit">Duyệt</Button></form> : null}</div></li>)}</ul>}
        </Card>
        {canCreateEvent ? <Card><h2 className="text-lg font-bold text-[var(--color-ink-900)]">Tạo đề xuất sự kiện</h2><form action={createClubEventAction} className="mt-4 space-y-4"><input type="hidden" name="clubId" value={club.id} /><Field id="title" label="Tên sự kiện" required><Input id="title" name="title" required maxLength={160} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field id="startsAt" label="Bắt đầu" required><Input id="startsAt" name="startsAt" type="datetime-local" required /></Field><Field id="endsAt" label="Kết thúc" required><Input id="endsAt" name="endsAt" type="datetime-local" required /></Field></div><Field id="location" label="Địa điểm"><Input id="location" name="location" /></Field><Field id="capacity" label="Sức chứa"><Input id="capacity" name="capacity" type="number" min="0" max="10000" defaultValue="0" /></Field><Field id="description" label="Mô tả"><Textarea id="description" name="description" rows={3} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="submitForApproval" defaultChecked /> Gửi duyệt ngay</label><Button type="submit" className="w-full">Tạo đề xuất</Button></form></Card> : null}
      </div>

      {/* Leader workspace: announcements + tasks */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Thông báo</h2>
          {club.announcements.length === 0 ? <EmptyState title="Chưa có thông báo" description="Thông báo của CLB sẽ hiển thị cho thành viên tại đây." /> : <ul className="mt-4 space-y-3">{club.announcements.map((a) => <li key={a.id} className="rounded-[var(--radius-md)] border border-[var(--color-ink-100)] p-3"><p className="font-semibold text-[var(--color-ink-900)]">{a.title}</p><p className="mt-1 text-sm text-[var(--color-ink-600)]">{a.body}</p><p className="mt-2 text-xs text-[var(--color-ink-400)]">{a.author.displayName} · {a.publishedAt ? dateOnly.format(a.publishedAt) : ""}</p></li>)}</ul>}
          {club.canManage ? <form action={createClubAnnouncementAction} className="mt-5 space-y-3 border-t border-[var(--color-ink-100)] pt-5"><input type="hidden" name="clubId" value={club.id} /><Field id="a-title" label="Tiêu đề" required><Input id="a-title" name="title" required maxLength={160} /></Field><Field id="a-body" label="Nội dung" required><Textarea id="a-body" name="body" rows={2} required maxLength={4000} /></Field><Button type="submit" size="sm" variant="outline">Đăng thông báo</Button></form> : null}
        </Card>
        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Công việc</h2>
          {club.tasks.length === 0 ? <EmptyState title="Chưa có công việc" description="Giao việc cho thành viên để theo dõi tiến độ." /> : <ul className="mt-4 space-y-2">{club.tasks.map((task) => <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-ink-100)] p-3"><div><p className="font-semibold text-[var(--color-ink-900)]">{task.title}</p><p className="mt-0.5 text-xs text-[var(--color-ink-500)]">{task.assignee ? `Giao cho ${task.assignee.displayName}` : "Chưa giao"}{task.dueAt ? ` · hạn ${dateOnly.format(task.dueAt)}` : ""}</p></div><div className="flex items-center gap-2"><Badge tone={taskTone[task.status]}>{task.status}</Badge>{club.canManage || task.assignee?.id === actor.userId ? <form action={updateClubTaskStatusAction}><input type="hidden" name="clubId" value={club.id} /><input type="hidden" name="taskId" value={task.id} /><Select name="status" defaultValue={task.status} aria-label={`Trạng thái ${task.title}`} className="h-9 py-1 text-sm"><option value="TODO">TODO</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="DONE">DONE</option><option value="CANCELLED">CANCELLED</option></Select></form> : null}</div></li>)}</ul>}
          {club.canManage ? <form action={createClubTaskAction} className="mt-5 space-y-3 border-t border-[var(--color-ink-100)] pt-5"><input type="hidden" name="clubId" value={club.id} /><Field id="t-title" label="Tên công việc" required><Input id="t-title" name="title" required maxLength={160} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field id="t-assignee" label="Giao cho"><Select id="t-assignee" name="assigneeUserId" defaultValue=""><option value="">Chưa giao</option>{club.memberships.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.displayName}</option>)}</Select></Field><Field id="t-due" label="Hạn"><Input id="t-due" name="dueAt" type="date" /></Field></div><Button type="submit" size="sm" variant="outline">Giao việc</Button></form> : null}
        </Card>
      </div>

      {/* Budget dashboard */}
      <Card>
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-[var(--color-ink-900)]">Ngân sách & chi tiêu</h2>{club.canManage ? <Badge tone="neutral">Chỉ trưởng CLB quản lý</Badge> : null}</div>
        {club.budgets.length === 0 ? <EmptyState title="Chưa có ngân sách" description="Lập ngân sách để theo dõi chi tiêu của CLB." /> : <ul className="mt-4 space-y-4">{club.budgets.map((budget) => { const amount = Number(budget.amount); const spent = Number(budget.spent); const remaining = amount - spent; const pct = amount > 0 ? Math.min(100, Math.round((spent / amount) * 100)) : 0; return <li key={budget.id} className="rounded-[var(--radius-md)] border border-[var(--color-ink-100)] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-[var(--color-ink-900)]">{budget.name}</p><p className="text-sm text-[var(--color-ink-600)]">Đã chi {formatVnd(spent)} / {formatVnd(amount)} · còn lại <span className={remaining < 0 ? "text-[var(--color-danger-600)]" : "text-[var(--color-success-600)]"}>{formatVnd(remaining)}</span></p></div><div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-ink-100)]"><div className="h-full rounded-full bg-[var(--color-brand-500)]" style={{ width: `${pct}%` }} /></div>{budget.expenses.length > 0 ? <ul className="mt-3 space-y-1 text-sm text-[var(--color-ink-600)]">{budget.expenses.map((e) => <li key={e.id} className="flex justify-between gap-3"><span>{e.description} · {dateOnly.format(e.spentAt)}</span><span>{formatVnd(Number(e.amount))}</span></li>)}</ul> : null}{club.canManage ? <form action={addClubExpenseAction} className="mt-3 flex flex-wrap items-end gap-2 border-t border-[var(--color-ink-100)] pt-3"><input type="hidden" name="clubId" value={club.id} /><input type="hidden" name="budgetId" value={budget.id} /><Field id={`e-desc-${budget.id}`} label="Khoản chi" className="flex-1 min-w-40"><Input id={`e-desc-${budget.id}`} name="description" required maxLength={240} /></Field><Field id={`e-amt-${budget.id}`} label="Số tiền (đ)"><Input id={`e-amt-${budget.id}`} name="amount" inputMode="numeric" required /></Field><Field id={`e-date-${budget.id}`} label="Ngày"><Input id={`e-date-${budget.id}`} name="spentAt" type="date" /></Field><Button type="submit" size="sm" variant="outline">Ghi chi</Button></form> : null}</li>; })}</ul>}
        {club.canManage ? <form action={createClubBudgetAction} className="mt-5 flex flex-wrap items-end gap-2 border-t border-[var(--color-ink-100)] pt-5"><input type="hidden" name="clubId" value={club.id} /><Field id="b-name" label="Tên ngân sách" required className="flex-1 min-w-40"><Input id="b-name" name="name" required maxLength={160} /></Field><Field id="b-amount" label="Tổng ngân sách (đ)"><Input id="b-amount" name="amount" inputMode="numeric" required /></Field><Button type="submit" size="sm">Lập ngân sách</Button></form> : null}
      </Card>

      {/* Per-event safety plan + post-event report (managers) */}
      {club.canManage && club.events.length > 0 ? <Card>
        <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Kế hoạch an toàn & báo cáo sau sự kiện</h2>
        <ul className="mt-4 space-y-4">{club.events.map((event) => <li key={event.id} className="rounded-[var(--radius-md)] border border-[var(--color-ink-100)] p-4"><p className="font-semibold text-[var(--color-ink-900)]">{event.title}</p><div className="mt-3 grid gap-4 lg:grid-cols-2"><form action={saveClubSafetyPlanAction} className="space-y-2"><input type="hidden" name="clubId" value={club.id} /><input type="hidden" name="eventId" value={event.id} /><Field id={`safety-${event.id}`} label="Kế hoạch an toàn"><Textarea id={`safety-${event.id}`} name="details" rows={2} defaultValue={event.safetyPlan?.details ?? ""} maxLength={4000} placeholder="Rủi ro, phương án xử lý, liên hệ khẩn cấp…" /></Field><Button type="submit" size="sm" variant="outline">Lưu kế hoạch</Button></form><form action={submitClubReportAction} className="space-y-2"><input type="hidden" name="clubId" value={club.id} /><input type="hidden" name="eventId" value={event.id} /><Field id={`report-${event.id}`} label="Báo cáo sau sự kiện"><Textarea id={`report-${event.id}`} name="summary" rows={2} defaultValue={event.report?.summary ?? ""} maxLength={4000} placeholder="Kết quả, số người tham dự, bài học…" /></Field><Button type="submit" size="sm" variant="outline">Gửi báo cáo</Button></form></div></li>)}</ul>
      </Card> : null}
    </div>
  );
}
