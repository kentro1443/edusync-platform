import Link from "next/link";

import { createCollectionAction } from "@/app/(app)/dashboard/resources/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { listBookmarkedResources, listResourceCollections } from "@/lib/resources/resource-service";

export default async function ResourceBookmarksPage({
  searchParams,
}: { searchParams: Promise<{ result?: string }> }) {
  const [{ actor }, params] = await Promise.all([
    requireSchoolContext(permissions.resourceRead),
    searchParams,
  ]);
  const [bookmarks, collections] = await Promise.all([
    listBookmarkedResources(actor),
    listResourceCollections(actor),
  ]);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Cá nhân" title="Tài nguyên đã lưu" description="Lưu tài liệu cần dùng lại, gom vào bộ sưu tập và truy cập nhanh trong cùng trường." actions={<LinkButton href="/dashboard/resources" variant="outline" size="sm">Về thư viện</LinkButton>} />
      {params.result ? <p role="status" className="rounded-[var(--radius-md)] bg-[var(--color-success-50)] px-4 py-3 text-sm text-[var(--color-success-700)]">Đã cập nhật bộ sưu tập.</p> : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_0.65fr]">
        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Dấu trang</h2>
          {bookmarks.length === 0 ? <EmptyState title="Chưa có tài nguyên đã lưu" description="Mở một tài nguyên và chọn Lưu tài nguyên để quay lại sau." /> : <ul className="mt-4 divide-y divide-[var(--color-ink-100)]">{bookmarks.map(({ resource }) => <li key={resource.id} className="py-4 first:pt-0 last:pb-0"><Link href={`/dashboard/resources/${resource.id}`} className="font-semibold text-[var(--color-brand-700)] hover:underline">{resource.title}</Link><p className="mt-1 text-sm text-[var(--color-ink-500)]">{resource.summary || "Chưa có mô tả."} · {resource.createdBy.displayName}</p></li>)}</ul>}
        </Card>
        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Bộ sưu tập</h2>
          {collections.length === 0 ? <p className="mt-2 text-sm text-[var(--color-ink-500)]">Tạo bộ sưu tập đầu tiên.</p> : <ul className="mt-4 space-y-3">{collections.map((collection) => <li key={collection.id} className="rounded-[var(--radius-md)] bg-[var(--color-ink-50)] p-3"><p className="font-semibold text-[var(--color-ink-800)]">{collection.name}</p><p className="mt-1 text-xs text-[var(--color-ink-500)]">{collection.items.length} tài nguyên</p></li>)}</ul>}
          <form action={createCollectionAction} className="mt-5 grid gap-3 border-t border-[var(--color-ink-100)] pt-5"><Field id="collection-name" label="Tên bộ sưu tập" required><Input id="collection-name" name="name" maxLength={80} required /></Field><Field id="collection-description" label="Mô tả"><Textarea id="collection-description" name="description" maxLength={300} /></Field><Button type="submit" size="sm">Tạo bộ sưu tập</Button></form>
        </Card>
      </div>
    </div>
  );
}
