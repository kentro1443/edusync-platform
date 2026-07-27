import Link from "next/link";

import { createConversationAction } from "@/app/(app)/dashboard/messages/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { translateRole } from "@/components/app/shell-utils";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Field, Input } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import {
  listConversationCandidates,
  listConversations,
} from "@/lib/collaboration/collaboration-service";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; error?: string }>;
}) {
  const query = await searchParams;
  const { actor } = await requireSchoolContext(permissions.messageConversationRead);
  const [conversations, candidates] = await Promise.all([
    listConversations(actor),
    listConversationCandidates(actor),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cộng tác"
        title="Trao đổi trong đúng ngữ cảnh trường"
        description="Tin nhắn được giới hạn theo thành viên cuộc trò chuyện, lưu bền vững và tạo thông báo theo sở thích cá nhân."
        actions={
          <LinkButton href="/dashboard/notifications" variant="outline" size="sm">
            Xem thông báo
          </LinkButton>
        }
      />

      {query.result ? (
        <Alert tone="success" title="Đã cập nhật">
          Cuộc trò chuyện đã được tạo.
        </Alert>
      ) : null}
      {query.error ? (
        <Alert tone="danger" title="Không thể tạo cuộc trò chuyện">
          Chọn ít nhất một thành viên đang hoạt động và kiểm tra lại dữ liệu.
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Cuộc trò chuyện</h2>
              <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                Sắp xếp theo hoạt động mới nhất.
              </p>
            </div>
            <Badge tone="neutral">{conversations.length}</Badge>
          </div>

          {conversations.length ? (
            <ul className="mt-5 divide-y divide-[var(--color-ink-100)] border-y border-[var(--color-ink-100)]">
              {conversations.map((conversation) => {
                const peers = conversation.participants
                  .filter((participant) => participant.userId !== actor.userId)
                  .map((participant) => participant.user.displayName);
                const title = conversation.title || peers.join(", ") || "Trao đổi cá nhân";
                const latest = conversation.messages[0];
                return (
                  <li key={conversation.id}>
                    <Link
                      href={`/dashboard/messages/${conversation.id}`}
                      className="group block px-1 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-500)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-[var(--color-ink-900)] group-hover:text-[var(--color-brand-800)]">
                            {title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm text-[var(--color-ink-600)]">
                            {latest?.body ?? "Chưa có tin nhắn. Bắt đầu trao đổi trong luồng này."}
                          </p>
                        </div>
                        <time
                          dateTime={(latest?.createdAt ?? conversation.updatedAt).toISOString()}
                          className="shrink-0 text-xs text-[var(--color-ink-400)]"
                        >
                          {dateFormatter.format(latest?.createdAt ?? conversation.updatedAt)}
                        </time>
                      </div>
                      <p className="mt-2 text-xs text-[var(--color-ink-500)]">
                        {conversation.participants.length} thành viên
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div role="status" className="mt-5 border-y border-[var(--color-ink-100)] py-10 text-center">
              <h3 className="text-sm font-bold">Chưa có cuộc trò chuyện</h3>
              <p className="mt-2 text-sm text-[var(--color-ink-500)]">
                Chọn thành viên ở biểu mẫu bên cạnh để bắt đầu.
              </p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-bold">Tạo cuộc trò chuyện</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">
            Có thể chọn tối đa 19 người khác.
          </p>
          <form action={createConversationAction} className="mt-5 space-y-4">
            <Field
              id="conversation-title"
              label="Tên nhóm"
              description="Không bắt buộc với trao đổi trực tiếp."
            >
              <Input
                id="conversation-title"
                name="title"
                maxLength={120}
                placeholder="Ví dụ: Nhóm tổ chức hội thảo"
              />
            </Field>
            <fieldset>
              <legend className="text-sm font-semibold text-[var(--color-ink-800)]">
                Thành viên
              </legend>
              <div className="mt-2 max-h-72 space-y-1 overflow-y-auto border-y border-[var(--color-ink-100)] py-2">
                {candidates.map((candidate) => (
                  <label
                    key={candidate.userId}
                    className="flex min-h-11 cursor-pointer items-start gap-3 px-2 py-2 hover:bg-[var(--color-ink-50)]"
                  >
                    <input
                      type="checkbox"
                      name="participantUserIds"
                      value={candidate.userId}
                      className="mt-1 h-4 w-4 accent-[var(--color-brand-700)]"
                    />
                    <span>
                      <span className="block text-sm font-semibold">
                        {candidate.displayName}
                      </span>
                      <span className="block text-xs text-[var(--color-ink-500)]">
                        {candidate.roles.map(translateRole).join(" · ")}
                      </span>
                    </span>
                  </label>
                ))}
                {!candidates.length ? (
                  <p className="px-2 py-4 text-sm text-[var(--color-ink-500)]">
                    Chưa có thành viên hoạt động khác.
                  </p>
                ) : null}
              </div>
            </fieldset>
            <Button type="submit" disabled={!candidates.length}>
              Tạo cuộc trò chuyện
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
