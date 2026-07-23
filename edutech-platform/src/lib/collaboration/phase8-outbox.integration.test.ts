import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { LocalEmailDelivery, type EmailDelivery } from "@/lib/notifications/email-delivery";
import {
  processDomainOutboxBatch,
  processEmailOutboxBatch,
} from "@/lib/notifications/outbox-service";

const schoolId = randomUUID();
const senderId = randomUUID();
const recipientId = randomUUID();
const conversationId = randomUUID();
const messageId = randomUUID();
const domainEventId = randomUUID();
let deliveryRoot = "";

describe("Phase 8 outbox integration", () => {
  beforeAll(async () => {
    deliveryRoot = await mkdtemp(path.join(tmpdir(), "edutech-email-outbox-"));
    await db.school.create({
      data: {
        id: schoolId,
        slug: `phase8-outbox-${schoolId}`,
        name: "Trường kiểm thử Outbox",
        shortName: "P8",
      },
    });
    await db.user.createMany({
      data: [
        {
          id: senderId,
          email: `sender-${senderId}@example.test`,
          normalizedEmail: `sender-${senderId}@example.test`,
          passwordHash: "integration-test",
          displayName: "Người gửi Outbox",
          mustChangePassword: false,
        },
        {
          id: recipientId,
          email: `recipient-${recipientId}@example.test`,
          normalizedEmail: `recipient-${recipientId}@example.test`,
          passwordHash: "integration-test",
          displayName: "Người nhận Outbox",
          mustChangePassword: false,
        },
      ],
    });
    await db.conversation.create({
      data: {
        id: conversationId,
        schoolId,
        createdByUserId: senderId,
        title: "Outbox integration",
        participants: {
          create: [{ userId: senderId }, { userId: recipientId }],
        },
      },
    });
    await db.message.create({
      data: {
        id: messageId,
        schoolId,
        conversationId,
        senderUserId: senderId,
        body: "Nội dung thông báo bền vững.",
      },
    });
    await db.notificationPreference.create({
      data: {
        schoolId,
        userId: recipientId,
        emailEnabled: true,
        messagesEnabled: true,
        mentionsEnabled: true,
      },
    });
    await db.domainOutboxEvent.create({
      data: {
        id: domainEventId,
        schoolId,
        eventType: "message.sent",
        aggregateType: "Message",
        aggregateId: messageId,
        dedupeKey: `phase8-test:${messageId}`,
        payloadJson: {
          conversationId,
          recipientUserIds: [recipientId],
          mentionUserIds: [recipientId],
        },
      },
    });
  });

  afterAll(async () => {
    await db.emailOutbox.deleteMany({ where: { schoolId } });
    await db.domainOutboxEvent.deleteMany({ where: { schoolId } });
    await db.notificationPreference.deleteMany({ where: { schoolId } });
    await db.message.deleteMany({ where: { schoolId } });
    await db.conversation.deleteMany({ where: { schoolId } });
    await db.user.deleteMany({ where: { id: { in: [senderId, recipientId] } } });
    await db.school.deleteMany({ where: { id: schoolId } });
    await rm(deliveryRoot, { recursive: true, force: true });
  });

  it("fans out once and delivers an idempotent local email", async () => {
    const domain = await processDomainOutboxBatch({ limit: 100, schoolId });
    expect(domain.processed).toBe(1);
    await processDomainOutboxBatch({ limit: 100, schoolId });
    const emails = await db.emailOutbox.findMany({
      where: { schoolId, recipientUserId: recipientId },
    });
    expect(emails).toHaveLength(1);

    const delivery = new LocalEmailDelivery(deliveryRoot);
    const result = await processEmailOutboxBatch({
      limit: 100,
      delivery,
      schoolId,
    });
    expect(result.sent).toBe(1);
    const delivered = await delivery.get(emails[0].id);
    expect(delivered).toMatchObject({
      to: `recipient-${recipientId}@example.test`,
      subject: "Người gửi Outbox đã nhắc đến bạn trên EduTech",
    });
  });

  it("retries transient email failures and stops after the limit", async () => {
    const item = await db.emailOutbox.create({
      data: {
        schoolId,
        recipientUserId: recipientId,
        toAddress: `recipient-${recipientId}@example.test`,
        templateKey: "MESSAGE_NOTIFICATION",
        payloadJson: { preview: "Retry" },
        dedupeKey: `phase8-retry:${messageId}`,
      },
    });
    const failingDelivery: EmailDelivery = {
      deliver: async () => {
        throw new Error("Temporary transport error");
      },
      get: async () => null,
    };
    const now = new Date("2026-07-23T00:00:00.000Z");
    await db.emailOutbox.update({
      where: { id: item.id },
      data: { availableAt: now },
    });
    await processEmailOutboxBatch({
      now,
      delivery: failingDelivery,
      limit: 100,
      schoolId,
    });
    const retrying = await db.emailOutbox.findUniqueOrThrow({ where: { id: item.id } });
    expect(retrying).toMatchObject({
      status: "PENDING",
      attempts: 1,
      lastError: "Temporary transport error",
    });
    expect(retrying.availableAt.getTime()).toBeGreaterThan(now.getTime());

    await db.emailOutbox.update({
      where: { id: item.id },
      data: { status: "PENDING", attempts: 4, availableAt: now },
    });
    await processEmailOutboxBatch({
      now,
      delivery: failingDelivery,
      limit: 100,
      schoolId,
    });
    await expect(
      db.emailOutbox.findUniqueOrThrow({ where: { id: item.id } }),
    ).resolves.toMatchObject({ status: "FAILED", attempts: 5 });
  });
});
