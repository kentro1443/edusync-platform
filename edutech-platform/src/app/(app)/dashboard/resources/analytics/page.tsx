import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { LinkButton } from "@/components/ui/Button";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { getResourceAnalytics, listResources } from "@/lib/resources/resource-service";

export default async function ResourceAnalyticsPage() {
  const { actor } = await requireSchoolContext(permissions.resourceAnalyticsRead);
  const resources = await listResources(actor, { status: "PUBLISHED" });
  const analytics = await Promise.all(resources.map((resource) => getResourceAnalytics(actor, resource.id)));
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Phân tích tài nguyên" title="Mức độ sử dụng thư viện" description="Counter được cập nhật từ event view, preview, download, bookmark và tương tác trong tenant." actions={<LinkButton href="/dashboard/resources" variant="outline" size="sm">Về thư viện</LinkButton>} />
      {analytics.length === 0 ? <Card><EmptyState title="Chưa có dữ liệu xuất bản" description="Xuất bản một tài nguyên để bắt đầu đo lường." /></Card> : <div className="grid gap-5 md:grid-cols-2">{analytics.map(({ resource }) => <Card key={resource.id}><div className="flex items-start justify-between gap-3"><Link href={`/dashboard/resources/${resource.id}`} className="font-semibold text-[var(--color-brand-700)] hover:underline">{resource.title}</Link><Badge tone="success">Đã xuất bản</Badge></div><div className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4"><Metric label="Lượt xem" value={resource.analyticsCounter?.views ?? 0} /><Metric label="Lượt tải" value={resource.analyticsCounter?.downloads ?? 0} /><Metric label="Lưu" value={resource.analyticsCounter?.bookmarks ?? 0} /><Metric label="Bình luận" value={resource.analyticsCounter?.comments ?? 0} /></div></Card>)}</div>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-[var(--radius-md)] bg-[var(--color-ink-50)] p-3"><p className="text-2xl font-bold text-[var(--color-brand-800)]">{value}</p><p className="mt-1 text-xs text-[var(--color-ink-500)]">{label}</p></div>;
}
