import { notFound } from "next/navigation";

import { reactivateMembershipAction, suspendMembershipAction } from "@/app/(app)/dashboard/admin/actions";
import { RoleAssignmentDialog } from "@/app/(app)/dashboard/admin/members/MemberDialogs";
import { PageHeader } from "@/components/app/PageHeader";
import { translateAuditAction, translateMembershipStatus, translateRole } from "@/components/app/shell-utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Timeline } from "@/components/ui/Navigation";
import { getSchoolMembership } from "@/lib/admin/school-admin";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export default async function MembershipDetailPage({ params }: { params: Promise<{ membershipId: string }> }) {
  const { membershipId } = await params;
  const { actor, school } = await requireSchoolContext(permissions.schoolUserRead);
  const membership = await getSchoolMembership(actor, membershipId);
  if (!membership) notFound();
  const events = await db.auditEvent.findMany({
    where: { schoolId: actor.schoolId, entityType: "SchoolMembership", entityId: membership.id },
    select: { id: true, action: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={school.schoolName} title={membership.user.displayName} description={membership.user.email} actions={<><RoleAssignmentDialog membershipId={membership.id} displayName={membership.user.displayName} roles={membership.roleAssignments.map(({ role }) => role)} lockSchoolAdmin={membership.id === actor.membershipId} />{membership.id !== actor.membershipId ? membership.status === "ACTIVE" ? <form action={suspendMembershipAction}><input type="hidden" name="membershipId" value={membership.id} /><Button type="submit" variant="danger">Tạm dừng thành viên</Button></form> : <form action={reactivateMembershipAction}><input type="hidden" name="membershipId" value={membership.id} /><Button type="submit">Kích hoạt lại</Button></form> : null}</>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <Card>
          <h2 className="text-lg font-bold">Thông tin thành viên</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs font-semibold uppercase text-[var(--color-ink-400)]">Trạng thái</dt><dd className="mt-1"><Badge tone={membership.status === "ACTIVE" ? "success" : membership.status === "SUSPENDED" ? "danger" : "neutral"}>{translateMembershipStatus(membership.status)}</Badge></dd></div>
            <div><dt className="text-xs font-semibold uppercase text-[var(--color-ink-400)]">Đăng nhập gần nhất</dt><dd className="mt-1 text-sm font-medium">{membership.user.lastLoginAt?.toLocaleString("vi-VN") ?? "Chưa đăng nhập"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase text-[var(--color-ink-400)]">Vai trò</dt><dd className="mt-2 flex flex-wrap gap-2">{membership.roleAssignments.map(({ role }) => <Badge key={role} tone="brand">{translateRole(role)}</Badge>)}</dd></div>
          </dl>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Lịch sử quản trị</h2>
          {events.length ? <Timeline className="mt-5" items={events.map((event) => ({ id: event.id, title: translateAuditAction(event.action), datetime: event.createdAt.toISOString(), displayTime: event.createdAt.toLocaleString("vi-VN") }))} /> : <p className="mt-4 text-sm text-[var(--color-ink-500)]">Chưa có thay đổi quản trị.</p>}
        </Card>
      </div>
    </div>
  );
}
