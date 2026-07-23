import { describe, expect, it } from "vitest";

import {
  buildNotificationDedupeKey,
  normalizeConversationParticipants,
  shouldDeliverNotification,
  validateConversationTitle,
  validateMessageBody,
} from "@/lib/collaboration/collaboration-domain";

describe("collaboration domain", () => {
  it("normalizes participants and keeps the actor in every conversation", () => {
    expect(normalizeConversationParticipants("actor", ["reader", "reader", "actor"])).toEqual([
      "actor",
      "reader",
    ]);
    expect(() => normalizeConversationParticipants("actor", [])).toThrow();
  });

  it("validates message and conversation copy", () => {
    expect(validateConversationTitle("  Nhóm giáo vụ  ")).toBe("Nhóm giáo vụ");
    expect(validateConversationTitle("   ")).toBeUndefined();
    expect(validateMessageBody("  Nhắc lịch họp lúc 14:00.  ")).toBe(
      "Nhắc lịch họp lúc 14:00.",
    );
    expect(() => validateMessageBody(" ")).toThrow();
    expect(() => validateMessageBody("x".repeat(4_001))).toThrow();
  });

  it("honors notification preferences and produces stable dedupe keys", () => {
    expect(
      shouldDeliverNotification("MESSAGE", {
        inAppEnabled: true,
        messagesEnabled: true,
        mentionsEnabled: false,
      }),
    ).toBe(true);
    expect(
      shouldDeliverNotification("MENTION", {
        inAppEnabled: true,
        messagesEnabled: true,
        mentionsEnabled: false,
      }),
    ).toBe(false);
    expect(buildNotificationDedupeKey("message-1", "user-1", "MESSAGE")).toBe(
      "notification:MESSAGE:message-1:user-1",
    );
  });
});
