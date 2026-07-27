import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { LinkButton } from "@/components/ui/Button";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { listResourceModerationQueue } from "@/lib/resources/resource-service";

export default async function ResourceModerationPage() {
  const { actor } = await requireSchoolContext(permissions.resourceReview);
  const queue = await listResourceModerationQueue(actor);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Kiểm duyệt" title="Hàng đợi tài nguyên" description="Xem nội dung chờ duyệt trong trường hiện tại. Mọi quyết định được ghi audit và outbox." actions={<LinkButton href="/dashboard/resources" variant="outline" size="sm">Về thư viện</LinkButton>} />
      <Card>
        {queue.length === 0 ? <EmptyState title="Hàng đợi đang trống" description="Khi tác giả gửi tài nguyên, nội dung sẽ xuất hiện ở đây." /> : <div className="divide-y divide-[var(--color-ink-100)]">{queue.map((resource) => <div key={resource.id} className="flex flex-wrap items-center justify-between gap-4 py-5 first:pt-0 last:pb-0"><div><Link href={`/dashboard/resources/${resource.id}`} className="font-semibold text-[var(--color-brand-700)] hover:underline">{resource.title}</Link><p className="mt-1 text-sm text-[var(--color-ink-500)]">{resource.createdBy.displayName} · Phiên bản {resource.currentVersion?.versionNumber ?? "—"}</p></div><Badge tone="warning">Chờ duyệt</Badge></div>)}</div>}
      </Card>
    </div>
  );
}
