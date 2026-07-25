import "server-only";

import { randomUUID } from "node:crypto";

import type { AuthorizationContext } from "@/lib/auth/policies";
import { getSchoolPermissions, hasPermission, permissions } from "@/lib/auth/permissions";
import {
  buildNotificationDedupeKey,
  CollaborationValidationError,
  normalizeConversationParticipants,
  shouldDeliverNotification,
  validateConversationTitle,
  validateMessageBody,
} from "@/lib/collaboration/collaboration-domain";
import { db } from "@/lib/db";
import {
  validateUploadContent,
  validateUploadMetadata,
} from "@/lib/resources/resource-domain";
import { LocalFileStorage } from "@/lib/storage/file-storage";
import { assertSchoolStorageQuota } from "@/lib/storage/storage-quota";

export class CollaborationAuthorizationError extends Error {}
export class CollaborationNotFoundError extends Error {}

type SchoolActor = AuthorizationContext & { schoolId: string; membershipId: string };

function requireCollaborationActor(
  actor: AuthorizationContext,
  permission: (typeof permissions)[keyof typeof permissions],
): asserts actor is SchoolActor {
  if (
    !actor.schoolId ||
    !actor.membershipId ||
    !hasPermission(getSchoolPermissions(actor.schoolRoles), permission)
  ) {
    throw new CollaborationAuthorizationError("Bạn không có quyền cộng tác trong trường này.");
  }
}

function conversationAccess(actor: SchoolActor) {
  return {
    schoolId: actor.schoolId,
    participants: { some: { userId: actor.userId } },
  } as const;
}

export async function listConversationCandidates(actor: AuthorizationContext) {
  requireCollaborationActor(actor, permissions.messageConversationCreate);
  const memberships = await db.schoolMembership.findMany({
    where: {
      schoolId: actor.schoolId,
      status: "ACTIVE",
      userId: { not: actor.userId },
    },
    select: {
      userId: true,
      user: { select: { displayName: true } },
      roleAssignments: { select: { role: true }, orderBy: { role: "asc" } },
    },
    orderBy: { user: { displayName: "asc" } },
    take: 200,
  });
  return memberships.map((membership) => ({
    userId: membership.userId,
    displayName: membership.user.displayName,
    roles: membership.roleAssignments.map((assignment) => assignment.role),
  }));
}

export async function createConversation(
  actor: AuthorizationContext,
  input: Readonly<{ title?: string; participantUserIds: readonly string[] }>,
): Promise<string> {
  requireCollaborationActor(actor, permissions.messageConversationCreate);
  const title = validateConversationTitle(input.title);
  const participantUserIds = normalizeConversationParticipants(
    actor.userId,
    input.participantUserIds,
  );
  const activeCount = await db.schoolMembership.count({
    where: {
      schoolId: actor.schoolId,
      status: "ACTIVE",
      userId: { in: participantUserIds },
    },
  });
  if (activeCount !== participantUserIds.length) {
    throw new CollaborationValidationError(
      "Một hoặc nhiều người nhận không còn hoạt động trong trường.",
    );
  }
  return db.$transaction(async (transaction) => {
    const conversation = await transaction.conversation.create({
      data: {
        schoolId: actor.schoolId,
        createdByUserId: actor.userId,
        title,
        participants: {
          create: participantUserIds.map((userId) => ({
            userId,
            lastReadAt: userId === actor.userId ? new Date() : undefined,
          })),
        },
      },
    });
    const href = `/dashboard/messages/${conversation.id}`;
    await transaction.domainOutboxEvent.create({
      data: {
        schoolId: actor.schoolId,
        eventType: "conversation.created",
        aggregateType: "Conversation",
        aggregateId: conversation.id,
        dedupeKey: `conversation.created:${conversation.id}`,
        payloadJson: { participantUserIds, href },
      },
    });
    await transaction.activityFeedProjection.createMany({
      data: participantUserIds.map((userId) => ({
        schoolId: actor.schoolId,
        userId,
        actorUserId: actor.userId,
        eventType: "CONVERSATION_CREATED",
        objectType: "Conversation",
        objectId: conversation.id,
        summary: title ? `Cuộc trò chuyện “${title}” đã được tạo.` : "Cuộc trò chuyện mới đã được tạo.",
        href,
        dedupeKey: `activity:conversation.created:${conversation.id}:${userId}`,
      })),
      skipDuplicates: true,
    });
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        actorType: "USER",
        action: "CONVERSATION_CREATED",
        entityType: "Conversation",
        entityId: conversation.id,
        afterJson: { participantCount: participantUserIds.length, hasTitle: Boolean(title) },
        requestId: randomUUID(),
      },
    });
    return conversation.id;
  });
}

