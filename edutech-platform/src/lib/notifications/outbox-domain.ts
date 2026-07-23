export const maxOutboxAttempts = 5;

export function computeRetryAt(now: Date, attempts: number): Date {
  const safeAttempts = Math.max(1, Math.min(attempts, maxOutboxAttempts));
  const delayMinutes = Math.min(60, 2 ** (safeAttempts - 1));
  return new Date(now.getTime() + delayMinutes * 60_000);
}

function stringValue(
  payload: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const value = payload[key];
  return typeof value === "string" ? value : fallback;
}

export function renderOutboxEmail(input: Readonly<{
  id: string;
  toAddress: string;
  templateKey: string;
  payload: Record<string, unknown>;
}>) {
  const { payload } = input;
  if (input.templateKey === "PASSWORD_RESET") {
    const displayName = stringValue(payload, "displayName", "bạn");
    const resetUrl = stringValue(payload, "resetUrl");
    return {
      outboxId: input.id,
      to: input.toAddress,
      subject: "Đặt lại mật khẩu EduTech",
      text: `Xin chào ${displayName},\n\nMở liên kết sau để đặt lại mật khẩu:\n${resetUrl}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`,
    };
  }
  if (input.templateKey === "SCHOOL_INVITATION") {
    const schoolName = stringValue(payload, "schoolName", "nhà trường");
    const invitationUrl = stringValue(payload, "invitationUrl");
    return {
      outboxId: input.id,
      to: input.toAddress,
      subject: `Lời mời tham gia ${schoolName} trên EduTech`,
      text: `Bạn được mời tham gia ${schoolName}.\n\nMở lời mời:\n${invitationUrl}`,
    };
  }
  if (input.templateKey === "MESSAGE_NOTIFICATION") {
    const senderName = stringValue(payload, "senderName", "Một thành viên");
    const preview = stringValue(payload, "preview");
    const href = stringValue(payload, "href");
    const kind = stringValue(payload, "kind");
    return {
      outboxId: input.id,
      to: input.toAddress,
      subject:
        kind === "MENTION"
          ? `${senderName} đã nhắc đến bạn trên EduTech`
          : `Tin nhắn mới từ ${senderName} trên EduTech`,
      text: `${preview}\n\nMở cuộc trò chuyện:\n${href}`,
    };
  }
  return {
    outboxId: input.id,
    to: input.toAddress,
    subject: "Cập nhật từ EduTech",
    text: stringValue(payload, "message", "Bạn có một cập nhật mới trên EduTech."),
  };
}
