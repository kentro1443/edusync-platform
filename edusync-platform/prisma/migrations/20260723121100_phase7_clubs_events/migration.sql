-- CreateEnum
CREATE TYPE "ClubStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ClubApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ClubMembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'LEFT', 'REJECTED');

-- CreateEnum
CREATE TYPE "ClubRole" AS ENUM ('MEMBER', 'LEADER', 'ADVISOR');

-- CreateEnum
CREATE TYPE "ClubTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClubEventStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ClubRegistrationStatus" AS ENUM ('REGISTERED', 'WAITLISTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClubConsentStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateTable
CREATE TABLE "Club" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "ClubStatus" NOT NULL DEFAULT 'DRAFT',
    "capacity" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubApplication" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "applicantUserId" UUID NOT NULL,
    "status" "ClubApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "motivation" TEXT,
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ClubApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMembership" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "ClubRole" NOT NULL DEFAULT 'MEMBER',
    "status" "ClubMembershipStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ClubMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubAnnouncement" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "authorUserId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publishedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubTask" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "assigneeUserId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ClubTaskStatus" NOT NULL DEFAULT 'TODO',
    "dueAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ClubTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubEvent" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "location" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "status" "ClubEventStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ClubEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubRegistration" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "ClubRegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "position" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ClubRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubConsent" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "guardianId" UUID NOT NULL,
    "status" "ClubConsentStatus" NOT NULL DEFAULT 'PENDING',
    "decidedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ClubConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubAttendance" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "CalendarAttendanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "checkedInAt" TIMESTAMPTZ(6),
    "recordedByUserId" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ClubAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubBudget" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "spent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ClubBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubExpense" (
    "id" UUID NOT NULL,
    "budgetId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "spentAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubSafetyPlan" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "details" TEXT NOT NULL,
    "approvedById" UUID,
    "approvedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ClubSafetyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubPostEventReport" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "submittedById" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ClubPostEventReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Club_schoolId_status_updatedAt_idx" ON "Club"("schoolId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Club_schoolId_slug_key" ON "Club"("schoolId", "slug");

-- CreateIndex
CREATE INDEX "ClubApplication_schoolId_status_createdAt_idx" ON "ClubApplication"("schoolId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClubApplication_clubId_applicantUserId_key" ON "ClubApplication"("clubId", "applicantUserId");

-- CreateIndex
CREATE INDEX "ClubMembership_schoolId_status_idx" ON "ClubMembership"("schoolId", "status");

-- CreateIndex
CREATE INDEX "ClubMembership_clubId_role_status_idx" ON "ClubMembership"("clubId", "role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMembership_clubId_userId_key" ON "ClubMembership"("clubId", "userId");

-- CreateIndex
CREATE INDEX "ClubAnnouncement_schoolId_clubId_publishedAt_idx" ON "ClubAnnouncement"("schoolId", "clubId", "publishedAt");

-- CreateIndex
CREATE INDEX "ClubTask_schoolId_clubId_status_dueAt_idx" ON "ClubTask"("schoolId", "clubId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "ClubEvent_schoolId_startsAt_endsAt_idx" ON "ClubEvent"("schoolId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "ClubEvent_clubId_status_startsAt_idx" ON "ClubEvent"("clubId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "ClubRegistration_schoolId_status_createdAt_idx" ON "ClubRegistration"("schoolId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ClubRegistration_eventId_status_position_idx" ON "ClubRegistration"("eventId", "status", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ClubRegistration_eventId_userId_key" ON "ClubRegistration"("eventId", "userId");

-- CreateIndex
CREATE INDEX "ClubConsent_schoolId_guardianId_status_idx" ON "ClubConsent"("schoolId", "guardianId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClubConsent_eventId_studentId_guardianId_key" ON "ClubConsent"("eventId", "studentId", "guardianId");

-- CreateIndex
CREATE INDEX "ClubAttendance_schoolId_status_idx" ON "ClubAttendance"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClubAttendance_eventId_userId_key" ON "ClubAttendance"("eventId", "userId");

-- CreateIndex
CREATE INDEX "ClubBudget_schoolId_clubId_status_idx" ON "ClubBudget"("schoolId", "clubId", "status");

-- CreateIndex
CREATE INDEX "ClubExpense_budgetId_spentAt_idx" ON "ClubExpense"("budgetId", "spentAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClubSafetyPlan_eventId_key" ON "ClubSafetyPlan"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubPostEventReport_eventId_key" ON "ClubPostEventReport"("eventId");

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubApplication" ADD CONSTRAINT "ClubApplication_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubApplication" ADD CONSTRAINT "ClubApplication_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubApplication" ADD CONSTRAINT "ClubApplication_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubApplication" ADD CONSTRAINT "ClubApplication_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubAnnouncement" ADD CONSTRAINT "ClubAnnouncement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubAnnouncement" ADD CONSTRAINT "ClubAnnouncement_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubAnnouncement" ADD CONSTRAINT "ClubAnnouncement_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubTask" ADD CONSTRAINT "ClubTask_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubTask" ADD CONSTRAINT "ClubTask_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubTask" ADD CONSTRAINT "ClubTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubTask" ADD CONSTRAINT "ClubTask_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubEvent" ADD CONSTRAINT "ClubEvent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubEvent" ADD CONSTRAINT "ClubEvent_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubEvent" ADD CONSTRAINT "ClubEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubRegistration" ADD CONSTRAINT "ClubRegistration_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubRegistration" ADD CONSTRAINT "ClubRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubRegistration" ADD CONSTRAINT "ClubRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubConsent" ADD CONSTRAINT "ClubConsent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubConsent" ADD CONSTRAINT "ClubConsent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubConsent" ADD CONSTRAINT "ClubConsent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubConsent" ADD CONSTRAINT "ClubConsent_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubAttendance" ADD CONSTRAINT "ClubAttendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubAttendance" ADD CONSTRAINT "ClubAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubAttendance" ADD CONSTRAINT "ClubAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubAttendance" ADD CONSTRAINT "ClubAttendance_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubBudget" ADD CONSTRAINT "ClubBudget_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubBudget" ADD CONSTRAINT "ClubBudget_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubExpense" ADD CONSTRAINT "ClubExpense_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "ClubBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubSafetyPlan" ADD CONSTRAINT "ClubSafetyPlan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPostEventReport" ADD CONSTRAINT "ClubPostEventReport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPostEventReport" ADD CONSTRAINT "ClubPostEventReport_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
