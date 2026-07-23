import Link from "next/link";

import { createClubAction } from "@/app/(app)/dashboard/clubs-events/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { listClubEvents, listClubs } from "@/lib/clubs/club-service";

const dateTime = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ClubsEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; error?: string }>;
}) {
  const [{ actor }, params] = await Promise.all([
    requireSchoolContext(permissions.clubRead),
    searchParams,
  ]);
  const [clubs, events] = await Promise.all([listClubs(actor), listClubEvents(actor)]);
  const canCreate = actor.schoolRoles.some((role) =>
    ["SCHOOL_ADMIN", "TEACHER_STAFF", "CLUB_LEADER", "STUDENT"].includes(role),
  );
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CLB & sự kiện"
        title="Hoạt động học sinh có tổ chức"
        description="Từ đăng ký thành viên đến duyệt sự kiện, mọi bước có người phụ trách và trạng thái rõ ràng."
        actions={<LinkButton href="/dashboard/calendar" variant="outline" size="sm">Xem lịch trường</LinkButton>}
      />
      {params.result ? <Alert tone="success" title="Đã cập nhật">Thay đổi đã được lưu.</Alert> : null}
      {params.error ? <Alert tone="danger" title="Không thể cập nhật">Kiểm tra dữ liệu hoặc quyền truy cập.</Alert> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-ink-100)] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Câu lạc bộ đang hoạt động</h2>
              <p className="mt-1 text-sm text-[var(--color-ink-500)]">{clubs.length} câu lạc bộ trong trường</p>
            </div>
            <Badge tone="brand">Phạm vi trường</Badge>
          </div>
          {clubs.length === 0 ? (
            <EmptyState title="Chưa có câu lạc bộ" description="Tạo CLB đầu tiên để bắt đầu quản lý thành viên và hoạt động." />
          ) : (
            <ul className="divide-y divide-[var(--color-ink-100)]">
              {clubs.map((club) => (
                <li key={club.id} className="py-4 first:pt-2 last:pb-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-700)]">
                        {club.status === "ACTIVE" ? "Đang hoạt động" : "Bản nháp"}
                      </p>
                      <h3 className="mt-1 text-base font-bold text-[var(--color-ink-900)]">
                        <Link href={`/dashboard/clubs-events/${club.id}`} className="hover:text-[var(--color-brand-700)] hover:underline">{club.name}</Link>
                      </h3>
                      <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                        {club._count.memberships} thành viên · {club._count.events} sự kiện · {club._count.applications} đơn chờ
                      </p>
                    </div>
                    <Badge tone={club.status === "ACTIVE" ? "success" : "neutral"}>{club.status === "ACTIVE" ? "Mở" : "Nháp"}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Sự kiện sắp tới</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-ink-500)]">Theo dõi hoạt động đã duyệt và chỗ còn lại.</p>
          {events.length === 0 ? (
            <EmptyState title="Chưa có sự kiện" description="Sự kiện đã duyệt sẽ hiển thị tại đây." />
          ) : (
            <ul className="mt-4 space-y-3">
              {events.slice(0, 6).map((event) => (
                <li key={event.id} className="rounded-[var(--radius-md)] border border-[var(--color-ink-100)] p-3">
                  <p className="text-xs font-semibold text-[var(--color-brand-700)]">{dateTime.format(event.startsAt)}</p>
                  <p className="mt-1 font-semibold text-[var(--color-ink-900)]">{event.title}</p>
                  <p className="mt-1 text-xs text-[var(--color-ink-500)]">{event.club.name} · {event._count.registrations} lượt đăng ký</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {canCreate ? (
        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Tạo câu lạc bộ</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">CLB mới ở trạng thái mở hoặc bản nháp tùy lựa chọn.</p>
          <form action={createClubAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <Field id="name" label="Tên câu lạc bộ" required><Input id="name" name="name" required maxLength={120} placeholder="Ví dụ: Robotics Lab" /></Field>
            <Field id="capacity" label="Sức chứa (tùy chọn)"><Input id="capacity" name="capacity" type="number" min="1" max="10000" /></Field>
            <Field id="description" label="Mô tả" className="md:col-span-2"><Textarea id="description" name="description" rows={3} maxLength={2000} /></Field>
            <label className="flex items-center gap-2 text-sm text-[var(--color-ink-700)] md:col-span-2"><input type="checkbox" name="publish" /> Mở đăng ký ngay sau khi tạo</label>
            <Button type="submit" className="md:col-span-2 md:w-fit">Tạo câu lạc bộ</Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}

