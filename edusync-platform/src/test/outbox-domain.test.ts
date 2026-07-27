import { describe, expect, it } from "vitest";

import {
  computeRetryAt,
  renderOutboxEmail,
} from "@/lib/notifications/outbox-domain";

describe("outbox domain", () => {
  it("backs off exponentially with a bounded delay", () => {
    const now = new Date("2026-07-23T00:00:00.000Z");
    expect(computeRetryAt(now, 1).toISOString()).toBe("2026-07-23T00:01:00.000Z");
    expect(computeRetryAt(now, 3).toISOString()).toBe("2026-07-23T00:04:00.000Z");
    expect(computeRetryAt(now, 99).toISOString()).toBe("2026-07-23T00:16:00.000Z");
  });

  it("renders Vietnamese message and invitation templates", () => {
    expect(
      renderOutboxEmail({
        id: "outbox-1",
        toAddress: "user@example.test",
        templateKey: "MESSAGE_NOTIFICATION",
        payload: {
          kind: "MENTION",
          senderName: "Nguyễn An",
          preview: "Kiểm tra kế hoạch nhé.",
          href: "https://example.test/dashboard/messages/1",
        },
      }),
    ).toMatchObject({
      subject: "Nguyễn An đã nhắc đến bạn trên EduSync",
      to: "user@example.test",
    });
    expect(
      renderOutboxEmail({
        id: "outbox-2",
        toAddress: "admin@example.test",
        templateKey: "SCHOOL_INVITATION",
        payload: { schoolName: "Trường Việt", invitationUrl: "https://example.test/invite" },
      }).text,
    ).toContain("Trường Việt");
  });
});
