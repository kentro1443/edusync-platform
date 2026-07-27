export class CollaborationValidationError extends Error {}

export type NotificationKind = "MESSAGE" | "MENTION";

export function validateConversationTitle(title: string | undefined): string | undefined {
  const value = title?.trim();
  if (!value) return undefined;
  if (value.length > 120) {
    throw new CollaborationValidationError("Tên cuộc trò chuyện không được quá 120 ký tự.");
  }
  return value;
}

export function validateMessageBody(body: string): string {
  const value = body.trim();
  if (!value || value.length > 4_000) {
    throw new CollaborationValidationError("Tin nhắn cần từ 1 đến 4.000 ký tự.");
  }
  return value;
}

export function normalizeConversationParticipants(
  actorUserId: string,
  participantUserIds: readonly string[],
): string[] {
  const participants = [...new Set([actorUserId, ...participantUserIds.filter(Boolean)])];
  if (participants.length < 2) {
    throw new CollaborationValidationError("Hãy chọn ít nhất một người nhận.");
  }
  if (participants.length > 20) {
    throw new CollaborationValidationError("Mỗi cuộc trò chuyện hỗ trợ tối đa 20 người.");
  }
  return participants;
}

export function shouldDeliverNotification(
  kind: NotificationKind,
  preference:
    | Readonly<{
        inAppEnabled: boolean;
        messagesEnabled: boolean;
        mentionsEnabled: boolean;
      }>
    | undefined,
): boolean {
  if (preference?.inAppEnabled === false) return false;
  if (kind === "MESSAGE" && preference?.messagesEnabled === false) return false;
  if (kind === "MENTION" && preference?.mentionsEnabled === false) return false;
  return true;
}

export function buildNotificationDedupeKey(
  messageId: string,
  userId: string,
  kind: NotificationKind,
): string {
  return `notification:${kind}:${messageId}:${userId}`;
}
