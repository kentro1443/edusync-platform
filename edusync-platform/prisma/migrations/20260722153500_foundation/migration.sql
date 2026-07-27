-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'LEFT');

-- CreateEnum
CREATE TYPE "ParentStudentLinkStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('PLATFORM_SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "SchoolRole" AS ENUM ('SCHOOL_ADMIN', 'TEACHER_STAFF', 'MENTOR_COUNSELOR', 'STUDENT', 'PARENT_GUARDIAN', 'CLUB_LEADER', 'APPROVER_REVIEWER');

-- CreateEnum
CREATE TYPE "StoredFileStatus" AS ENUM ('PENDING', 'AVAILABLE', 'QUARANTINED', 'DELETED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailOutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarFileId" UUID,
    "locale" TEXT NOT NULL DEFAULT 'vi',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformRoleAssignment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "PlatformRole" NOT NULL,
    "assignedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "logoFileId" UUID,
    "status" "SchoolStatus" NOT NULL DEFAULT 'ACTIVE',
    "planCode" TEXT NOT NULL DEFAULT 'LOCAL',
    "storageQuotaBytes" BIGINT NOT NULL DEFAULT 1073741824,
    "settingsJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolMembership" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "joinedAt" TIMESTAMPTZ(6),
    "leftAt" TIMESTAMPTZ(6),
    "lastActiveAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SchoolMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolRoleAssignment" (
    "id" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "role" "SchoolRole" NOT NULL,
    "assignedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentStudentLink" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "parentUserId" UUID NOT NULL,
    "studentUserId" UUID NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "status" "ParentStudentLinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6),
    "visibilityPolicyJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ParentStudentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "roleHintsJson" JSONB NOT NULL DEFAULT '[]',
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "acceptedAt" TIMESTAMPTZ(6),
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionTokenHash" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionTokenHash")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "usedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredFile" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "sha256" TEXT NOT NULL,
    "status" "StoredFileStatus" NOT NULL DEFAULT 'PENDING',
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileVersion" (
    "id" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "sha256" TEXT NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileLink" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "visibility" TEXT NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "schoolId" UUID,
    "actorUserId" UUID,
    "actorType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainOutboxEvent" (
    "id" UUID NOT NULL,
    "schoolId" UUID,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainOutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "recipientUserId" UUID,
    "toAddress" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" "EmailOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMPTZ(6),
    "lastError" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_normalizedEmail_key" ON "User"("normalizedEmail");

-- CreateIndex
CREATE INDEX "PlatformRoleAssignment_role_idx" ON "PlatformRoleAssignment"("role");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformRoleAssignment_userId_role_key" ON "PlatformRoleAssignment"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "School_slug_key" ON "School"("slug");

-- CreateIndex
CREATE INDEX "School_status_idx" ON "School"("status");

-- CreateIndex
CREATE INDEX "SchoolMembership_schoolId_status_idx" ON "SchoolMembership"("schoolId", "status");

-- CreateIndex
CREATE INDEX "SchoolMembership_userId_status_idx" ON "SchoolMembership"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolMembership_schoolId_userId_key" ON "SchoolMembership"("schoolId", "userId");

-- CreateIndex
CREATE INDEX "SchoolRoleAssignment_role_idx" ON "SchoolRoleAssignment"("role");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolRoleAssignment_membershipId_role_key" ON "SchoolRoleAssignment"("membershipId", "role");

-- CreateIndex
CREATE INDEX "ParentStudentLink_schoolId_status_idx" ON "ParentStudentLink"("schoolId", "status");

-- CreateIndex
CREATE INDEX "ParentStudentLink_parentUserId_status_idx" ON "ParentStudentLink"("parentUserId", "status");

-- CreateIndex
CREATE INDEX "ParentStudentLink_studentUserId_status_idx" ON "ParentStudentLink"("studentUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ParentStudentLink_schoolId_parentUserId_studentUserId_key" ON "ParentStudentLink"("schoolId", "parentUserId", "studentUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_schoolId_normalizedEmail_idx" ON "Invitation"("schoolId", "normalizedEmail");

-- CreateIndex
CREATE INDEX "Invitation_schoolId_expiresAt_idx" ON "Invitation"("schoolId", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "Session"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "StoredFile_storageKey_key" ON "StoredFile"("storageKey");

-- CreateIndex
CREATE INDEX "StoredFile_schoolId_status_idx" ON "StoredFile"("schoolId", "status");

-- CreateIndex
CREATE INDEX "StoredFile_schoolId_sha256_idx" ON "StoredFile"("schoolId", "sha256");

-- CreateIndex
CREATE UNIQUE INDEX "StoredFile_id_schoolId_key" ON "StoredFile"("id", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "FileVersion_storageKey_key" ON "FileVersion"("storageKey");

-- CreateIndex
CREATE INDEX "FileVersion_fileId_createdAt_idx" ON "FileVersion"("fileId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FileVersion_fileId_versionNumber_key" ON "FileVersion"("fileId", "versionNumber");

-- CreateIndex
CREATE INDEX "FileLink_schoolId_entityType_entityId_idx" ON "FileLink"("schoolId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "FileLink_schoolId_fileId_idx" ON "FileLink"("schoolId", "fileId");

-- CreateIndex
CREATE INDEX "AuditEvent_schoolId_createdAt_idx" ON "AuditEvent"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorUserId_createdAt_idx" ON "AuditEvent"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_requestId_idx" ON "AuditEvent"("requestId");

-- CreateIndex
CREATE INDEX "DomainOutboxEvent_status_availableAt_idx" ON "DomainOutboxEvent"("status", "availableAt");

-- CreateIndex
CREATE INDEX "DomainOutboxEvent_schoolId_createdAt_idx" ON "DomainOutboxEvent"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailOutbox_status_createdAt_idx" ON "EmailOutbox"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailOutbox_schoolId_status_idx" ON "EmailOutbox"("schoolId", "status");

-- AddForeignKey
ALTER TABLE "PlatformRoleAssignment" ADD CONSTRAINT "PlatformRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRoleAssignment" ADD CONSTRAINT "PlatformRoleAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolMembership" ADD CONSTRAINT "SchoolMembership_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolMembership" ADD CONSTRAINT "SchoolMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolRoleAssignment" ADD CONSTRAINT "SchoolRoleAssignment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "SchoolMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolRoleAssignment" ADD CONSTRAINT "SchoolRoleAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileVersion" ADD CONSTRAINT "FileVersion_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "StoredFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileVersion" ADD CONSTRAINT "FileVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileLink" ADD CONSTRAINT "FileLink_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileLink" ADD CONSTRAINT "FileLink_fileId_schoolId_fkey" FOREIGN KEY ("fileId", "schoolId") REFERENCES "StoredFile"("id", "schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileLink" ADD CONSTRAINT "FileLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainOutboxEvent" ADD CONSTRAINT "DomainOutboxEvent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
