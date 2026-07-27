ALTER TABLE "DomainOutboxEvent" ADD COLUMN "dedupeKey" TEXT;
CREATE UNIQUE INDEX "DomainOutboxEvent_dedupeKey_key" ON "DomainOutboxEvent"("dedupeKey");

CREATE TABLE "Conversation" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConversationParticipant" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMPTZ(6),
    "mutedAt" TIMESTAMPTZ(6),
    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "senderUserId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "editedAt" TIMESTAMPTZ(6),
    "deletedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageMention" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageMention_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "readAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationPreference" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "messagesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "mentionsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityFeedProjection" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "userId" UUID,
    "actorUserId" UUID,
    "eventType" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "href" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityFeedProjection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Conversation_id_schoolId_key" ON "Conversation"("id", "schoolId");
CREATE INDEX "Conversation_schoolId_updatedAt_idx" ON "Conversation"("schoolId", "updatedAt");
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");
CREATE INDEX "ConversationParticipant_userId_lastReadAt_idx" ON "ConversationParticipant"("userId", "lastReadAt");
CREATE INDEX "Message_schoolId_conversationId_createdAt_idx" ON "Message"("schoolId", "conversationId", "createdAt");
CREATE INDEX "Message_senderUserId_createdAt_idx" ON "Message"("senderUserId", "createdAt");
CREATE UNIQUE INDEX "MessageMention_messageId_userId_key" ON "MessageMention"("messageId", "userId");
CREATE INDEX "MessageMention_userId_createdAt_idx" ON "MessageMention"("userId", "createdAt");
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
CREATE INDEX "Notification_schoolId_userId_readAt_createdAt_idx" ON "Notification"("schoolId", "userId", "readAt", "createdAt");
CREATE UNIQUE INDEX "NotificationPreference_schoolId_userId_key" ON "NotificationPreference"("schoolId", "userId");
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");
CREATE UNIQUE INDEX "ActivityFeedProjection_dedupeKey_key" ON "ActivityFeedProjection"("dedupeKey");
CREATE INDEX "ActivityFeedProjection_schoolId_userId_createdAt_idx" ON "ActivityFeedProjection"("schoolId", "userId", "createdAt");
CREATE INDEX "ActivityFeedProjection_schoolId_eventType_createdAt_idx" ON "ActivityFeedProjection"("schoolId", "eventType", "createdAt");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_schoolId_fkey" FOREIGN KEY ("conversationId", "schoolId") REFERENCES "Conversation"("id", "schoolId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MessageMention" ADD CONSTRAINT "MessageMention_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageMention" ADD CONSTRAINT "MessageMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityFeedProjection" ADD CONSTRAINT "ActivityFeedProjection_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivityFeedProjection" ADD CONSTRAINT "ActivityFeedProjection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityFeedProjection" ADD CONSTRAINT "ActivityFeedProjection_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
