import {
  applyToClubAction,
  approveClubEventAction,
  createClubEventAction,
  reviewClubApplicationAction,
  registerClubEventAction,
} from "@/app/(app)/dashboard/clubs-events/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { getClub } from "@/lib/clubs/club-service";

const dateTime = new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeStyle: "short" });

export default async function ClubDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubId: string }>;
  searchParams: Promise<{ result?: string; error?: string }>;
}) {
  const [{ clubId }, query] = await Promise.all([params, searchParams]);
  const { actor } = await requireSchoolContext(permissions.clubRead);
  const club = await getClub(actor, clubId);
  const canReview = club.canManage;
  const canCreateEvent = club.canManage;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Câu lạc bộ" title={club.name} description={club.description ?? "Không có mô tả."} actions={<LinkButton href="/dashboard/clubs-events" variant="outline" size="sm">Quay lại danh sách</LinkButton>} />
      {query.result ? <Alert tone="success" title="Đã cập nhật">Thay đổi đã được lưu.</Alert> : null}
      {query.error ? <Alert tone="danger" title="Không thể cập nhật">Kiểm tra dữ liệu hoặc quyền truy cập.</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Thành viên</h2>
            <Badge tone="brand">{club.memberships.length} đang hoạt động</Badge>
          </div>
          {club.memberships.length === 0 ? <EmptyState title="Chưa có thành viên" description="Đơn được duyệt sẽ xuất hiện ở đây." /> : <ul className="mt-4 divide-y divide-[var(--color-ink-100)]">{club.memberships.map((membership) => <li key={membership.id} className="flex items-center justify-between gap-3 py-3"><p className="font-semibold">{membership.user.displayName}</p><Badge tone={membership.role === "LEADER" ? "warning" : "neutral"}>{membership.role}</Badge></li>)}</ul>}
        </Card>
        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Đơn tham gia chờ duyệt</h2>
          {club.applications.length === 0 ? <EmptyState title="Không có đơn chờ" description="Đơn mới sẽ được đưa vào hàng đợi." /> : <ul className="mt-4 space-y-3">{club.applications.map((application) => <li key={application.id} className="rounded-[var(--radius-md)] border border-[var(--color-ink-100)] p-3"><p className="font-semibold">{application.applicant.displayName}</p><p className="mt-1 text-xs text-[var(--color-ink-500)]">{application.motivation || "Không có lời nhắn."}</p>{canReview ? <div className="mt-3 flex gap-2"><form action={reviewClubApplicationAction}><input type="hidden" name="clubId" value={club.id} /><input type="hidden" name="applicationId" value={application.id} /><input type="hidden" name="decision" value="approve" /><Button size="sm" type="submit">Duyệt</Button></form><form action={reviewClubApplicationAction}><input type="hidden" name="clubId" value={club.id} /><input type="hidden" name="applicationId" value={application.id} /><input type="hidden" name="decision" value="reject" /><Button size="sm" type="submit" variant="outline">Từ chối</Button></form></div> : <Badge tone="warning" className="mt-3">Đơn đang chờ duyệt</Badge>}</li>)}</ul>}
          {club.canApply ? <form action={applyToClubAction} className="mt-5 border-t border-[var(--color-ink-100)] pt-5"><input type="hidden" name="clubId" value={club.id} /><Field id="motivation" label="Lời nhắn đăng ký"><Textarea id="motivation" name="motivation" rows={2} maxLength={500} placeholder="Bạn muốn đóng góp gì cho CLB?" /></Field><Button type="submit" variant="outline" className="mt-3">Gửi đơn tham gia</Button></form> : null}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Sự kiện</h2>
          {club.events.length === 0 ? <EmptyState title="Chưa có sự kiện" description="Tạo đề xuất đầu tiên để bắt đầu." /> : <ul className="mt-4 divide-y divide-[var(--color-ink-100)]">{club.events.map((event) => <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{event.title}</p><p className="mt-1 text-xs text-[var(--color-ink-500)]">{dateTime.format(event.startsAt)} · {event._count.registrations} đăng ký{event.capacity ? ` / ${event.capacity}` : ""}</p></div><div className="flex items-center gap-2"><Badge tone={event.status === "APPROVED" ? "success" : "warning"}>{event.status === "APPROVED" ? "Đã duyệt" : "Chờ duyệt"}</Badge>{event.status === "APPROVED" && club.canRegisterEvents ? <form action={registerClubEventAction}><input type="hidden" name="clubId" value={club.id} /><input type="hidden" name="eventId" value={event.id} /><Button size="sm" variant="outline" type="submit">Đăng ký</Button></form> : event.status === "PENDING_APPROVAL" && club.canApproveEvents ? <form action={approveClubEventAction}><input type="hidden" name="clubId" value={club.id} /><input type="hidden" name="eventId" value={event.id} /><input type="hidden" name="decision" value="approve" /><Button size="sm" type="submit">Duyệt</Button></form> : null}</div></li>)}</ul>}
        </Card>
        {canCreateEvent ? <Card><h2 className="text-lg font-bold text-[var(--color-ink-900)]">Tạo đề xuất sự kiện</h2><form action={createClubEventAction} className="mt-4 space-y-4"><input type="hidden" name="clubId" value={club.id} /><Field id="title" label="Tên sự kiện" required><Input id="title" name="title" required maxLength={160} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field id="startsAt" label="Bắt đầu" required><Input id="startsAt" name="startsAt" type="datetime-local" required /></Field><Field id="endsAt" label="Kết thúc" required><Input id="endsAt" name="endsAt" type="datetime-local" required /></Field></div><Field id="location" label="Địa điểm"><Input id="location" name="location" /></Field><Field id="capacity" label="Sức chứa"><Input id="capacity" name="capacity" type="number" min="0" max="10000" defaultValue="0" /></Field><Field id="description" label="Mô tả"><Textarea id="description" name="description" rows={3} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="submitForApproval" defaultChecked /> Gửi duyệt ngay</label><Button type="submit" className="w-full">Tạo đề xuất</Button></form></Card> : null}
      </div>
    </div>
  );
}
