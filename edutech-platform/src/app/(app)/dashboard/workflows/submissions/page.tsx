import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { PageHeader } from "@/components/app/PageHeader";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { listWorkflowSubmissions } from "@/lib/workflows/workflow-service";

export default async function WorkflowSubmissionsPage() {
  const { actor } = await requireSchoolContext(permissions.workflowSubmissionRead);
  const submissions = await listWorkflowSubmissions(actor);
  return <div className="space-y-6"><PageHeader eyebrow="Hàng đợi quy trình" title="Hồ sơ cần xử lý" description="Tìm nhanh hồ sơ của bạn và các bước đang chờ vai trò hiện tại." actions={<div className="flex flex-wrap gap-2"><Link href="/dashboard/workflows/export" className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-ink-300)] bg-white px-3 text-sm font-semibold text-[var(--color-ink-800)] hover:bg-[var(--color-ink-50)]">Xuất CSV</Link><Link href="/dashboard/workflows" className="inline-flex min-h-10 items-center text-sm font-semibold text-[var(--color-brand-700)] hover:underline">Về mẫu quy trình</Link></div>} /><Card>{submissions.length === 0 ? <EmptyState title="Hàng đợi trống" description="Chưa có hồ sơ phù hợp với quyền của bạn." /> : <ul className="divide-y divide-[var(--color-ink-100)]">{submissions.map((submission) => <li key={submission.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-1 last:pb-1"><div><Link href={`/dashboard/workflows/submissions/${submission.id}`} className="font-semibold text-[var(--color-ink-900)] hover:text-[var(--color-brand-700)] hover:underline">{submission.template.name}</Link><p className="mt-1 text-sm text-[var(--color-ink-500)]">Người nộp: {submission.owner.displayName}</p></div><div className="flex items-center gap-3"><Badge tone={submission.status === "APPROVED" ? "success" : submission.status === "REJECTED" ? "danger" : "warning"}>{submission.status}</Badge><span className="text-xs text-[var(--color-ink-400)]">{submission.steps.filter((step) => step.status === "APPROVED").length}/{submission.steps.length} bước</span></div></li>)}</ul>}</Card></div>;
}
