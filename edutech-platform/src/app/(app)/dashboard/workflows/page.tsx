import Link from "next/link";

import { createWorkflowSubmissionAction, createWorkflowTemplateAction } from "@/app/(app)/dashboard/workflows/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { listWorkflowSubmissions, listWorkflowTemplates } from "@/lib/workflows/workflow-service";

export default async function WorkflowsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ actor }, params] = await Promise.all([
    requireSchoolContext(permissions.workflowTemplateRead),
    searchParams,
  ]);
  const [templates, submissions] = await Promise.all([listWorkflowTemplates(actor), listWorkflowSubmissions(actor)]);
  const canBuild = actor.schoolRoles.some((role) => ["SCHOOL_ADMIN", "TEACHER_STAFF", "APPROVER_REVIEWER"].includes(role));
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quy trình không-code"
        title="Mẫu biểu và phê duyệt"
        description="Tạo mẫu, xuất bản phiên bản bất biến, nhận hồ sơ và xử lý theo từng bước có lịch sử."
        actions={<LinkButton href="/dashboard/workflows/submissions" variant="outline" size="sm">Hàng đợi duyệt</LinkButton>}
      />
      {params.error ? <Alert tone="danger" title="Không thể thực hiện">Kiểm tra quyền hoặc dữ liệu nhập.</Alert> : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card>
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-ink-100)] pb-4">
            <div><h2 className="text-lg font-bold text-[var(--color-ink-900)]">Mẫu quy trình</h2><p className="mt-1 text-sm text-[var(--color-ink-500)]">{templates.length} mẫu trong trường</p></div>
            <Badge tone="brand">Versioned</Badge>
          </div>
          {templates.length === 0 ? <EmptyState title="Chưa có mẫu" description="Tạo quy trình đầu tiên để bắt đầu." /> : (
            <ul className="divide-y divide-[var(--color-ink-100)]">
              {templates.map((template) => {
                const latest = template.versions[0];
                return <li key={template.id} className="py-4 first:pt-1 last:pb-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><Link href={`/dashboard/workflows/${template.id}`} className="font-bold text-[var(--color-ink-900)] hover:text-[var(--color-brand-700)] hover:underline">{template.name}</Link><p className="mt-1 text-sm text-[var(--color-ink-500)]">{latest ? `${latest.fields.length} trường · ${latest.steps.length} bước · v${latest.version}` : "Chưa có phiên bản"}</p></div>
                    <Badge tone={template.status === "PUBLISHED" ? "success" : "neutral"}>{template.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}</Badge>
                  </div>
                  {template.status === "PUBLISHED" ? <form action={createWorkflowSubmissionAction} className="mt-3"><input type="hidden" name="templateId" value={template.id} /><Button size="sm" type="submit">Nộp hồ sơ</Button></form> : null}
                </li>;
              })}
            </ul>
          )}
        </Card>
        {canBuild ? <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Tạo mẫu mới</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-ink-500)]">Mẫu bắt đầu ở bản nháp; xuất bản sẽ khóa version đang dùng.</p>
          <form action={createWorkflowTemplateAction} className="mt-5 space-y-4">
            <Field id="name" label="Tên quy trình" required><Input id="name" name="name" required maxLength={160} placeholder="Ví dụ: Xin tổ chức sự kiện" /></Field>
            <Field id="description" label="Mô tả"><Textarea id="description" name="description" rows={3} maxLength={500} /></Field>
            <Button type="submit" className="w-full">Tạo bản nháp</Button>
          </form>
        </Card> : null}
      </div>
      <Card>
        <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Hồ sơ gần đây</h2>
        {submissions.length === 0 ? <p className="mt-2 text-sm text-[var(--color-ink-500)]">Chưa có hồ sơ.</p> : <ul className="mt-3 divide-y divide-[var(--color-ink-100)]">{submissions.slice(0, 8).map((submission) => <li key={submission.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><Link href={`/dashboard/workflows/submissions/${submission.id}`} className="font-semibold text-[var(--color-ink-900)] hover:underline">{submission.template.name}</Link><p className="text-xs text-[var(--color-ink-500)]">{submission.owner.displayName}</p></div><Badge tone={submission.status === "APPROVED" ? "success" : submission.status === "REJECTED" ? "danger" : "warning"}>{submission.status}</Badge></li>)}</ul>}
      </Card>
    </div>
  );
}