export async function listConversations(actor: AuthorizationContext) {
  requireCollaborationActor(actor, permissions.messageConversationRead);
  return db.conversation.findMany({
    where: conversationAccess(actor),
    include: {
      participants: {
        include: { user: { select: { id: true, displayName: true } } },
        orderBy: { joinedAt: "asc" },
      },
      messages: {
        where: { deletedAt: null },
        select: { id: true, body: true, createdAt: true, senderUserId: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function getConversation(actor: AuthorizationContext, conversationId: string) {
  requireCollaborationActor(actor, permissions.messageConversationRead);
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, ...conversationAccess(actor) },
    include: {
      participants: {
        include: { user: { select: { id: true, displayName: true } } },
        orderBy: { joinedAt: "asc" },
      },
      messages: {
        where: { deletedAt: null },
        include: {
          sender: { select: { id: true, displayName: true } },
          mentions: { select: { userId: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
    },
  });
  if (!conversation) return null;
  const links = await db.fileLink.findMany({
    where: {
      schoolId: actor.schoolId,
      entityType: "MESSAGE",
      entityId: { in: conversation.messages.map((message) => message.id) },
      file: { status: "AVAILABLE" },
    },
    select: {
      id: true,
      entityId: true,
      file: {
        select: {
          originalName: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  const attachmentsByMessage = new Map<string, (typeof links)[number][]>();
  for (const link of links) {
    const messageLinks = attachmentsByMessage.get(link.entityId) ?? [];
    messageLinks.push(link);
    attachmentsByMessage.set(link.entityId, messageLinks);
  }
  return {
    ...conversation,
    messages: [...conversation.messages].reverse().map((message) => ({
      ...message,
      attachments: attachmentsByMessage.get(message.id) ?? [],
    })),
  };
}

export async function getConversationRevision(
  actor: AuthorizationContext,
  conversationId: string,
) {
  requireCollaborationActor(actor, permissions.messageConversationRead);
  return db.conversation.findFirst({
    where: { id: conversationId, ...conversationAccess(actor) },
    select: {
      updatedAt: true,
      messages: {
        where: { deletedAt: null },
        select: { id: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function sendMessage(
  actor: AuthorizationContext,
  conversationId: string,
  input: Readonly<{ body: string; mentionUserIds?: readonly string[] }>,
) {
  requireCollaborationActor(actor, permissions.messageSend);
  const body = validateMessageBody(input.body);
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, ...conversationAccess(actor) },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              notificationPreferences: {
                where: { schoolId: actor.schoolId },
                select: {
                  inAppEnabled: true,
                  messagesEnabled: true,
                  mentionsEnabled: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!conversation) {
    throw new CollaborationNotFoundError("Không tìm thấy cuộc trò chuyện.");
  }
  const participantIds = new Set(
    conversation.participants.map((participant) => participant.userId),
  );
  const senderName =
    conversation.participants.find((participant) => participant.userId === actor.userId)
      ?.user.displayName ?? "Một thành viên";
  const mentionUserIds = [
    ...new Set((input.mentionUserIds ?? []).filter((userId) => userId !== actor.userId)),
  ];
  if (
    mentionUserIds.length > 10 ||
    mentionUserIds.some((userId) => !participantIds.has(userId))
  ) {
    throw new CollaborationValidationError("Danh sách người được nhắc không hợp lệ.");
  }

  return db.$transaction(async (transaction) => {
    const message = await transaction.message.create({
      data: {
        schoolId: actor.schoolId,
        conversationId,
        senderUserId: actor.userId,
        body,
        mentions: { create: mentionUserIds.map((userId) => ({ userId })) },
      },
    });
    await transaction.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    const href = `/dashboard/messages/${conversationId}`;
    const recipients = conversation.participants.filter(
      (participant) => participant.userId !== actor.userId,
    );
    const notifications = recipients.flatMap((participant) => {
      const kind = mentionUserIds.includes(participant.userId) ? "MENTION" : "MESSAGE";
      const preference = participant.user.notificationPreferences[0];
      if (!shouldDeliverNotification(kind, preference)) return [];
      return [
        {
          schoolId: actor.schoolId,
          userId: participant.userId,
          type: kind,
          title:
            kind === "MENTION"
              ? `${senderName} đã nhắc đến bạn`
              : `Tin nhắn mới từ ${senderName}`,
          body: body.slice(0, 240),
          href,
          dedupeKey: buildNotificationDedupeKey(message.id, participant.userId, kind),
        },
      ];
    });
    if (notifications.length) {
      await transaction.notification.createMany({
        data: notifications,
        skipDuplicates: true,
      });
    }
    await transaction.activityFeedProjection.createMany({
      data: recipients.map((participant) => ({
        schoolId: actor.schoolId,
        userId: participant.userId,
        actorUserId: actor.userId,
        eventType: "MESSAGE_SENT",
        objectType: "Message",
        objectId: message.id,
        summary: `${senderName} đã gửi tin nhắn mới.`,
        href,
        dedupeKey: `activity:message.sent:${message.id}:${participant.userId}`,
      })),
      skipDuplicates: true,
    });
    await transaction.domainOutboxEvent.create({
      data: {
        schoolId: actor.schoolId,
        eventType: "message.sent",
        aggregateType: "Message",
        aggregateId: message.id,
        dedupeKey: `message.sent:${message.id}`,
        payloadJson: {
          conversationId,
          senderUserId: actor.userId,
          recipientUserIds: recipients.map((participant) => participant.userId),
          mentionUserIds,
        },
      },
    });
    await transaction.conversationParticipant.updateMany({
      where: { conversationId, userId: actor.userId },
      data: { lastReadAt: new Date() },
    });
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        actorType: "USER",
        action: "MESSAGE_SENT",
        entityType: "Message",
        entityId: message.id,
        afterJson: {
          conversationId,
          recipientCount: recipients.length,
          mentionCount: mentionUserIds.length,
        },
        requestId: randomUUID(),
      },
    });
    return message.id;
  });
}

export async function addMessageAttachment(
  actor: AuthorizationContext,
  conversationId: string,
  messageId: string,
  input: Readonly<{
    originalName: string;
    mimeType: string;
    content: Uint8Array;
  }>,
) {
  requireCollaborationActor(actor, permissions.messageAttachmentCreate);
  const message = await db.message.findFirst({
    where: {
      id: messageId,
      conversationId,
      schoolId: actor.schoolId,
      senderUserId: actor.userId,
      conversation: { participants: { some: { userId: actor.userId } } },
    },
    select: { id: true },
  });
  if (!message) {
    throw new CollaborationAuthorizationError(
      "Bạn chỉ có thể đính kèm tệp vào tin nhắn của mình.",
    );
  }
  validateMessageAttachment(input);
  const storage = new LocalFileStorage();
  const stored = await storage.put({
    content: input.content,
    maxBytes: 10 * 1024 * 1024,
  });
  try {
    return await db.$transaction(async (transaction) => {
      await assertSchoolStorageQuota(
        transaction,
        actor.schoolId,
        BigInt(stored.sizeBytes),
      );
      const file = await transaction.storedFile.create({
        data: {
          schoolId: actor.schoolId,
          storageKey: stored.storageKey,
          originalName: input.originalName.trim(),
          mimeType: input.mimeType,
          sizeBytes: stored.sizeBytes,
          sha256: stored.sha256,
          status: "AVAILABLE",
          createdByUserId: actor.userId,
          versions: {
            create: {
              versionNumber: 1,
              storageKey: stored.storageKey,
              originalName: input.originalName.trim(),
              mimeType: input.mimeType,
              sizeBytes: stored.sizeBytes,
              sha256: stored.sha256,
              createdByUserId: actor.userId,
            },
          },
        },
      });
      const link = await transaction.fileLink.create({
        data: {
          schoolId: actor.schoolId,
          fileId: file.id,
          entityType: "MESSAGE",
          entityId: message.id,
          visibility: "CONVERSATION_PARTICIPANTS",
          createdByUserId: actor.userId,
        },
      });
      await transaction.auditEvent.create({
        data: {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          actorType: "USER",
          action: "MESSAGE_ATTACHMENT_CREATED",
          entityType: "Message",
          entityId: message.id,
          afterJson: {
            fileLinkId: link.id,
            mimeType: input.mimeType,
            sizeBytes: stored.sizeBytes.toString(),
          },
          requestId: randomUUID(),
        },
      });
      return link.id;
    });
  } catch (error) {
    await storage.remove(stored.storageKey).catch(() => undefined);
    throw error;
  }
}

export function validateMessageAttachment(
  input: Readonly<{
    originalName: string;
    mimeType: string;
    content: Uint8Array;
  }>,
) {
  try {
    validateUploadMetadata({
      originalName: input.originalName,
      mimeType: input.mimeType,
      sizeBytes: input.content.byteLength,
      maxBytes: 10 * 1024 * 1024,
    });
    validateUploadContent(input.mimeType, input.content);
  } catch (error) {
    throw new CollaborationValidationError(
      error instanceof Error ? error.message : "Tệp đính kèm không hợp lệ.",
    );
  }
}

export async function getMessageAttachment(
  actor: AuthorizationContext,
  conversationId: string,
  fileLinkId: string,
) {
  requireCollaborationActor(actor, permissions.messageConversationRead);
  const link = await db.fileLink.findFirst({
    where: {
      id: fileLinkId,
      schoolId: actor.schoolId,
      entityType: "MESSAGE",
      file: { status: "AVAILABLE" },
    },
    select: {
      entityId: true,
      file: {
        select: {
          storageKey: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
    },
  });
  if (!link) {
    throw new CollaborationNotFoundError("Không tìm thấy tệp đính kèm.");
  }
  const allowed = await db.message.count({
    where: {
      id: link.entityId,
      conversationId,
      schoolId: actor.schoolId,
      conversation: { participants: { some: { userId: actor.userId } } },
    },
  });
  if (!allowed) {
    throw new CollaborationNotFoundError("Không tìm thấy tệp đính kèm.");
  }
  return link.file;
}

export async function markConversationRead(
  actor: AuthorizationContext,
  conversationId: string,
) {
  requireCollaborationActor(actor, permissions.messageConversationRead);
  const updated = await db.conversationParticipant.updateMany({
    where: {
      conversationId,
      userId: actor.userId,
      conversation: { schoolId: actor.schoolId },
    },
    data: { lastReadAt: new Date() },
  });
  if (updated.count !== 1) {
    throw new CollaborationNotFoundError("Không tìm thấy cuộc trò chuyện.");
  }
  await db.notification.updateMany({
    where: {
      schoolId: actor.schoolId,
      userId: actor.userId,
      href: `/dashboard/messages/${conversationId}`,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

export async function listNotifications(
  actor: AuthorizationContext,
  filters: Readonly<{ status?: "all" | "unread"; type?: string }> = {},
) {
  requireCollaborationActor(actor, permissions.notificationReadOwn);
  const [items, unreadCount, preference] = await Promise.all([
    db.notification.findMany({
      where: {
        schoolId: actor.schoolId,
        userId: actor.userId,
        readAt: filters.status === "unread" ? null : undefined,
        type: filters.type || undefined,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.notification.count({
      where: { schoolId: actor.schoolId, userId: actor.userId, readAt: null },
    }),
    db.notificationPreference.findUnique({
      where: {
        schoolId_userId: { schoolId: actor.schoolId, userId: actor.userId },
      },
    }),
  ]);
  return {
    items,
    unreadCount,
    preference: preference ?? {
      inAppEnabled: true,
      emailEnabled: true,
      messagesEnabled: true,
      mentionsEnabled: true,
    },
  };
}

export async function markAllNotificationsRead(actor: AuthorizationContext) {
  requireCollaborationActor(actor, permissions.notificationReadOwn);
  return db.notification.updateMany({
    where: {
      schoolId: actor.schoolId,
      userId: actor.userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

export async function getNotificationSummary(actor: AuthorizationContext) {
  requireCollaborationActor(actor, permissions.notificationReadOwn);
  const [items, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { schoolId: actor.schoolId, userId: actor.userId },
      select: {
        id: true,
        title: true,
        body: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.notification.count({
      where: { schoolId: actor.schoolId, userId: actor.userId, readAt: null },
    }),
  ]);
  return { items, unreadCount };
}

export async function markNotificationRead(
  actor: AuthorizationContext,
  notificationId: string,
) {
  requireCollaborationActor(actor, permissions.notificationReadOwn);
  const updated = await db.notification.updateMany({
    where: {
      id: notificationId,
      schoolId: actor.schoolId,
      userId: actor.userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  if (updated.count !== 1) {
    const exists = await db.notification.count({
      where: { id: notificationId, schoolId: actor.schoolId, userId: actor.userId },
    });
    if (!exists) throw new CollaborationNotFoundError("Không tìm thấy thông báo.");
  }
}

export async function updateNotificationPreference(
  actor: AuthorizationContext,
  input: Readonly<{
    inAppEnabled: boolean;
    emailEnabled: boolean;
    messagesEnabled: boolean;
    mentionsEnabled: boolean;
  }>,
) {
  requireCollaborationActor(actor, permissions.notificationPreferencesUpdateOwn);
  return db.$transaction(async (transaction) => {
    const preference = await transaction.notificationPreference.upsert({
      where: {
        schoolId_userId: { schoolId: actor.schoolId, userId: actor.userId },
      },
      create: {
        schoolId: actor.schoolId,
        userId: actor.userId,
        ...input,
      },
      update: input,
    });
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        actorType: "USER",
        action: "NOTIFICATION_PREFERENCES_UPDATED",
        entityType: "NotificationPreference",
        entityId: preference.id,
        afterJson: input,
        requestId: randomUUID(),
      },
    });
    return preference;
  });
}

export async function listActivityFeed(actor: AuthorizationContext) {
  requireCollaborationActor(actor, permissions.notificationReadOwn);
  return db.activityFeedProjection.findMany({
    where: {
      schoolId: actor.schoolId,
      OR: [{ userId: actor.userId }, { userId: null }],
    },
    include: { actor: { select: { displayName: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
