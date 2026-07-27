import Link from "next/link";

import {
  createParentLinkAction,
  reactivateMembershipAction,
  resendInvitationAction,
  revokeInvitationAction,
  revokeParentLinkAction,
  suspendMembershipAction,
} from "@/app/(app)/dashboard/admin/actions";
import { InviteMemberDialog, RoleAssignmentDialog } from "@/app/(app)/dashboard/admin/members/MemberDialogs";
import { PageHeader } from "@/components/app/PageHeader";
import { translateMembershipStatus, translateRole } from "@/components/app/shell-utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Input, Select } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Navigation";
import {
  listParentStudentCandidates,
  listParentStudentLinks,
  listSchoolInvitations,
  listSchoolMembers,
} from "@/lib/admin/school-admin";
import { requireSchoolContext } from "@/lib/auth/guards";
import { getInvitationLifecycle } from "@/lib/auth/invitation";
import { permissions } from "@/lib/auth/permissions";
import type { SchoolRole } from "@/generated/prisma/enums";

const resultMessages: Record<string, { tone: "success" | "danger" | "warning"; title: string }> = {
  invited: { tone: "success", title: "Đã tạo và gửi lời mời" },
  invalid: { tone: "danger", title: "Email hoặc vai trò chưa hợp lệ" },
  "member-exists": { tone: "warning", title: "Người dùng đã là thành viên hoạt động" },
  "rate-limited": { tone: "warning", title: "Đã gửi quá nhiều lời mời; vui lòng thử lại sau" },
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; query?: string; status?: string; result?: string }>;
}) {
  const params = await searchParams;
  const { actor, school } = await requireSchoolContext(permissions.schoolUserRead);
  const [memberData, invitations, links, candidates] = await Promise.all([
    listSchoolMembers(actor, params),
    listSchoolInvitations(actor),
    listParentStudentLinks(actor),
    listParentStudentCandidates(actor),
  ]);
  const rows = memberData.members.map((membership) => ({
    id: membership.id,
    member: <div><Link href={`/dashboard/admin/members/${membership.id}`} className="font-semibold text-[var(--color-ink-900)] hover:underline">{membership.user.displayName}</Link><p className="mt-0.5 text-xs font-normal text-[var(--color-ink-500)]">{membership.user.email}</p></div>,
    roles: membership.roleAssignments.map(({ role }) => translateRole(role)).join(", "),
    status: <Badge tone={membership.status === "ACTIVE" ? "success" : membership.status === "SUSPENDED" ? "danger" : "neutral"}>{translateMembershipStatus(membership.status)}</Badge>,
  }));
  const memberById = new Map(
    memberData.members.map((membership) => [membership.id, membership]),
  );
  const feedback = params.result ? resultMessages[params.result] : undefined;
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={school.schoolName} title="Thành viên & phân quyền" description="Quản lý lời mời, tư cách thành viên, vai trò và liên kết phụ huynh–học sinh trong đúng phạm vi trường." actions={<InviteMemberDialog />} />
      {feedback ? <Alert tone={feedback.tone} title={feedback.title} /> : null}

      <Card>
        <form className="grid gap-3 sm:grid-cols-[1fr_13rem_auto]" action="/dashboard/admin/members" method="get">
          <Input name="query" defaultValue={params.query} placeholder="Tìm theo tên hoặc email" aria-label="Tìm thành viên" />
          <Select name="status" defaultValue={params.status ?? ""} aria-label="Lọc trạng thái"><option value="">Mọi trạng thái</option><option value="ACTIVE">Hoạt động</option><option value="SUSPENDED">Tạm dừng</option><option value="INVITED">Đã mời</option><option value="LEFT">Đã rời trường</option></Select>
          <Button type="submit" variant="outline">Lọc</Button>
        </form>
      </Card>

      {rows.length ? (
        <>
          <DataTable
            caption="Danh sách thành viên"
            rows={rows}
            columns={[{ key: "member", header: "Thành viên", primary: true }, { key: "roles", header: "Vai trò" }, { key: "status", header: "Trạng thái" }]}
            rowActions={(row) => {
              const membership = memberById.get(row.id);
              if (!membership) return null;
              return <div className="flex flex-wrap justify-end gap-1"><RoleAssignmentDialog membershipId={membership.id} displayName={membership.user.displayName} roles={membership.roleAssignments.map(({ role }) => role) as SchoolRole[]} lockSchoolAdmin={membership.id === actor.membershipId} />{membership.id !== actor.membershipId ? membership.status === "ACTIVE" ? <form action={suspendMembershipAction}><input type="hidden" name="membershipId" value={membership.id} /><Button type="submit" variant="ghost" size="sm">Tạm dừng</Button></form> : <form action={reactivateMembershipAction}><input type="hidden" name="membershipId" value={membership.id} /><Button type="submit" variant="ghost" size="sm">Kích hoạt</Button></form> : null}</div>;
            }}
          />
          <Pagination currentPage={memberData.page} totalPages={memberData.totalPages} hrefForPage={(page) => `/dashboard/admin/members?page=${page}&query=${encodeURIComponent(params.query ?? "")}&status=${encodeURIComponent(params.status ?? "")}`} />
        </>
      ) : <EmptyState title="Không tìm thấy thành viên" description="Thử thay đổi từ khóa/bộ lọc hoặc mời thành viên mới." />}

      <section aria-labelledby="invitations-heading" className="space-y-4">
        <h2 id="invitations-heading" className="text-xl font-bold">Lời mời gần đây</h2>
        <Card className="overflow-x-auto p-0">
          {invitations.length ? <ul className="divide-y divide-[var(--color-ink-200)]">{invitations.map((invitation) => { const lifecycle = getInvitationLifecycle(invitation); return <li key={invitation.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{invitation.email}</p><p className="mt-1 text-xs text-[var(--color-ink-500)]">{Array.isArray(invitation.roleHintsJson) ? invitation.roleHintsJson.filter((role): role is string => typeof role === "string").map(translateRole).join(", ") : "Chưa có vai trò"} · Gửi {invitation.sendCount} lần</p></div><div className="flex items-center gap-2"><Badge tone={lifecycle === "pending" ? "success" : lifecycle === "expired" ? "warning" : "neutral"}>{lifecycle === "pending" ? "Đang chờ" : lifecycle === "expired" ? "Hết hạn" : lifecycle === "accepted" ? "Đã chấp nhận" : "Đã thu hồi"}</Badge>{lifecycle === "pending" || lifecycle === "expired" ? <form action={resendInvitationAction}><input type="hidden" name="invitationId" value={invitation.id} /><Button size="sm" variant="ghost">Gửi lại</Button></form> : null}{lifecycle === "pending" ? <form action={revokeInvitationAction}><input type="hidden" name="invitationId" value={invitation.id} /><Button size="sm" variant="ghost">Thu hồi</Button></form> : null}</div></li>; })}</ul> : <EmptyState title="Chưa có lời mời" description="Lời mời thành viên sẽ xuất hiện tại đây." />}
        </Card>
      </section>

      <section aria-labelledby="parent-links-heading" className="space-y-4">
        <h2 id="parent-links-heading" className="text-xl font-bold">Liên kết phụ huynh–học sinh</h2>
        <Card>
          <form action={createParentLinkAction} className="grid gap-3 lg:grid-cols-[1fr_1fr_12rem_auto]">
            <Select name="parentUserId" required defaultValue="" aria-label="Chọn phụ huynh"><option value="" disabled>Chọn phụ huynh</option>{candidates.parents.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}</Select>
            <Select name="studentUserId" required defaultValue="" aria-label="Chọn học sinh"><option value="" disabled>Chọn học sinh</option>{candidates.students.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}</Select>
            <Input name="relationshipType" defaultValue="Phụ huynh" aria-label="Quan hệ" />
            <Button type="submit">Tạo liên kết</Button>
          </form>
          {links.length ? <ul className="mt-6 divide-y divide-[var(--color-ink-200)] border-t">{links.map((link) => <li key={link.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm"><span className="font-semibold">{link.parent.displayName}</span> — {link.relationshipType} của <span className="font-semibold">{link.student.displayName}</span></p><div className="flex items-center gap-2"><Badge tone={link.status === "ACTIVE" ? "success" : "neutral"}>{link.status === "ACTIVE" ? "Hoạt động" : "Đã thu hồi"}</Badge>{link.status === "ACTIVE" ? <form action={revokeParentLinkAction}><input type="hidden" name="linkId" value={link.id} /><Button type="submit" variant="ghost" size="sm">Thu hồi</Button></form> : null}</div></li>)}</ul> : null}
        </Card>
      </section>
    </div>
  );
}
