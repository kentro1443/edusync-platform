import { notFound } from "next/navigation";

import { restoreSchoolAction, suspendSchoolAction } from "@/app/(app)/dashboard/platform/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { translatePlanCode } from "@/components/app/shell-utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { getPlatformSchool } from "@/lib/admin/platform-admin";
import { requirePlatformContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";

export default async function PlatformSchoolDetailPage({ params, searchParams }: { params: Promise<{ schoolId: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ schoolId }, query] = await Promise.all([params, searchParams]);
  const { actor } = await requirePlatformContext(permissions.platformSchoolRead);
  const school = await getPlatformSchool(actor, schoolId);
  if (!school) notFound();
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Phạm vi nền tảng" title={school.name} description={`Không gian trường · ${school.slug}`} actions={school.status === "ACTIVE" ? <form action={suspendSchoolAction}><input type="hidden" name="schoolId" value={school.id} /><Button type="submit" variant="danger">Tạm dừng trường</Button></form> : <form action={restoreSchoolAction}><input type="hidden" name="schoolId" value={school.id} /><Button type="submit">Khôi phục trường</Button></form>} />
      {query.created === "1" ? <Alert tone="success" title="Đã khởi tạo trường và gửi lời mời quản trị viên" /> : null}
      <Alert tone="warning" title="Đang thao tác ở phạm vi nền tảng">Tạm dừng trường sẽ thu hồi các phiên đăng nhập liên quan.</Alert>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-xs font-semibold uppercase text-[var(--color-ink-400)]">Trạng thái</p><div className="mt-3"><Badge tone={school.status === "ACTIVE" ? "success" : "danger"}>{school.status === "ACTIVE" ? "Hoạt động" : "Tạm dừng"}</Badge></div></Card>
        <Card><p className="text-xs font-semibold uppercase text-[var(--color-ink-400)]">Thành viên</p><p className="mt-2 text-3xl font-bold">{school._count.memberships}</p></Card>
        <Card><p className="text-xs font-semibold uppercase text-[var(--color-ink-400)]">Lời mời</p><p className="mt-2 text-3xl font-bold">{school._count.invitations}</p></Card>
        <Card><p className="text-xs font-semibold uppercase text-[var(--color-ink-400)]">Tệp lưu trữ</p><p className="mt-2 text-3xl font-bold">{school._count.storedFiles}</p></Card>
      </div>
      <Card><h2 className="text-lg font-bold">Cấu hình trường</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs uppercase text-[var(--color-ink-400)]">Tên rút gọn</dt><dd className="mt-1 font-medium">{school.shortName}</dd></div><div><dt className="text-xs uppercase text-[var(--color-ink-400)]">Gói</dt><dd className="mt-1 font-medium">{translatePlanCode(school.planCode)}</dd></div><div><dt className="text-xs uppercase text-[var(--color-ink-400)]">Dung lượng</dt><dd className="mt-1 font-medium">{Number(school.storageQuotaBytes / BigInt(1024 * 1024))} MB</dd></div><div><dt className="text-xs uppercase text-[var(--color-ink-400)]">Khởi tạo</dt><dd className="mt-1 font-medium">{school.createdAt.toLocaleString("vi-VN")}</dd></div></dl></Card>
    </div>
  );
}
