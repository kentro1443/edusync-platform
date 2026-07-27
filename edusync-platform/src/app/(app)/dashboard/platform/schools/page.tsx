import Link from "next/link";

import { ProvisionSchoolDialog } from "@/app/(app)/dashboard/platform/schools/ProvisionSchoolDialog";
import { PageHeader } from "@/components/app/PageHeader";
import { translatePlanCode } from "@/components/app/shell-utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Input, Select } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Navigation";
import { listPlatformSchools } from "@/lib/admin/platform-admin";
import { requirePlatformContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";

export default async function PlatformSchoolsPage({ searchParams }: { searchParams: Promise<{ page?: string; query?: string; status?: string; result?: string }> }) {
  const params = await searchParams;
  const { actor } = await requirePlatformContext(permissions.platformSchoolRead);
  const data = await listPlatformSchools(actor, params);
  const rows = data.schools.map((school) => ({
    id: school.id,
    school: <div><Link href={`/dashboard/platform/schools/${school.id}`} className="font-semibold hover:underline">{school.name}</Link><p className="mt-0.5 text-xs font-normal text-[var(--color-ink-500)]">{school.slug}</p></div>,
    plan: translatePlanCode(school.planCode),
    members: school._count.memberships,
    status: <Badge tone={school.status === "ACTIVE" ? "success" : school.status === "SUSPENDED" ? "danger" : "neutral"}>{school.status === "ACTIVE" ? "Hoạt động" : school.status === "SUSPENDED" ? "Tạm dừng" : "Lưu trữ"}</Badge>,
  }));
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Phạm vi nền tảng" title="Danh mục trường" description="Khởi tạo và quản lý vòng đời không gian trường. Mọi thao tác tại đây ảnh hưởng toàn trường." actions={<ProvisionSchoolDialog />} />
      <Alert tone="warning" title="Cảnh báo phạm vi nền tảng">Kiểm tra đúng trường trước khi tạm dừng hoặc thay đổi cấu hình.</Alert>
      {params.result === "invalid" ? <Alert tone="danger" title="Thông tin trường chưa hợp lệ" /> : params.result === "duplicate" ? <Alert tone="warning" title="Định danh trường đã tồn tại" /> : null}
      <Card><form method="get" action="/dashboard/platform/schools" className="grid gap-3 sm:grid-cols-[1fr_13rem_auto]"><Input name="query" defaultValue={params.query} placeholder="Tìm tên hoặc định danh trường" aria-label="Tìm trường" /><Select name="status" defaultValue={params.status ?? ""} aria-label="Lọc trạng thái"><option value="">Mọi trạng thái</option><option value="ACTIVE">Hoạt động</option><option value="SUSPENDED">Tạm dừng</option><option value="ARCHIVED">Lưu trữ</option></Select><Button type="submit" variant="outline">Lọc</Button></form></Card>
      {rows.length ? <><DataTable caption="Danh mục trường" rows={rows} columns={[{ key: "school", header: "Trường", primary: true }, { key: "plan", header: "Gói" }, { key: "members", header: "Thành viên" }, { key: "status", header: "Trạng thái" }]} /><Pagination currentPage={data.page} totalPages={data.totalPages} hrefForPage={(page) => `/dashboard/platform/schools?page=${page}&query=${encodeURIComponent(params.query ?? "")}&status=${encodeURIComponent(params.status ?? "")}`} /></> : <EmptyState title="Không tìm thấy trường" description="Thử thay đổi bộ lọc hoặc khởi tạo trường mới." />}
    </div>
  );
}
