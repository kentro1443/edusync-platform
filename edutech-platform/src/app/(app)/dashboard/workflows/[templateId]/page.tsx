import { addWorkflowFieldAction, addWorkflowStepAction, publishWorkflowTemplateAction } from "@/app/(app)/dashboard/workflows/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Field, Input, Select } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { getWorkflowTemplate } from "@/lib/workflows/workflow-service";

export default async function WorkflowBuilderPage({ params, searchParams }: { params: Promise<{ templateId: string }>; searchParams: Promise<{ result?: string; error?: string }> }) {
  const [{ templateId }, query] = await Promise.all([params, searchParams]);
  const { actor } = await requireSchoolContext(permissions.workflowTemplateRead);
  const template = await getWorkflowTemplate(actor, templateId);
  if (!template) return null;
  const draft = template.versions.find((version) => version.id === template.currentVersionId) ?? template.versions[0];
  const canEdit = actor.schoolRoles.some((role) => ["SCHOOL_ADMIN", "TEACHER_STAFF", "APPROVER_REVIEWER"].includes(role));
  return <div className="space-y-6">
    <PageHeader eyebrow="Workflow builder" title={template.name} description={template.description ?? "Cấu hình trường, bước duyệt và xuất bản."} actions={<LinkButton href="/dashboard/workflows" variant="outline" size="sm">Quay lại</LinkButton>} />
    {query.result ? <Alert tone="success" title="Đã lưu thay đổi">Bản nháp đã được cập nhật.</Alert> : null}
    {query.error ? <Alert tone="danger" title="Không thể cập nhật">Kiểm tra dữ liệu hoặc quyền.</Alert> : null}
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-ink-100)] pb-4"><div><h2 className="text-lg font-bold">Canvas biểu mẫu</h2><p className="mt-1 text-sm text-[var(--color-ink-500)]">v{draft?.version ?? 1} · {draft?.publishedAt ? "đã xuất bản" : "bản nháp"}</p></div><Badge tone={template.status === "PUBLISHED" ? "success" : "neutral"}>{template.status}</Badge></div>
        <div className="mt-5 space-y-3">{draft?.fields.map((field, index) => <div key={field.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-ink-200)] p-3"><div><p className="font-semibold text-[var(--color-ink-900)]">{index + 1}. {field.label}</p><p className="text-xs text-[var(--color-ink-500)]">{field.key} · {field.type}{field.required ? " · bắt buộc" : ""}</p></div><span className="text-xs text-[var(--color-ink-400)]">Trường</span></div>)}</div>
        <h3 className="mt-8 text-base font-bold">Luồng phê duyệt</h3><ol className="mt-3 space-y-3">{draft?.steps.map((step, index) => {
          const condition = step.conditionJson as { field?: string; operator?: string; value?: unknown };
          return <li key={step.id} className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--color-ink-50)] p-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-sm font-bold text-[var(--color-brand-800)]">{index + 1}</span><div><p className="font-semibold">{step.name}</p><p className="text-xs text-[var(--color-ink-500)]">Vai trò: {step.role}{step.parallelGroup ? ` · nhóm song song ${step.parallelGroup}` : ""}</p>{condition.field ? <p className="mt-1 text-xs text-[var(--color-brand-700)]">Chỉ chạy khi {condition.field} {condition.operator} {String(condition.value ?? "")}</p> : null}</div></li>;
        })}</ol>
      </Card>
      {canEdit ? <div className="space-y-6">
        <Card><h2 className="text-base font-bold">Thêm trường</h2><form action={addWorkflowFieldAction} className="mt-4 space-y-3"><input type="hidden" name="templateId" value={template.id} /><Field id="key" label="Mã trường" required><Input id="key" name="key" required placeholder="budget" /></Field><Field id="label" label="Nhãn hiển thị" required><Input id="label" name="label" required placeholder="Ngân sách dự kiến" /></Field><Field id="type" label="Kiểu"><Select id="type" name="type" defaultValue="TEXT"><option value="TEXT">Văn bản</option><option value="TEXTAREA">Văn bản dài</option><option value="NUMBER">Số</option><option value="DATE">Ngày</option><option value="CHECKBOX">Đúng/Sai</option></Select></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="required" /> Bắt buộc</label><Button type="submit" size="sm">Thêm trường</Button></form></Card>
        <Card><h2 className="text-base font-bold">Thêm bước duyệt</h2><p className="mt-1 text-xs leading-5 text-[var(--color-ink-500)]">Bỏ trống điều kiện để bước luôn chạy. Các bước cùng số nhóm sẽ được mở song song.</p><form action={addWorkflowStepAction} className="mt-4 space-y-3"><input type="hidden" name="templateId" value={template.id} /><Field id="stepName" label="Tên bước" required><Input id="stepName" name="name" required placeholder="Duyệt ngân sách" /></Field><Field id="role" label="Vai trò"><Select id="role" name="role" defaultValue="SCHOOL_ADMIN"><option value="SCHOOL_ADMIN">Quản trị trường</option><option value="TEACHER_STAFF">Giáo viên/nhân sự</option><option value="MENTOR_COUNSELOR">Cố vấn</option><option value="APPROVER_REVIEWER">Người duyệt</option></Select></Field><Field id="parallelGroup" label="Nhóm duyệt song song"><Input id="parallelGroup" name="parallelGroup" type="number" min="1" placeholder="Ví dụ: 1" /></Field><div className="rounded-[var(--radius-md)] border border-[var(--color-ink-200)] p-3"><p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--color-ink-500)]">Điều kiện tùy chọn</p><div className="space-y-3"><Field id="conditionField" label="Mã trường điều kiện"><Input id="conditionField" name="conditionField" placeholder="budget" /></Field><Field id="conditionOperator" label="Phép so sánh"><Select id="conditionOperator" name="conditionOperator" defaultValue="equals"><option value="equals">Bằng</option><option value="notEquals">Khác</option><option value="truthy">Có / đúng</option><option value="falsy">Không / sai</option></Select></Field><Field id="conditionValue" label="Giá trị"><Input id="conditionValue" name="conditionValue" placeholder="1000000" /></Field></div></div><Button type="submit" size="sm">Thêm bước</Button></form></Card>
        <Card className="border-[var(--color-brand-200)] bg-[var(--color-brand-50)]"><h2 className="text-base font-bold">Xuất bản</h2><p className="mt-2 text-sm leading-6 text-[var(--color-ink-600)]">Version đã xuất bản không sửa trực tiếp. Lần xuất bản kế tiếp tạo version mới và giữ lịch sử hồ sơ cũ.</p><form action={publishWorkflowTemplateAction} className="mt-4"><input type="hidden" name="templateId" value={template.id} /><Button type="submit" className="w-full">Xuất bản version</Button></form></Card>
      </div> : null}
    </div>
  </div>;
}
