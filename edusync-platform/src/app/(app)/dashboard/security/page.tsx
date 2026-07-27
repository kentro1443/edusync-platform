import Link from "next/link";

import {
  revokeAllSessionsAction,
  revokeOtherSessionsAction,
  revokeSessionAction,
} from "@/app/(app)/dashboard/security/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { translateAuditAction } from "@/components/app/shell-utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { listUserSessions } from "@/lib/auth/session";
import { db } from "@/lib/db";

function describeDevice(userAgent: string | null): string {
  if (!userAgent) return "Thiết bị không xác định";
  if (/Mobile|Android|iPhone/i.test(userAgent)) return "Thiết bị di động";
  if (/Macintosh|Mac OS/i.test(userAgent)) return "Máy Mac";
  if (/Windows/i.test(userAgent)) return "Máy tính Windows";
  return "Trình duyệt web";
}

export default async function SecurityPage() {
  const session = await requireAuthenticatedSession("/dashboard/security");
  const [sessions, events] = await Promise.all([
    listUserSessions(session.user.id),
    db.auditEvent.findMany({
      where: { actorUserId: session.user.id, action: { startsWith: "AUTH_" } },
      select: { id: true, action: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Tài khoản" title="Bảo mật & phiên đăng nhập" description="Kiểm tra thiết bị đang đăng nhập và thu hồi phiên không còn sử dụng." actions={<Link href="/doi-mat-khau" className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-brand-700)] px-4 text-sm font-semibold text-white">Đổi mật khẩu</Link>} />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-bold">Phiên đang hoạt động</h2><p className="mt-1 text-sm text-[var(--color-ink-500)]">{sessions.length} phiên chưa bị thu hồi.</p></div>
          <form action={revokeOtherSessionsAction}><Button type="submit" variant="secondary">Đăng xuất thiết bị khác</Button></form>
        </div>
        <ul className="mt-5 divide-y divide-[var(--color-ink-200)] border-y border-[var(--color-ink-200)]">
          {sessions.map((item) => {
            const current = item.id === session.sessionId;
            return (
              <li key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div><div className="flex items-center gap-2"><p className="font-semibold">{describeDevice(item.userAgent)}</p>{current ? <Badge tone="success">Phiên hiện tại</Badge> : null}</div><p className="mt-1 text-xs text-[var(--color-ink-500)]">Hoạt động gần nhất {item.lastSeenAt.toLocaleString("vi-VN")} · Hết hạn {item.expires.toLocaleString("vi-VN")}</p></div>
                {!current ? <form action={revokeSessionAction}><input type="hidden" name="sessionId" value={item.id} /><Button type="submit" variant="ghost">Thu hồi</Button></form> : null}
              </li>
            );
          })}
        </ul>
        <form action={revokeAllSessionsAction} className="mt-6"><Button type="submit" variant="danger">Đăng xuất khỏi mọi thiết bị</Button></form>
      </Card>
      <Card>
        <h2 className="text-lg font-bold">Lịch sử bảo mật gần đây</h2>
        {events.length ? <ul className="mt-4 space-y-3 text-sm">{events.map((event) => <li key={event.id} className="flex justify-between gap-4"><span>{translateAuditAction(event.action)}</span><time dateTime={event.createdAt.toISOString()} className="text-[var(--color-ink-500)]">{event.createdAt.toLocaleString("vi-VN")}</time></li>)}</ul> : <p className="mt-4 text-sm text-[var(--color-ink-500)]">Chưa có sự kiện bảo mật nào được ghi nhận.</p>}
      </Card>
    </div>
  );
}
