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

const dateTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "full",
  timeStyle: "short",
});
const dateOnly = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });
const taskTone: Record<string, "neutral" | "warning" | "success"> = {
  TODO: "neutral",
  IN_PROGRESS: "warning",
  DONE: "success",
  CANCELLED: "neutral",
};
const taskLabel: Record<string, string> = {
  TODO: "Chưa bắt đầu",
  IN_PROGRESS: "Đang thực hiện",
  DONE: "Hoàn thành",
  CANCELLED: "Đã hủy",
};
const memberRoleLabel: Record<string, string> = {
  LEADER: "Trưởng CLB",
  MEMBER: "Thành viên",
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
  const completedTasks = club.tasks.filter(
    (task) => task.status === "DONE",
  ).length;
  const totalBudget = club.budgets.reduce(
    (sum, budget) => sum + Number(budget.amount),
    0,
  );
  const totalSpent = club.budgets.reduce(
    (sum, budget) => sum + Number(budget.spent),
    0,
  );
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Câu lạc bộ"
        title={club.name}
        description={club.description ?? "Không có mô tả."}
        actions={
          <LinkButton
            href="/dashboard/clubs-events"
            variant="outline"
            size="sm"
          >
            Quay lại danh sách
          </LinkButton>
        }
      />
      {query.result ? (
        <Alert tone="success" title="Đã cập nhật">
          Thay đổi đã được lưu.
        </Alert>
      ) : null}
      {query.error ? (
        <Alert tone="danger" title="Không thể cập nhật">
          Kiểm tra dữ liệu hoặc quyền truy cập.
        </Alert>
      ) : null}

      <section
        aria-label="Tổng quan vận hành câu lạc bộ"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      >
        {[
          [
            "Thành viên",
            club.memberships.length.toLocaleString("vi-VN"),
            "Đang hoạt động",
          ],
          [
            "Đơn chờ",
            club.applications.length.toLocaleString("vi-VN"),
            "Cần phản hồi",
          ],
          [
            "Sự kiện",
            club.events.length.toLocaleString("vi-VN"),
            "Trong hồ sơ CLB",
          ],
          [
            "Công việc",
            `${completedTasks}/${club.tasks.length}`,
            "Đã hoàn thành",
          ],
          [
            "Ngân sách còn",
            formatVnd(totalBudget - totalSpent),
            `Đã chi ${formatVnd(totalSpent)}`,
          ],
        ].map(([label, value, hint]) => (
          <Card key={label} className="relative overflow-hidden p-4">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1 bg-[var(--color-brand-600)]"
            />
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-ink-400)]">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-ink-900)]">
              {value}
            </p>
            <p className="mt-1 text-xs text-[var(--color-ink-500)]">{hint}</p>
          </Card>
        ))}
      </section>

      <nav
        aria-label="Khu vực vận hành CLB"
        className="flex flex-wrap gap-2 rounded-[var(--radius-md)] border border-[var(--color-ink-200)] bg-[var(--color-surface)] p-2"
      >
        {[
          ["#people", "Nhân sự"],
          ["#events", "Sự kiện"],
          ["#communications", "Truyền thông"],
          ["#tasks", "Công việc"],
          ["#finance", "Tài chính"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-[var(--color-ink-600)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-800)]"
          >
            {label}
          </a>
        ))}
      </nav>

      <div
        id="people"
        className="grid scroll-mt-24 items-start gap-6 lg:grid-cols-[1fr_1fr]"
      >
        <Card className="self-start">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[var(--color-ink-900)]">
              Thành viên
            </h2>
            <Badge tone="brand">{club.memberships.length} đang hoạt động</Badge>
          </div>
          {club.memberships.length === 0 ? (
            <EmptyState
              title="Chưa có thành viên"
              description="Đơn được duyệt sẽ xuất hiện ở đây."
            />
          ) : (
            <ul className="mt-4 divide-y divide-[var(--color-ink-100)]">
              {club.memberships.map((membership) => (
                <li
                  key={membership.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <p className="font-semibold">{membership.user.displayName}</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        membership.role === "LEADER" ? "warning" : "neutral"
                      }
                    >
                      {memberRoleLabel[membership.role] ?? membership.role}
                    </Badge>
                    {club.canManage && membership.user.id !== actor.userId ? (
                      <form action={setClubMemberRoleAction}>
                        <input type="hidden" name="clubId" value={club.id} />
                        <input
                          type="hidden"
                          name="userId"
                          value={membership.user.id}
                        />
                        <input
                          type="hidden"
                          name="role"
                          value={
                            membership.role === "LEADER" ? "MEMBER" : "LEADER"
                          }
                        />
                        <Button size="sm" variant="ghost" type="submit">
                          {membership.role === "LEADER"
                            ? "Hạ vai trò"
                            : "Đặt làm trưởng"}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="self-start">
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">
            Đơn tham gia chờ duyệt
          </h2>
          {club.applications.length === 0 ? (
            <EmptyState
              title="Không có đơn chờ"
              description="Đơn mới sẽ được đưa vào hàng đợi."
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {club.applications.map((application) => (
                <li
                  key={application.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-ink-100)] p-3"
                >
                  <p className="font-semibold">
                    {application.applicant.displayName}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                    {application.motivation || "Không có lời nhắn."}
                  </p>
                  {canReview ? (
                    <div className="mt-3 flex gap-2">
                      <form action={reviewClubApplicationAction}>
                        <input type="hidden" name="clubId" value={club.id} />
                        <input
                          type="hidden"
                          name="applicationId"
                          value={application.id}
                        />
                        <input type="hidden" name="decision" value="approve" />
                        <Button size="sm" type="submit">
                          Duyệt
                        </Button>
                      </form>
                      <form action={reviewClubApplicationAction}>
                        <input type="hidden" name="clubId" value={club.id} />
                        <input
                          type="hidden"
                          name="applicationId"
                          value={application.id}
                        />
                        <input type="hidden" name="decision" value="reject" />
                        <Button size="sm" type="submit" variant="outline">
                          Từ chối
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <Badge tone="warning" className="mt-3">
                      Đơn đang chờ duyệt
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
          {club.canApply ? (
            <form
              action={applyToClubAction}
              className="mt-5 border-t border-[var(--color-ink-100)] pt-5"
            >
              <input type="hidden" name="clubId" value={club.id} />
              <Field id="motivation" label="Lời nhắn đăng ký">
                <Textarea
                  id="motivation"
                  name="motivation"
                  rows={2}
                  maxLength={500}
                  placeholder="Bạn muốn đóng góp gì cho CLB?"
                />
              </Field>
              <Button type="submit" variant="outline" className="mt-3">
                Gửi đơn tham gia
              </Button>
            </form>
          ) : null}
        </Card>
      </div>

      <div
        id="events"
        className="grid scroll-mt-24 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]"
      >
        <Card className="self-start">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-ink-400)]">
                Lịch hoạt động
              </p>
              <h2 className="mt-1 text-lg font-bold text-[var(--color-ink-900)]">
                Sự kiện
              </h2>
            </div>
            <Badge tone="brand">{club.events.length} sự kiện</Badge>
          </div>
          {club.events.length === 0 ? (
            <EmptyState
              title="Chưa có sự kiện"
              description="Tạo đề xuất đầu tiên để bắt đầu."
            />
          ) : (
            <ul className="mt-4 divide-y divide-[var(--color-ink-100)]">
              {club.events.map((event) => (
                <li key={event.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{event.title}</p>
                      <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                        {dateTime.format(event.startsAt)} ·{" "}
                        {event._count.registrations} đăng ký
                        {event.capacity ? ` / ${event.capacity}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        tone={
                          event.status === "APPROVED" ? "success" : "warning"
                        }
                      >
                        {event.status === "APPROVED" ? "Đã duyệt" : "Chờ duyệt"}
                      </Badge>
                      {event.status === "APPROVED" && club.canRegisterEvents ? (
                        <form action={registerClubEventAction}>
                          <input type="hidden" name="clubId" value={club.id} />
                          <input
                            type="hidden"
                            name="eventId"
                            value={event.id}
                          />
                          <Button size="sm" variant="outline" type="submit">
                            Đăng ký
                          </Button>
                        </form>
                      ) : event.status === "PENDING_APPROVAL" &&
                        club.canApproveEvents ? (
                        <form action={approveClubEventAction}>
                          <input type="hidden" name="clubId" value={club.id} />
                          <input
                            type="hidden"
                            name="eventId"
                            value={event.id}
                          />
                          <input
                            type="hidden"
                            name="decision"
                            value="approve"
                          />
                          <Button size="sm" type="submit">
                            Duyệt
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                  {club.canManage ? (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-semibold text-[var(--color-brand-700)]">
                        Kế hoạch an toàn & báo cáo sau sự kiện
                      </summary>
                      <div className="mt-3 grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-ink-100)] bg-[var(--color-ink-50)] p-3 lg:grid-cols-2">
                        <form
                          action={saveClubSafetyPlanAction}
                          className="space-y-2"
                        >
                          <input type="hidden" name="clubId" value={club.id} />
                          <input
                            type="hidden"
                            name="eventId"
                            value={event.id}
                          />
                          <Field
                            id={`safety-${event.id}`}
                            label="Kế hoạch an toàn"
                          >
                            <Textarea
                              id={`safety-${event.id}`}
                              name="details"
                              rows={2}
                              defaultValue={event.safetyPlan?.details ?? ""}
                              maxLength={4000}
                              placeholder="Rủi ro, phương án xử lý, liên hệ khẩn cấp…"
                            />
                          </Field>
                          <Button type="submit" size="sm" variant="outline">
                            Lưu kế hoạch
                          </Button>
                        </form>
                        <form
                          action={submitClubReportAction}
                          className="space-y-2"
                        >
                          <input type="hidden" name="clubId" value={club.id} />
                          <input
                            type="hidden"
                            name="eventId"
                            value={event.id}
                          />
                          <Field
                            id={`report-${event.id}`}
                            label="Báo cáo sau sự kiện"
                          >
                            <Textarea
                              id={`report-${event.id}`}
                              name="summary"
                              rows={2}
                              defaultValue={event.report?.summary ?? ""}
                              maxLength={4000}
                              placeholder="Kết quả, số người tham dự, bài học…"
                            />
                          </Field>
                          <Button type="submit" size="sm" variant="outline">
                            Gửi báo cáo
                          </Button>
                        </form>
                      </div>
                    </details>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
        {canCreateEvent ? (
          <Card className="self-start">
            <details className="group">
              <summary className="cursor-pointer list-none">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-brand-700)]">
                  Thao tác nhanh
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-[var(--color-ink-900)]">
                    Tạo đề xuất sự kiện
                  </h2>
                  <span
                    aria-hidden="true"
                    className="text-xl text-[var(--color-brand-700)] transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink-500)]">
                  Mở biểu mẫu khi cần lập sự kiện mới; dữ liệu sẽ đi qua luồng
                  duyệt của trường.
                </p>
              </summary>
              <form
                action={createClubEventAction}
                className="mt-5 space-y-4 border-t border-[var(--color-ink-100)] pt-5"
              >
                <input type="hidden" name="clubId" value={club.id} />
                <Field id="title" label="Tên sự kiện" required>
                  <Input id="title" name="title" required maxLength={160} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="startsAt" label="Bắt đầu" required>
                    <Input
                      id="startsAt"
                      name="startsAt"
                      type="datetime-local"
                      required
                    />
                  </Field>
                  <Field id="endsAt" label="Kết thúc" required>
                    <Input
                      id="endsAt"
                      name="endsAt"
                      type="datetime-local"
                      required
                    />
                  </Field>
                </div>
                <Field id="location" label="Địa điểm">
                  <Input id="location" name="location" />
                </Field>
                <Field id="capacity" label="Sức chứa">
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="0"
                    max="10000"
                    defaultValue="0"
                  />
                </Field>
                <Field id="description" label="Mô tả">
                  <Textarea id="description" name="description" rows={3} />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="submitForApproval"
                    defaultChecked
                  />{" "}
                  Gửi duyệt ngay
                </label>
                <Button type="submit" className="w-full">
                  Tạo đề xuất
                </Button>
              </form>
            </details>
          </Card>
        ) : null}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
        <Card id="communications" className="scroll-mt-24 self-start">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-ink-400)]">
                Truyền thông nội bộ
              </p>
              <h2 className="mt-1 text-lg font-bold text-[var(--color-ink-900)]">
                Thông báo
              </h2>
            </div>
            <Badge tone="neutral">{club.announcements.length} bản tin</Badge>
          </div>
          {club.announcements.length === 0 ? (
            <EmptyState
              title="Chưa có thông báo"
              description="Thông báo của CLB sẽ hiển thị cho thành viên tại đây."
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {club.announcements.map((a) => (
                <li
                  key={a.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-ink-100)] p-3"
                >
                  <p className="font-semibold text-[var(--color-ink-900)]">
                    {a.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-ink-600)]">
                    {a.body}
                  </p>
                  <p className="mt-2 text-xs text-[var(--color-ink-400)]">
                    {a.author.displayName} ·{" "}
                    {a.publishedAt ? dateOnly.format(a.publishedAt) : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {club.canManage ? (
            <details className="group mt-5 border-t border-[var(--color-ink-100)] pt-4">
              <summary className="cursor-pointer text-sm font-bold text-[var(--color-brand-700)]">
                + Soạn thông báo mới
              </summary>
              <form
                action={createClubAnnouncementAction}
                className="mt-4 space-y-3"
              >
                <input type="hidden" name="clubId" value={club.id} />
                <Field id="a-title" label="Tiêu đề" required>
                  <Input id="a-title" name="title" required maxLength={160} />
                </Field>
                <Field id="a-body" label="Nội dung" required>
                  <Textarea
                    id="a-body"
                    name="body"
                    rows={2}
                    required
                    maxLength={4000}
                  />
                </Field>
                <Button type="submit" size="sm" variant="outline">
                  Đăng thông báo
                </Button>
              </form>
            </details>
          ) : null}
        </Card>
        <Card id="tasks" className="scroll-mt-24 self-start">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-ink-400)]">
                Điều phối thực thi
              </p>
              <h2 className="mt-1 text-lg font-bold text-[var(--color-ink-900)]">
                Công việc
              </h2>
            </div>
            <Badge
              tone={
                completedTasks === club.tasks.length && club.tasks.length > 0
                  ? "success"
                  : "warning"
              }
            >
              {completedTasks}/{club.tasks.length} hoàn thành
            </Badge>
          </div>
          {club.tasks.length === 0 ? (
            <EmptyState
              title="Chưa có công việc"
              description="Giao việc cho thành viên để theo dõi tiến độ."
            />
          ) : (
            <ul className="mt-4 space-y-2">
              {club.tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-ink-100)] p-3"
                >
                  <div>
                    <p className="font-semibold text-[var(--color-ink-900)]">
                      {task.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">
                      {task.assignee
                        ? `Giao cho ${task.assignee.displayName}`
                        : "Chưa giao"}
                      {task.dueAt
                        ? ` · hạn ${dateOnly.format(task.dueAt)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={taskTone[task.status]}>
                      {taskLabel[task.status] ?? task.status}
                    </Badge>
                    {club.canManage || task.assignee?.id === actor.userId ? (
                      <form action={updateClubTaskStatusAction}>
                        <input type="hidden" name="clubId" value={club.id} />
                        <input type="hidden" name="taskId" value={task.id} />
                        <Select
                          name="status"
                          defaultValue={task.status}
                          aria-label={`Trạng thái ${task.title}`}
                          className="h-9 py-1 text-sm"
                        >
                          <option value="TODO">Chưa bắt đầu</option>
                          <option value="IN_PROGRESS">Đang thực hiện</option>
                          <option value="DONE">Hoàn thành</option>
                          <option value="CANCELLED">Đã hủy</option>
                        </Select>
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          className="mt-2"
                        >
                          Lưu trạng thái
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {club.canManage ? (
            <details className="group mt-5 border-t border-[var(--color-ink-100)] pt-4">
              <summary className="cursor-pointer text-sm font-bold text-[var(--color-brand-700)]">
                + Tạo và giao việc
              </summary>
              <form action={createClubTaskAction} className="mt-4 space-y-3">
                <input type="hidden" name="clubId" value={club.id} />
                <Field id="t-title" label="Tên công việc" required>
                  <Input id="t-title" name="title" required maxLength={160} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="t-assignee" label="Giao cho">
                    <Select
                      id="t-assignee"
                      name="assigneeUserId"
                      defaultValue=""
                    >
                      <option value="">Chưa giao</option>
                      {club.memberships.map((m) => (
                        <option key={m.user.id} value={m.user.id}>
                          {m.user.displayName}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field id="t-due" label="Hạn">
                    <Input id="t-due" name="dueAt" type="date" />
                  </Field>
                </div>
                <Button type="submit" size="sm" variant="outline">
                  Giao việc
                </Button>
              </form>
            </details>
          ) : null}
        </Card>
      </div>

      <Card id="finance" className="scroll-mt-24">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-ink-400)]">
              Kiểm soát tài chính
            </p>
            <h2 className="mt-1 text-lg font-bold text-[var(--color-ink-900)]">
              Ngân sách & chi tiêu
            </h2>
          </div>
          {club.canManage ? (
            <Badge tone="neutral">Chỉ trưởng CLB quản lý</Badge>
          ) : null}
        </div>
        {club.budgets.length === 0 ? (
          <EmptyState
            title="Chưa có ngân sách"
            description="Lập ngân sách để theo dõi chi tiêu của CLB."
          />
        ) : (
          <ul className="mt-4 space-y-4">
            {club.budgets.map((budget) => {
              const amount = Number(budget.amount);
              const spent = Number(budget.spent);
              const remaining = amount - spent;
              const pct =
                amount > 0
                  ? Math.min(100, Math.round((spent / amount) * 100))
                  : 0;
              return (
                <li
                  key={budget.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-ink-100)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--color-ink-900)]">
                      {budget.name}
                    </p>
                    <p className="text-sm text-[var(--color-ink-600)]">
                      Đã chi {formatVnd(spent)} / {formatVnd(amount)} · còn lại{" "}
                      <span
                        className={
                          remaining < 0
                            ? "text-[var(--color-danger-600)]"
                            : "text-[var(--color-success-600)]"
                        }
                      >
                        {formatVnd(remaining)}
                      </span>
                    </p>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-ink-100)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-brand-500)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {budget.expenses.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-sm text-[var(--color-ink-600)]">
                      {budget.expenses.map((e) => (
                        <li key={e.id} className="flex justify-between gap-3">
                          <span>
                            {e.description} · {dateOnly.format(e.spentAt)}
                          </span>
                          <span>{formatVnd(Number(e.amount))}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {club.canManage ? (
                    <details className="mt-3 border-t border-[var(--color-ink-100)] pt-3">
                      <summary className="cursor-pointer text-sm font-bold text-[var(--color-brand-700)]">
                        + Ghi nhận khoản chi
                      </summary>
                      <form
                        action={addClubExpenseAction}
                        className="mt-3 flex flex-wrap items-end gap-2"
                      >
                        <input type="hidden" name="clubId" value={club.id} />
                        <input
                          type="hidden"
                          name="budgetId"
                          value={budget.id}
                        />
                        <Field
                          id={`e-desc-${budget.id}`}
                          label="Khoản chi"
                          className="flex-1 min-w-40"
                        >
                          <Input
                            id={`e-desc-${budget.id}`}
                            name="description"
                            required
                            maxLength={240}
                          />
                        </Field>
                        <Field id={`e-amt-${budget.id}`} label="Số tiền (đ)">
                          <Input
                            id={`e-amt-${budget.id}`}
                            name="amount"
                            inputMode="numeric"
                            required
                          />
                        </Field>
                        <Field id={`e-date-${budget.id}`} label="Ngày">
                          <Input
                            id={`e-date-${budget.id}`}
                            name="spentAt"
                            type="date"
                          />
                        </Field>
                        <Button type="submit" size="sm" variant="outline">
                          Ghi chi
                        </Button>
                      </form>
                    </details>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {club.canManage ? (
          <details className="mt-5 border-t border-[var(--color-ink-100)] pt-4">
            <summary className="cursor-pointer text-sm font-bold text-[var(--color-brand-700)]">
              + Lập ngân sách mới
            </summary>
            <form
              action={createClubBudgetAction}
              className="mt-4 flex flex-wrap items-end gap-2"
            >
              <input type="hidden" name="clubId" value={club.id} />
              <Field
                id="b-name"
                label="Tên ngân sách"
                required
                className="flex-1 min-w-40"
              >
                <Input id="b-name" name="name" required maxLength={160} />
              </Field>
              <Field id="b-amount" label="Tổng ngân sách (đ)">
                <Input
                  id="b-amount"
                  name="amount"
                  inputMode="numeric"
                  required
                />
              </Field>
              <Button type="submit" size="sm">
                Lập ngân sách
              </Button>
            </form>
          </details>
        ) : null}
      </Card>
    </div>
  );
}
