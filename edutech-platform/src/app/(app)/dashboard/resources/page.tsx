import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { Input, Select } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { listResources } from "@/lib/resources/resource-service";

const statusLabels = {
  DRAFT: "Bản nháp",
  PENDING_REVIEW: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  REJECTED: "Cần chỉnh sửa",
  ARCHIVED: "Đã lưu trữ",
} as const;

function tone(status: keyof typeof statusLabels) {
  return status === "PUBLISHED" ? "success" : status === "PENDING_REVIEW" ? "warning" : status === "REJECTED" ? "danger" : "neutral";
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: keyof typeof statusLabels; error?: string }>;
}) {
  const [{ actor }, params] = await Promise.all([
    requireSchoolContext(permissions.resourceRead),
    searchParams,
  ]);
  const resources = await listResources(actor, { query: params.query, status: params.status });
  const canCreate = actor.schoolRoles.some((role) => ["SCHOOL_ADMIN", "TEACHER_STAFF", "MENTOR_COUNSELOR"].includes(role));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Thư viện tài nguyên"
        title="Kho tài liệu của trường"
        description="Tìm, đọc và chia sẻ tài nguyên học tập trong phạm vi được cấp quyền. File riêng tư luôn qua kiểm tra tenant và vai trò."
        actions={<div className="flex flex-wrap gap-2"><LinkButton href="/dashboard/resources/bookmarks" variant="outline" size="sm">Đã lưu</LinkButton>{canCreate ? <LinkButton href="/dashboard/resources/new" size="sm">Tạo tài nguyên</LinkButton> : null}</div>}
      />

      <Card>
        <form method="get" className="grid gap-4 md:grid-cols-[1fr_12rem_auto] md:items-end">
          <div>
            <label htmlFor="query" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-800)]">Tìm tài nguyên</label>
            <Input id="query" name="query" defaultValue={params.query} placeholder="Ví dụ: kế hoạch học tập" />
          </div>
          <div>
            <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-800)]">Trạng thái</label>
            <Select id="status" name="status" defaultValue={params.status ?? ""}>
              <option value="">Tất cả tài nguyên được phép xem</option>
              {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </Select>
          </div>
          <Button type="submit" variant="outline">Lọc thư viện</Button>
        </form>
      </Card>

      {params.error ? <p role="alert" className="rounded-[var(--radius-md)] border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] px-4 py-3 text-sm text-[var(--color-danger-700)]">Không thể thực hiện thao tác tài nguyên.</p> : null}

      {resources.length === 0 ? (
        <Card><EmptyState title="Chưa có tài nguyên phù hợp" description="Thử đổi từ khóa hoặc tạo tài nguyên đầu tiên cho trường." action={canCreate ? <LinkButton href="/dashboard/resources/new" size="sm">Tạo tài nguyên</LinkButton> : undefined} /></Card>
      ) : (
        <section aria-labelledby="resource-list-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="resource-list-heading" className="text-lg font-bold text-[var(--color-ink-900)]">{resources.length} tài nguyên</h2>
            <Badge tone="brand">Tenant-scoped</Badge>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => (
              <Card key={resource.id} className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-[var(--color-brand-50)] px-2.5 py-1 text-xs font-semibold text-[var(--color-brand-800)]">{resource.categories[0]?.name ?? "Chưa phân loại"}</span>
                  <Badge tone={tone(resource.status)}>{statusLabels[resource.status]}</Badge>
                </div>
                <Link href={`/dashboard/resources/${resource.id}`} className="mt-5 text-lg font-bold text-[var(--color-ink-900)] hover:text-[var(--color-brand-700)] hover:underline">{resource.title}</Link>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-ink-500)]">{resource.summary || "Chưa có mô tả."}</p>
                <div className="mt-4 flex flex-wrap gap-2">{resource.tags.map((tag) => <span key={tag.id} className="rounded-full bg-[var(--color-ink-100)] px-2 py-1 text-xs text-[var(--color-ink-600)]">#{tag.name}</span>)}</div>
                <div className="mt-auto border-t border-[var(--color-ink-100)] pt-4 text-xs text-[var(--color-ink-500)]">
                  <p>{resource.createdBy.displayName} · {resource.currentVersion ? `Phiên bản ${resource.currentVersion.versionNumber}` : "Chưa có phiên bản"}</p>
                  <p className="mt-1">{resource.analyticsCounter?.views ?? 0} lượt xem · {resource.analyticsCounter?.downloads ?? 0} lượt tải</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
