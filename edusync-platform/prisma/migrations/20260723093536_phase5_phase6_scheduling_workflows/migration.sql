-- CreateEnum
CREATE TYPE "CalendarVisibility" AS ENUM ('PRIVATE', 'SCHOOL');

-- CreateEnum
CREATE TYPE "CalendarEventStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "CalendarBookingStatus" AS ENUM ('BOOKED', 'WAITLISTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CalendarAttendanceStatus" AS ENUM ('SCHEDULED', 'PRESENT', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "WorkflowTemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "WorkflowFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'SELECT', 'CHECKBOX', 'FILE');

-- CreateEnum
CREATE TYPE "WorkflowSubmissionStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "WorkflowStepStatus" AS ENUM ('PENDING', 'ACTIVE', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "WorkflowDecisionType" AS ENUM ('APPROVE', 'REJECT', 'REQUEST_CHANGES');

-- CreateTable
CREATE TABLE "CalendarSource" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'EDUTECH',
    "externalKey" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CalendarSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calendar" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "sourceId" UUID,
    "ownerUserId" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "CalendarVisibility" NOT NULL DEFAULT 'SCHOOL',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurrenceRule" (
    "id" UUID NOT NULL,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "count" INTEGER,
    "until" TIMESTAMPTZ(6),
    "byWeekday" INTEGER[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurrenceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurrenceException" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "movedTo" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurrenceException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookableResource" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'ROOM',
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BookableResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedPeriod" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "calendarId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "resourceId" UUID,
    "recurrenceRuleId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "status" "CalendarEventStatus" NOT NULL DEFAULT 'CONFIRMED',
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarBooking" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "calendarId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "CalendarBookingStatus" NOT NULL DEFAULT 'BOOKED',
    "position" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CalendarBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarAttendance" (
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

    CONSTRAINT "CalendarAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarReminder" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "minutesBefore" INTEGER NOT NULL,
    "sentAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkflowTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersionId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowVersion" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "publishedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowFieldDefinition" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "WorkflowFieldType" NOT NULL,
    "position" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "optionsJson" JSONB NOT NULL DEFAULT '[]',
    "rulesJson" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "WorkflowFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowApprovalStep" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "role" "SchoolRole" NOT NULL,
    "deadlineHours" INTEGER,
    "conditionJson" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "WorkflowApprovalStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowSubmission" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "status" "WorkflowSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WorkflowSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowSubmissionValue" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WorkflowSubmissionValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowSubmissionStep" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "stepId" UUID NOT NULL,
    "status" "WorkflowStepStatus" NOT NULL DEFAULT 'PENDING',
    "assignedUserId" UUID,
    "dueAt" TIMESTAMPTZ(6),
    "actedAt" TIMESTAMPTZ(6),

    CONSTRAINT "WorkflowSubmissionStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowDecision" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "stepId" UUID NOT NULL,
    "actorUserId" UUID NOT NULL,
    "type" "WorkflowDecisionType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowSubmissionHistory" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "actorUserId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" "WorkflowSubmissionStatus",
    "toStatus" "WorkflowSubmissionStatus" NOT NULL,
    "metadataJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowSubmissionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarSource_schoolId_active_idx" ON "CalendarSource"("schoolId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSource_schoolId_name_key" ON "CalendarSource"("schoolId", "name");

-- CreateIndex
CREATE INDEX "Calendar_schoolId_visibility_active_idx" ON "Calendar"("schoolId", "visibility", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Calendar_id_schoolId_key" ON "Calendar"("id", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Calendar_schoolId_name_key" ON "Calendar"("schoolId", "name");

-- CreateIndex
CREATE INDEX "RecurrenceException_eventId_startsAt_idx" ON "RecurrenceException"("eventId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecurrenceException_eventId_startsAt_key" ON "RecurrenceException"("eventId", "startsAt");

-- CreateIndex
CREATE INDEX "BookableResource_schoolId_active_idx" ON "BookableResource"("schoolId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "BookableResource_schoolId_name_key" ON "BookableResource"("schoolId", "name");

-- CreateIndex
CREATE INDEX "BlockedPeriod_schoolId_startsAt_endsAt_idx" ON "BlockedPeriod"("schoolId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "BlockedPeriod_resourceId_startsAt_endsAt_idx" ON "BlockedPeriod"("resourceId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_schoolId_startsAt_endsAt_idx" ON "CalendarEvent"("schoolId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_calendarId_startsAt_idx" ON "CalendarEvent"("calendarId", "startsAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_resourceId_startsAt_endsAt_idx" ON "CalendarEvent"("resourceId", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_id_schoolId_key" ON "CalendarEvent"("id", "schoolId");

-- CreateIndex
CREATE INDEX "CalendarBooking_schoolId_status_createdAt_idx" ON "CalendarBooking"("schoolId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CalendarBooking_eventId_status_position_idx" ON "CalendarBooking"("eventId", "status", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarBooking_eventId_userId_key" ON "CalendarBooking"("eventId", "userId");

-- CreateIndex
CREATE INDEX "CalendarAttendance_schoolId_status_idx" ON "CalendarAttendance"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarAttendance_eventId_userId_key" ON "CalendarAttendance"("eventId", "userId");

-- CreateIndex
CREATE INDEX "CalendarReminder_schoolId_sentAt_idx" ON "CalendarReminder"("schoolId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarReminder_eventId_minutesBefore_key" ON "CalendarReminder"("eventId", "minutesBefore");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_schoolId_status_idx" ON "WorkflowTemplate"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplate_schoolId_slug_key" ON "WorkflowTemplate"("schoolId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowVersion_templateId_version_key" ON "WorkflowVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "WorkflowFieldDefinition_versionId_position_idx" ON "WorkflowFieldDefinition"("versionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowFieldDefinition_versionId_key_key" ON "WorkflowFieldDefinition"("versionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowApprovalStep_versionId_position_key" ON "WorkflowApprovalStep"("versionId", "position");

-- CreateIndex
CREATE INDEX "WorkflowSubmission_schoolId_status_updatedAt_idx" ON "WorkflowSubmission"("schoolId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "WorkflowSubmission_ownerUserId_status_idx" ON "WorkflowSubmission"("ownerUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowSubmissionValue_submissionId_fieldKey_key" ON "WorkflowSubmissionValue"("submissionId", "fieldKey");

-- CreateIndex
CREATE INDEX "WorkflowSubmissionStep_assignedUserId_status_dueAt_idx" ON "WorkflowSubmissionStep"("assignedUserId", "status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowSubmissionStep_submissionId_stepId_key" ON "WorkflowSubmissionStep"("submissionId", "stepId");

-- CreateIndex
CREATE INDEX "WorkflowDecision_submissionId_createdAt_idx" ON "WorkflowDecision"("submissionId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowSubmissionHistory_submissionId_createdAt_idx" ON "WorkflowSubmissionHistory"("submissionId", "createdAt");

-- AddForeignKey
ALTER TABLE "CalendarSource" ADD CONSTRAINT "CalendarSource_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CalendarSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurrenceException" ADD CONSTRAINT "RecurrenceException_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookableResource" ADD CONSTRAINT "BookableResource_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookableResource" ADD CONSTRAINT "BookableResource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedPeriod" ADD CONSTRAINT "BlockedPeriod_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedPeriod" ADD CONSTRAINT "BlockedPeriod_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "BookableResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_calendarId_schoolId_fkey" FOREIGN KEY ("calendarId", "schoolId") REFERENCES "Calendar"("id", "schoolId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "BookableResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_recurrenceRuleId_fkey" FOREIGN KEY ("recurrenceRuleId") REFERENCES "RecurrenceRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarBooking" ADD CONSTRAINT "CalendarBooking_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarBooking" ADD CONSTRAINT "CalendarBooking_calendarId_schoolId_fkey" FOREIGN KEY ("calendarId", "schoolId") REFERENCES "Calendar"("id", "schoolId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarBooking" ADD CONSTRAINT "CalendarBooking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarBooking" ADD CONSTRAINT "CalendarBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarAttendance" ADD CONSTRAINT "CalendarAttendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarAttendance" ADD CONSTRAINT "CalendarAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarAttendance" ADD CONSTRAINT "CalendarAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarAttendance" ADD CONSTRAINT "CalendarAttendance_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarReminder" ADD CONSTRAINT "CalendarReminder_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarReminder" ADD CONSTRAINT "CalendarReminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowVersion" ADD CONSTRAINT "WorkflowVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowFieldDefinition" ADD CONSTRAINT "WorkflowFieldDefinition_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "WorkflowVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowApprovalStep" ADD CONSTRAINT "WorkflowApprovalStep_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "WorkflowVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowSubmission" ADD CONSTRAINT "WorkflowSubmission_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowSubmission" ADD CONSTRAINT "WorkflowSubmission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowSubmission" ADD CONSTRAINT "WorkflowSubmission_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "WorkflowVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowSubmission" ADD CONSTRAINT "WorkflowSubmission_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowSubmissionValue" ADD CONSTRAINT "WorkflowSubmissionValue_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WorkflowSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowSubmissionStep" ADD CONSTRAINT "WorkflowSubmissionStep_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WorkflowSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowSubmissionStep" ADD CONSTRAINT "WorkflowSubmissionStep_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowApprovalStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowDecision" ADD CONSTRAINT "WorkflowDecision_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WorkflowSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowDecision" ADD CONSTRAINT "WorkflowDecision_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowSubmissionHistory" ADD CONSTRAINT "WorkflowSubmissionHistory_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WorkflowSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowSubmissionHistory" ADD CONSTRAINT "WorkflowSubmissionHistory_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
