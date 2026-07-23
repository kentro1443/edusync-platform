import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  updateNotificationPreferenceAction,
} from "@/app/(app)/dashboard/notifications/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Field, Select } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import {
  listActivityFeed,
  listNotifications,
} from "@/lib/collaboration/collaboration-service";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    result?: string;
    error?: string;
    status?: string;
    type?: string;
  }>;
}) {
  const query = await searchParams;
  const status = query.status === "unread" ? "unread" : "all";
  const type = ["MESSAGE", "MENTION"].includes(query.type ?? "")
    ? query.type
    : "";
  const { actor } = await requireSchoolContext(permissions.notificationReadOwn);
  const [notifications, activity] = await Promise.all([
    listNotifications(actor, { status, type }),
    listActivityFeed(actor),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Thông báo"
        title="Không bỏ lỡ việc cần xử lý"
        description={`${notifications.unreadCount} thông báo chưa đọc · mỗi người tự kiểm soát kênh nhận`}
        actions={
          <LinkButton href="/dashboard/messages" variant="outline" size="sm">
            Mở tin nhắn
          </LinkButton>
        }
      />

      {query.result ? (
        <Alert tone="success" title="Đã lưu">
          Trạng thái thông báo hoặc tùy chọn nhận tin đã được cập nhật.
        </Alert>
      ) : null}
      {query.error ? (
        <Alert tone="danger" title="Không thể cập nhật">
          Thử lại hoặc kiểm tra quyền trong trường hiện tại.
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Lịch sử thông báo</h2>
              <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                Tối đa 100 thông báo mới nhất.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={notifications.unreadCount ? "warning" : "success"}>
                {notifications.unreadCount} chưa đọc
              </Badge>
              {notifications.unreadCount ? (
                <form action={markAllNotificationsReadAction}>
                  <Button type="submit" size="sm" variant="ghost">
                    Đọc tất cả
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
          <form
            method="get"
            className="mt-5 grid gap-3 rounded-[var(--radius-md)] bg-[var(--color-ink-50)] p-4 sm:grid-cols-[1fr_1fr_auto]"
          >
            <Field id="notification-status" label="Trạng thái">
              <Select id="notification-status" name="status" defaultValue={status}>
                <option value="all">Tất cả</option>
                <option value="unread">Chưa đọc</option>
              </Select>
            </Field>
            <Field id="notification-type" label="Loại">
              <Select id="notification-type" name="type" defaultValue={type}>
                <option value="">Mọi loại</option>
                <option value="MESSAGE">Tin nhắn</option>
                <option value="MENTION">Nhắc tên</option>
              </Select>
            </Field>
            <Button type="submit" variant="outline" className="self-end">
              Lọc
            </Button>
          </form>

          {notifications.items.length ? (
            <ol className="mt-5 divide-y divide-[var(--color-ink-100)] border-y border-[var(--color-ink-100)]">
              {notifications.items.map((notification) => (
                <li
                  key={notification.id}
                  className={`py-4 ${notification.readAt ? "opacity-70" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold">{notification.title}</h3>
                        {!notification.readAt ? <Badge tone="warning">Mới</Badge> : null}
                      </div>
                      {notification.body ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-ink-600)]">
                          {notification.body}
                        </p>
                      ) : null}
                      <time
                        dateTime={notification.createdAt.toISOString()}
                        className="mt-2 block text-xs text-[var(--color-ink-400)]"
                      >
                        {dateFormatter.format(notification.createdAt)}
                      </time>
                    </div>
                    <form action={markNotificationReadAction}>
                      <input
                        type="hidden"
                        name="notificationId"
                        value={notification.id}
                      />
                      <input
                        type="hidden"
                        name="href"
                        value={notification.href ?? "/dashboard/notifications?result=read"}
                      />
                      <Button type="submit" size="sm" variant="outline">
                        {notification.href ? "Mở" : "Đã đọc"}
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div role="status" className="mt-5 py-10 text-center">
              <h3 className="text-sm font-bold">Chưa có thông báo</h3>
              <p className="mt-2 text-sm text-[var(--color-ink-500)]">
                Tin nhắn và hoạt động cần chú ý sẽ xuất hiện tại đây.
              </p>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-base font-bold">Tùy chọn nhận tin</h2>
            <form action={updateNotificationPreferenceAction} className="mt-4 space-y-2">
              {[
                ["inAppEnabled", "Thông báo trong ứng dụng", notifications.preference.inAppEnabled],
                ["emailEnabled", "Email tổng hợp", notifications.preference.emailEnabled],
                ["messagesEnabled", "Tin nhắn mới", notifications.preference.messagesEnabled],
                ["mentionsEnabled", "Khi được nhắc tên", notifications.preference.mentionsEnabled],
              ].map(([name, label, checked]) => (
                <label
                  key={String(name)}
                  className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-[var(--color-ink-100)] py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name={String(name)}
                    defaultChecked={Boolean(checked)}
                    className="h-4 w-4 accent-[var(--color-brand-700)]"
                  />
                  {String(label)}
                </label>
              ))}
              <Button type="submit" className="mt-3">
                Lưu tùy chọn
              </Button>
            </form>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">Hoạt động gần đây</h2>
              <Badge tone="neutral">{activity.length}</Badge>
            </div>
            {activity.length ? (
              <ol className="mt-4 space-y-4">
                {activity.slice(0, 10).map((item) => (
                  <li
                    key={item.id}
                    className="border-l-2 border-[var(--color-brand-200)] pl-3"
                  >
                    <p className="text-sm font-semibold">{item.summary}</p>
                    <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                      {item.actor?.displayName ?? "Hệ thống"} ·{" "}
                      {dateFormatter.format(item.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-[var(--color-ink-500)]">
                Chưa có hoạt động cộng tác.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
