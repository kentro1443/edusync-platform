ALTER TABLE "Invitation"
ADD COLUMN "revokedAt" TIMESTAMPTZ(6),
ADD COLUMN "lastSentAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "sendCount" INTEGER NOT NULL DEFAULT 1;

DROP INDEX "Invitation_schoolId_expiresAt_idx";
CREATE INDEX "Invitation_schoolId_revokedAt_expiresAt_idx"
ON "Invitation"("schoolId", "revokedAt", "expiresAt");

ALTER TABLE "Session"
ADD COLUMN "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN "revokedAt" TIMESTAMPTZ(6),
ADD COLUMN "revokeReason" TEXT,
ADD COLUMN "lastSeenAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "userAgent" TEXT,
ADD COLUMN "ipHash" TEXT;

CREATE UNIQUE INDEX "Session_id_key" ON "Session"("id");
DROP INDEX "Session_userId_idx";
DROP INDEX "Session_expires_idx";
CREATE INDEX "Session_userId_revokedAt_expires_idx" ON "Session"("userId", "revokedAt", "expires");
CREATE INDEX "Session_expires_revokedAt_idx" ON "Session"("expires", "revokedAt");

ALTER TABLE "PasswordResetToken" ADD COLUMN "revokedAt" TIMESTAMPTZ(6);
DROP INDEX "PasswordResetToken_userId_expiresAt_idx";
CREATE INDEX "PasswordResetToken_userId_revokedAt_expiresAt_idx"
ON "PasswordResetToken"("userId", "revokedAt", "expiresAt");

CREATE TABLE "AuthRateLimit" (
    "keyHash" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMPTZ(6) NOT NULL,
    "blockedUntil" TIMESTAMPTZ(6),
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("keyHash")
);

CREATE INDEX "AuthRateLimit_action_updatedAt_idx" ON "AuthRateLimit"("action", "updatedAt");
CREATE INDEX "AuthRateLimit_blockedUntil_idx" ON "AuthRateLimit"("blockedUntil");

CREATE INDEX "AuditEvent_schoolId_action_createdAt_idx"
ON "AuditEvent"("schoolId", "action", "createdAt");
CREATE INDEX "AuditEvent_entityType_entityId_createdAt_idx"
ON "AuditEvent"("entityType", "entityId", "createdAt");

ALTER TABLE "EmailOutbox" ALTER COLUMN "schoolId" DROP NOT NULL;
