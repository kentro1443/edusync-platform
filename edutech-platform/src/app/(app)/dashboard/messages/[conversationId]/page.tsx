import { notFound } from "next/navigation";

import {
  markConversationReadAction,
  sendMessageAction,
} from "@/app/(app)/dashboard/messages/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { ConversationRefresh } from "@/components/collaboration/ConversationRefresh";
import { FileUpload } from "@/components/ui/FileUpload";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Field, Textarea } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { getConversation } from "@/lib/collaboration/collaboration-service";

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ result?: string; error?: string }>;
}) {
  const [{ conversationId }, query] = await Promise.all([params, searchParams]);
  const { actor } = await requireSchoolContext(permissions.messageConversationRead);
  const conversation = await getConversation(actor, conversationId);
  if (!conversation) notFound();

  const peers = conversation.participants.filter(
    (participant) => participant.userId !== actor.userId,
  );
  const title =
    conversation.title ||
    peers.map((participant) => participant.user.displayName).join(", ") ||
    "Trao đổi cá nhân";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tin nhắn"
        title={title}
        description={`${conversation.participants.length} thành viên · lịch sử được lưu trong trường`}
        actions={
          <LinkButton href="/dashboard/messages" size="sm" variant="outline">
            Quay lại
          </LinkButton>
        }
      />

      {query.result ? (
        <Alert tone="success" title="Đã cập nhật">
          {query.result === "sent"
            ? "Tin nhắn đã được lưu và thông báo đã được tạo."
            : "Thông báo trong cuộc trò chuyện đã được đánh dấu đã đọc."}
        </Alert>
      ) : null}
      {query.error ? (
        <Alert tone="danger" title="Không thể cập nhật">
          Kiểm tra nội dung, quyền tham gia hoặc thử lại khi kết nối ổn định.
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-ink-100)] pb-4">
            <ConversationRefresh
              streamUrl={`/dashboard/messages/${conversation.id}/stream`}
            />
            <form action={markConversationReadAction}>
              <input type="hidden" name="conversationId" value={conversation.id} />
              <Button type="submit" size="sm" variant="ghost">
                Đánh dấu đã đọc
              </Button>
            </form>
          </div>

          {conversation.messages.length ? (
            <ol
              className="max-h-[36rem] space-y-4 overflow-y-auto py-5"
              aria-label="Lịch sử tin nhắn"
              aria-live="polite"
            >
              {conversation.messages.map((message) => {
                const own = message.senderUserId === actor.userId;
                return (
                  <li
                    key={message.id}
                    className={`flex ${own ? "justify-end" : "justify-start"}`}
                  >
                    <article
                      className={`max-w-[min(85%,40rem)] rounded-[var(--radius-lg)] px-4 py-3 ${
                        own
                          ? "bg-[var(--color-brand-800)] text-white"
                          : "border border-[var(--color-ink-100)] bg-[var(--color-ink-50)] text-[var(--color-ink-800)]"
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold ${
                          own ? "text-[var(--color-brand-100)]" : "text-[var(--color-ink-500)]"
                        }`}
                      >
                        {own ? "Bạn" : message.sender.displayName}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">
                        {message.body}
                      </p>
                      {message.attachments.length ? (
                        <ul className="mt-3 space-y-1 border-t border-current/20 pt-2">
                          {message.attachments.map((attachment) => (
                            <li key={attachment.id}>
                              <a
                                href={`/dashboard/messages/${conversation.id}/attachments/${attachment.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold underline underline-offset-2"
                              >
                                {attachment.file.originalName}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <time
                        dateTime={message.createdAt.toISOString()}
                        className={`mt-2 block text-[11px] ${
                          own ? "text-[var(--color-brand-100)]" : "text-[var(--color-ink-400)]"
                        }`}
                      >
                        {timeFormatter.format(message.createdAt)}
                      </time>
                    </article>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div role="status" className="py-12 text-center">
              <h2 className="text-sm font-bold">Chưa có tin nhắn</h2>
              <p className="mt-2 text-sm text-[var(--color-ink-500)]">
                Gửi nội dung đầu tiên để bắt đầu phối hợp.
              </p>
            </div>
          )}

          <form
            action={sendMessageAction}
            className="space-y-4 border-t border-[var(--color-ink-100)] pt-5"
          >
            <input type="hidden" name="conversationId" value={conversation.id} />
            <Field
              id="message-body"
              label="Tin nhắn"
              description="Tối đa 4.000 ký tự. Tin nhắn gửi thành công luôn được lưu trước khi phát thông báo."
              required
            >
              <Textarea
                id="message-body"
                name="body"
                rows={4}
                maxLength={4000}
                required
                placeholder="Nhập nội dung cần trao đổi…"
              />
            </Field>
            {peers.length ? (
              <details className="border-y border-[var(--color-ink-100)] py-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  Nhắc thành viên
                </summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {peers.map((participant) => (
                    <label
                      key={participant.userId}
                      className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="mentionUserIds"
                        value={participant.userId}
                        className="h-4 w-4 accent-[var(--color-brand-700)]"
                      />
                      {participant.user.displayName}
                    </label>
                  ))}
                </div>
              </details>
            ) : null}
            <FileUpload
              name="file"
              accept="application/pdf,image/png,image/jpeg,image/webp,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              maxSizeMb={10}
            />
            <Button type="submit">Gửi tin nhắn</Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold">Thành viên</h2>
            <Badge tone="neutral">{conversation.participants.length}</Badge>
          </div>
          <ul className="mt-4 space-y-3">
            {conversation.participants.map((participant) => (
              <li key={participant.id} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-xs font-bold text-[var(--color-brand-900)]"
                >
                  {participant.user.displayName
                    .split(/\s+/)
                    .slice(-2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {participant.userId === actor.userId
                      ? `${participant.user.displayName} (Bạn)`
                      : participant.user.displayName}
                  </p>
                  <p className="text-xs text-[var(--color-ink-500)]">
                    Tham gia {timeFormatter.format(participant.joinedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
