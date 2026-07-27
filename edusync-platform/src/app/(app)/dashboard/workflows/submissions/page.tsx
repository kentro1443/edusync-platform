import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { PageHeader } from "@/components/app/PageHeader";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { listWorkflowSubmissions } from "@/lib/workflows/workflow-service";

const dueFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });
const STATUS_FILTERS = [
  { id: "", label: "Tất cả" },
  { id: "IN_REVIEW", label: "Đang duyệt" },
  { id: "CHANGES_REQUESTED", label: "Cần chỉnh sửa" },
  { id: "APPROVED", label: "Đã duyệt" },
  { id: "REJECTED", label: "Từ chối" },
];

export default async function WorkflowSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ actor }, params] = await Promise.all([
    requireSchoolContext(permissions.workflowSubmissionRead),
    searchParams,
  ]);
  const all = await listWorkflowSubmissions(actor);
  const status = params.status ?? "";
  const submissions = status ? all.filter((s) => s.status === status) : all;
  const now = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hàng đợi quy trình"
        title="Hồ sơ cần xử lý"
        description="Lọc theo trạng thái, theo dõi hạn xử lý của bước đang chờ và những hồ sơ đã quá hạn."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/workflows/export" className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-ink-300)] bg-white px-3 text-sm font-semibold text-[var(--color-ink-800)] hover:bg-[var(--color-ink-50)]">Xuất CSV</Link>
            <Link href="/dashboard/workflows" className="inline-flex min-h-10 items-center text-sm font-semibold text-[var(--color-brand-700)] hover:underline">Về mẫu quy trình</Link>
          </div>
        }
      />
      <nav aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = filter.id === status;
          return (
            <Link
              key={filter.id || "all"}
              href={`/dashboard/workflows/submissions${filter.id ? `?status=${filter.id}` : ""}`}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${active ? "bg-[var(--color-brand-700)] text-white" : "border border-[var(--color-ink-200)] text-[var(--color-ink-600)] hover:bg-[var(--color-ink-50)]"}`}
              aria-current={active ? "page" : undefined}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>
      <Card>
        {submissions.length === 0 ? (
          <EmptyState title="Hàng đợi trống" description="Chưa có hồ sơ phù hợp với bộ lọc và quyền của bạn." />
        ) : (
          <ul className="divide-y divide-[var(--color-ink-100)]">
            {submissions.map((submission) => {
              const activeStep = submission.steps.find((step) => step.status === "ACTIVE");
              const overdue = activeStep?.dueAt ? activeStep.dueAt.getTime() < now.getTime() : false;
              const escalated = submission.steps.some((step) => step.escalatedAt !== null && step.status === "ACTIVE");
              return (
                <li key={submission.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-1 last:pb-1">
                  <div>
                    <Link href={`/dashboard/workflows/submissions/${submission.id}`} className="font-semibold text-[var(--color-ink-900)] hover:text-[var(--color-brand-700)] hover:underline">{submission.template.name}</Link>
                    <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                      Người nộp: {submission.owner.displayName}
                      {activeStep ? ` · Bước: ${activeStep.step.name}` : ""}
                      {activeStep?.dueAt ? ` · Hạn ${dueFormat.format(activeStep.dueAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {escalated ? <Badge tone="danger">Đã báo quá hạn</Badge> : overdue ? <Badge tone="danger">Quá hạn</Badge> : null}
                    <Badge tone={submission.status === "APPROVED" ? "success" : submission.status === "REJECTED" ? "danger" : "warning"}>{submission.status}</Badge>
                    <span className="text-xs text-[var(--color-ink-400)]">{submission.steps.filter((step) => step.status === "APPROVED").length}/{submission.steps.length} bước</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
