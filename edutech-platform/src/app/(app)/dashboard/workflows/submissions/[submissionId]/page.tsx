import {
  addWorkflowSubmissionAttachmentAction,
  addWorkflowSubmissionCommentAction,
  delegateWorkflowSubmissionStepAction,
  decideWorkflowSubmissionAction,
  saveWorkflowDraftAction,
  submitWorkflowSubmissionAction,
} from "@/app/(app)/dashboard/workflows/actions";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { FileUpload } from "@/components/ui/FileUpload";
import { requireSchoolContext } from "@/lib/auth/guards";
import { getSchoolPermissions, hasPermission, permissions } from "@/lib/auth/permissions";
import {
  getWorkflowSubmission,
  listWorkflowDelegationCandidates,
} from "@/lib/workflows/workflow-service";

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

export default async function WorkflowSubmissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ submissionId: string }>;
  searchParams: Promise<{ result?: string; error?: string }>;
}) {
  const [{ submissionId }, query] = await Promise.all([params, searchParams]);
  const { actor } = await requireSchoolContext(permissions.workflowSubmissionRead);
  const submission = await getWorkflowSubmission(actor, submissionId);
  if (!submission) notFound();

  const editable =
    submission.ownerUserId === actor.userId &&
    ["DRAFT", "CHANGES_REQUESTED"].includes(submission.status);
  const activeStep = submission.steps.find(
    (step) =>
      step.status === "ACTIVE" &&
      (step.assignedUserId
        ? step.assignedUserId === actor.userId
        : actor.schoolRoles.includes(step.step.role)),
  );
  const canDecide = submission.status === "IN_REVIEW" && Boolean(activeStep);
  const actorPermissions = getSchoolPermissions(actor.schoolRoles);
  const canComment = hasPermission(actorPermissions, permissions.workflowSubmissionComment);
  const canDelegate =
    Boolean(activeStep) &&
    hasPermission(actorPermissions, permissions.workflowSubmissionDelegate);
  const delegationCandidates =
    canDelegate && activeStep
      ? await listWorkflowDelegationCandidates(actor, activeStep.id)
      : [];
  const values = new Map(
    submission.values.map((value) => [
      value.fieldKey,
      typeof value.valueJson === "string" ? value.valueJson : "",
    ]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hồ sơ quy trình"
        title={submission.template.name}
        description={`Người nộp: ${submission.owner.displayName}`}
        actions={
          <LinkButton href="/dashboard/workflows/submissions" variant="outline" size="sm">
            Quay lại hàng đợi
          </LinkButton>
        }
      />

      {query.result ? (
        <Alert tone="success" title="Đã cập nhật">
          {query.result === "comment"
            ? "Bình luận đã được thêm vào hồ sơ."
            : query.result === "attachment"
              ? "Tệp đã được đính kèm an toàn vào hồ sơ."
            : query.result === "delegated"
              ? "Bước hiện tại đã được chuyển cho người duyệt mới."
            : "Trạng thái hồ sơ đã được lưu."}
        </Alert>
      ) : null}
      {query.error ? (
        <Alert tone="danger" title="Không thể cập nhật">
          Kiểm tra dữ liệu hoặc quyền thao tác hồ sơ.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-ink-100)] pb-4">
            <div>
              <h2 className="text-lg font-bold">Nội dung hồ sơ</h2>
              <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                Nguồn version v{submission.version.version} · không đổi sau khi nộp
              </p>
            </div>
            <Badge
              tone={
                submission.status === "APPROVED"
                  ? "success"
                  : submission.status === "REJECTED"
                    ? "danger"
                    : "warning"
              }
            >
              {submission.status}
            </Badge>
          </div>

          {editable ? (
            <form action={submitWorkflowSubmissionAction} className="mt-5 space-y-4">
              <input type="hidden" name="submissionId" value={submission.id} />
              {query.error === "invalid" ? (
                <Alert tone="danger" title="Chưa thể gửi hồ sơ">
                  Vui lòng điền đầy đủ các trường bắt buộc:{" "}
                  {submission.version.fields.filter((f) => f.required).map((f) => f.label).join(", ")}.
                </Alert>
              ) : null}
              {query.result === "draft-saved" ? (
                <Alert tone="success" title="Đã lưu nháp">Bạn có thể tiếp tục chỉnh sửa và gửi sau.</Alert>
              ) : null}
              {submission.version.fields.map((field) => (
                <Field
                  key={field.id}
                  id={`field_${field.key}`}
                  label={field.label}
                  required={field.required}
                >
                  {field.type === "TEXTAREA" ? (
                    <Textarea
                      id={`field_${field.key}`}
                      name={`field_${field.key}`}
                      defaultValue={String(values.get(field.key) ?? "")}
                      required={field.required}
                    />
                  ) : (
                    <Input
                      id={`field_${field.key}`}
                      name={`field_${field.key}`}
                      type={
                        field.type === "NUMBER"
                          ? "number"
                          : field.type === "DATE"
                            ? "date"
                            : "text"
                      }
                      defaultValue={String(values.get(field.key) ?? "")}
                      required={field.required}
                    />
                  )}
                </Field>
              ))}
              <p className="rounded-[var(--radius-md)] bg-[var(--color-ink-50)] p-3 text-sm text-[var(--color-ink-600)]">
                Kiểm tra lại thông tin trước khi gửi. Sau khi gửi, hồ sơ sẽ chuyển sang bước duyệt và không thể chỉnh sửa cho tới khi được yêu cầu bổ sung.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="submit">Gửi hồ sơ</Button>
                <Button type="submit" variant="outline" formAction={saveWorkflowDraftAction}>Lưu nháp</Button>
              </div>
            </form>
          ) : (
            <dl className="mt-5 space-y-4">
              {submission.version.fields.map((field) => (
                <div key={field.id}>
                  <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-400)]">
                    {field.label}
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-ink-700)]">
                    {String(values.get(field.key) ?? "Chưa nhập")}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-base font-bold">Tiến trình</h2>
            <ol className="mt-4 space-y-3">
              {submission.steps.map((step, index) => (
                <li key={step.id} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      step.status === "APPROVED"
                        ? "bg-[var(--color-success-100)] text-[var(--color-success-800)]"
                        : step.status === "ACTIVE"
                          ? "bg-[var(--color-brand-100)] text-[var(--color-brand-800)]"
                          : "bg-[var(--color-ink-100)] text-[var(--color-ink-500)]"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{step.step.name}</p>
                    <p className="text-xs text-[var(--color-ink-500)]">
                      {step.status} · {step.step.role}
                    </p>
                    {step.assignedUser ? (
                      <p className="mt-1 text-xs font-medium text-[var(--color-brand-700)]">
                        Đã giao: {step.assignedUser.displayName}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {canDecide ? (
            <Card>
              <h2 className="text-base font-bold">Quyết định</h2>
              <form action={decideWorkflowSubmissionAction} className="mt-4 space-y-3">
                <input type="hidden" name="submissionId" value={submission.id} />
                <Field id="reason" label="Lý do">
                  <Textarea id="reason" name="reason" rows={3} maxLength={1000} />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" name="type" value="APPROVE">
                    Duyệt
                  </Button>
                  <Button
                    type="submit"
                    name="type"
                    value="REQUEST_CHANGES"
                    variant="outline"
                  >
                    Yêu cầu chỉnh sửa
                  </Button>
                  <Button type="submit" name="type" value="REJECT" variant="danger">
                    Từ chối
                  </Button>
                </div>
              </form>
            </Card>
          ) : null}

          {activeStep && canDelegate && delegationCandidates.length ? (
            <Card>
              <h2 className="text-base font-bold">Chuyển người duyệt</h2>
              <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                Chỉ thành viên đang hoạt động và đúng vai trò của bước này mới xuất hiện.
              </p>
              <form action={delegateWorkflowSubmissionStepAction} className="mt-4 space-y-3">
                <input type="hidden" name="submissionId" value={submission.id} />
                <input type="hidden" name="submissionStepId" value={activeStep.id} />
                <Field id="delegation-target" label="Người duyệt mới" required>
                  <Select id="delegation-target" name="targetUserId" required defaultValue="">
                    <option value="" disabled>
                      Chọn người nhận
                    </option>
                    {delegationCandidates.map((candidate) => (
                      <option key={candidate.userId} value={candidate.userId}>
                        {candidate.displayName}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  id="delegation-reason"
                  label="Lý do chuyển"
                  description="Tối đa 500 ký tự; lý do sẽ nằm trong nhật ký hồ sơ."
                >
                  <Textarea
                    id="delegation-reason"
                    name="reason"
                    rows={3}
                    maxLength={500}
                  />
                </Field>
                <Button type="submit" variant="outline">
                  Chuyển người duyệt
                </Button>
              </form>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Trao đổi hồ sơ</h2>
              <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                Bình luận được lưu cùng hồ sơ để người nộp và người duyệt phối hợp.
              </p>
            </div>
            <Badge tone="neutral">{submission.comments.length}</Badge>
          </div>

          <section className="mt-6 rounded-2xl border border-[var(--color-ink-100)] bg-[var(--color-ink-50)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-ink-900)]">
                  Tài liệu đính kèm
                </h3>
                <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                  PDF mở ngay trên trình duyệt; định dạng khác được tải xuống.
                </p>
              </div>
              <Badge tone="neutral">{submission.attachments.length}</Badge>
            </div>

            {submission.attachments.length ? (
              <ul className="mt-4 space-y-3">
                {submission.attachments.map((attachment) => {
                  const href = `/dashboard/workflows/submissions/${submission.id}/attachments/${attachment.id}`;
                  return (
                    <li
                      key={attachment.id}
                      className="rounded-xl border border-[var(--color-ink-100)] bg-white p-3"
                    >
                      <p className="break-all text-sm font-semibold text-[var(--color-ink-900)]">
                        {attachment.file.originalName}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                        {attachment.file.createdBy.displayName} ·{" "}
                        {Math.max(1, Math.ceil(Number(attachment.file.sizeBytes) / 1024))} KB
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attachment.file.mimeType === "application/pdf" ? (
                          <LinkButton href={href} size="sm" variant="outline">
                            Xem PDF
                          </LinkButton>
                        ) : null}
                        <LinkButton href={`${href}?download=1`} size="sm" variant="ghost">
                          Tải xuống
                        </LinkButton>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[var(--color-ink-500)]">
                Chưa có tài liệu nào trong hồ sơ.
              </p>
            )}

            {canComment ? (
              <form
                action={addWorkflowSubmissionAttachmentAction}
                className="mt-4 space-y-3 border-t border-[var(--color-ink-100)] pt-4"
              >
                <input type="hidden" name="submissionId" value={submission.id} />
                <FileUpload
                  name="file"
                  accept=".pdf,.docx,.pptx,.xlsx,.txt,.md,.jpg,.jpeg,.png,.webp"
                  maxSizeMb={15}
                />
                <Button type="submit" variant="outline">
                  Đính kèm tài liệu
                </Button>
              </form>
            ) : null}
          </section>

          {submission.comments.length ? (
            <ol className="mt-5 divide-y divide-[var(--color-ink-100)] border-y border-[var(--color-ink-100)]">
              {submission.comments.map((comment) => (
                <li key={comment.id} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-ink-900)]">
                      {comment.author.displayName}
                    </p>
                    <time
                      dateTime={comment.createdAt.toISOString()}
                      className="text-xs text-[var(--color-ink-500)]"
                    >
                      {dateTimeFormatter.format(comment.createdAt)}
                    </time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-ink-700)]">
                    {comment.body}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 rounded-xl bg-[var(--color-ink-50)] px-4 py-5 text-sm text-[var(--color-ink-500)]">
              Chưa có bình luận. Hãy để lại ngữ cảnh thay vì trao đổi rời rạc bên ngoài.
            </p>
          )}

          {canComment ? (
            <form action={addWorkflowSubmissionCommentAction} className="mt-5 space-y-3">
              <input type="hidden" name="submissionId" value={submission.id} />
              <Field
                id="workflow-comment"
                label="Bình luận mới"
                description="Tối đa 2.000 ký tự. Không ghi dữ liệu nhạy cảm không cần thiết."
                required
              >
                <Textarea
                  id="workflow-comment"
                  name="body"
                  rows={4}
                  maxLength={2000}
                  required
                />
              </Field>
              <Button type="submit">Gửi bình luận</Button>
            </form>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-base font-bold">Nhật ký xử lý</h2>
          <ol className="mt-4 space-y-4">
            {submission.history.map((entry) => (
              <li key={entry.id} className="border-l-2 border-[var(--color-brand-200)] pl-3">
                <p className="text-sm font-semibold">{entry.action}</p>
                <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                  {entry.actor.displayName} · {dateTimeFormatter.format(entry.createdAt)}
                </p>
                <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                  {entry.fromStatus ? `${entry.fromStatus} → ` : ""}
                  {entry.toStatus}
                </p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
