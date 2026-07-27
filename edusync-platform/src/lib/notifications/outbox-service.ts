import "server-only";

import type { EmailDelivery } from "@/lib/notifications/email-delivery";
import { emailDelivery } from "@/lib/notifications/email-delivery";
import {
  computeRetryAt,
  maxOutboxAttempts,
  renderOutboxEmail,
} from "@/lib/notifications/outbox-domain";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

type MessageSentPayload = {
  conversationId: string;
  recipientUserIds: string[];
  mentionUserIds: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function parseMessagePayload(value: unknown): MessageSentPayload | null {
  const payload = asRecord(value);
  if (typeof payload.conversationId !== "string") return null;
  return {
    conversationId: payload.conversationId,
    recipientUserIds: asStringArray(payload.recipientUserIds),
    mentionUserIds: asStringArray(payload.mentionUserIds),
  };
}

async function fanOutMessageEmail(
  event: Readonly<{
    aggregateId: string;
    schoolId: string | null;
    payloadJson: unknown;
  }>,
) {
  if (!event.schoolId) return;
  const payload = parseMessagePayload(event.payloadJson);
  if (!payload) throw new Error("Invalid message.sent outbox payload.");
  const message = await db.message.findFirst({
    where: {
      id: event.aggregateId,
      schoolId: event.schoolId,
      conversationId: payload.conversationId,
    },
    select: {
      body: true,
      sender: { select: { displayName: true } },
    },
  });
  if (!message) throw new Error("Message for outbox event no longer exists.");
  const recipients = await db.user.findMany({
    where: { id: { in: payload.recipientUserIds } },
    select: {
      id: true,
      email: true,
      notificationPreferences: {
        where: { schoolId: event.schoolId },
        select: {
          emailEnabled: true,
          messagesEnabled: true,
          mentionsEnabled: true,
        },
      },
    },
  });
  const href = `${env.APP_URL}/dashboard/messages/${payload.conversationId}`;
  const rows = recipients.flatMap((recipient) => {
    const kind = payload.mentionUserIds.includes(recipient.id) ? "MENTION" : "MESSAGE";
    const preference = recipient.notificationPreferences[0];
    if (preference?.emailEnabled === false) return [];
    if (kind === "MENTION" && preference?.mentionsEnabled === false) return [];
    if (kind === "MESSAGE" && preference?.messagesEnabled === false) return [];
    return [
      {
        dedupeKey: `email:message:${event.aggregateId}:${recipient.id}:${kind}`,
        schoolId: event.schoolId,
        recipientUserId: recipient.id,
        toAddress: recipient.email,
        templateKey: "MESSAGE_NOTIFICATION",
        payloadJson: {
          kind,
          senderName: message.sender.displayName,
          preview: message.body.slice(0, 500),
          href,
        },
      },
    ];
  });
  if (rows.length) {
    await db.emailOutbox.createMany({ data: rows, skipDuplicates: true });
  }
}

async function processDomainEvent(event: Readonly<{
  eventType: string;
  aggregateId: string;
  schoolId: string | null;
  payloadJson: unknown;
}>) {
  if (event.eventType === "message.sent") {
    await fanOutMessageEmail(event);
  }
}

export async function processDomainOutboxBatch(
  options: Readonly<{ now?: Date; limit?: number; schoolId?: string }> = {},
) {
  const now = options.now ?? new Date();
  const leaseUntil = new Date(now.getTime() + 5 * 60_000);
  await db.domainOutboxEvent.updateMany({
    where: {
      status: "PROCESSING",
      availableAt: { lte: now },
      schoolId: options.schoolId,
    },
    data: { status: "PENDING" },
  });
  const events = await db.domainOutboxEvent.findMany({
    where: {
      status: "PENDING",
      availableAt: { lte: now },
      schoolId: options.schoolId,
      eventType: "message.sent",
    },
    orderBy: { createdAt: "asc" },
    take: Math.min(Math.max(options.limit ?? 25, 1), 100),
  });
  let processed = 0;
  let failed = 0;
  for (const event of events) {
    const claim = await db.domainOutboxEvent.updateMany({
      where: { id: event.id, status: "PENDING" },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
        availableAt: leaseUntil,
      },
    });
    if (claim.count !== 1) continue;
    const attempts = event.attempts + 1;
    try {
      await processDomainEvent(event);
      await db.domainOutboxEvent.update({
        where: { id: event.id },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
      processed += 1;
    } catch {
      await db.domainOutboxEvent.update({
        where: { id: event.id },
        data:
          attempts >= maxOutboxAttempts
            ? { status: "FAILED" }
            : { status: "PENDING", availableAt: computeRetryAt(now, attempts) },
      });
      failed += 1;
    }
  }
  return { claimed: events.length, processed, failed };
}

export async function processEmailOutboxBatch(
  options: Readonly<{
    now?: Date;
    limit?: number;
    delivery?: EmailDelivery;
    schoolId?: string;
  }> = {},
) {
  const now = options.now ?? new Date();
  const delivery = options.delivery ?? emailDelivery;
  const leaseUntil = new Date(now.getTime() + 5 * 60_000);
  await db.emailOutbox.updateMany({
    where: {
      status: "PROCESSING",
      availableAt: { lte: now },
      schoolId: options.schoolId,
    },
    data: { status: "PENDING" },
  });
  const items = await db.emailOutbox.findMany({
    where: {
      status: "PENDING",
      availableAt: { lte: now },
      schoolId: options.schoolId,
    },
    orderBy: { createdAt: "asc" },
    take: Math.min(Math.max(options.limit ?? 25, 1), 100),
  });
  let sent = 0;
  let failed = 0;
  for (const item of items) {
    const claim = await db.emailOutbox.updateMany({
      where: { id: item.id, status: "PENDING" },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
        availableAt: leaseUntil,
        lastError: null,
      },
    });
    if (claim.count !== 1) continue;
    const attempts = item.attempts + 1;
    try {
      await delivery.deliver(
        renderOutboxEmail({
          id: item.id,
          toAddress: item.toAddress,
          templateKey: item.templateKey,
          payload: asRecord(item.payloadJson),
        }),
      );
      await db.emailOutbox.update({
        where: { id: item.id },
        data: { status: "SENT", sentAt: new Date(), lastError: null },
      });
      sent += 1;
    } catch (error) {
      const lastError =
        error instanceof Error ? error.message.slice(0, 1_000) : "Unknown delivery error";
      await db.emailOutbox.update({
        where: { id: item.id },
        data:
          attempts >= maxOutboxAttempts
            ? { status: "FAILED", lastError }
            : {
                status: "PENDING",
                availableAt: computeRetryAt(now, attempts),
                lastError,
              },
      });
      failed += 1;
    }
  }
  return { claimed: items.length, sent, failed };
}
