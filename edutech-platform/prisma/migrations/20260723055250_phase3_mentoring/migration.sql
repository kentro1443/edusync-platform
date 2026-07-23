-- CreateEnum
CREATE TYPE "MentorVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MentorAssignmentStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "AvailabilityExceptionKind" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'WAITLISTED', 'COMPLETED', 'CANCELLED', 'DECLINED');

-- CreateEnum
CREATE TYPE "AppointmentWaitlistStatus" AS ENUM ('WAITING', 'PROMOTED', 'LEFT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('SCHEDULED', 'PRESENT', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "MentoringCaseStatus" AS ENUM ('OPEN', 'ON_HOLD', 'CLOSED');

-- CreateEnum
CREATE TYPE "MentoringGoalStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MentoringTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MentoringReferralStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MentoringNoteVisibility" AS ENUM ('PRIVATE_COUNSELOR', 'STUDENT_VISIBLE', 'GUARDIAN_VISIBLE', 'STAFF_VISIBLE');

-- CreateTable
CREATE TABLE "MentorProfile" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "headline" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "verificationStatus" "MentorVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedByUserId" UUID,
    "verifiedAt" TIMESTAMPTZ(6),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MentorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorSpecialty" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorSpecialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorProfileSpecialty" (
    "mentorProfileId" UUID NOT NULL,
    "specialtyId" UUID NOT NULL,

    CONSTRAINT "MentorProfileSpecialty_pkey" PRIMARY KEY ("mentorProfileId","specialtyId")
);

-- CreateTable
CREATE TABLE "MentorStudentAssignment" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "mentorProfileId" UUID NOT NULL,
    "studentUserId" UUID NOT NULL,
    "status" "MentorAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6),
    "assignedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MentorStudentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorAvailabilityRule" (
    "id" UUID NOT NULL,
    "mentorProfileId" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startsAtLocal" TEXT NOT NULL,
    "endsAtLocal" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MentorAvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorAvailabilityException" (
    "id" UUID NOT NULL,
    "mentorProfileId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "kind" "AvailabilityExceptionKind" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorAvailabilityException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentType" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "mentorProfileId" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AppointmentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "appointmentTypeId" UUID NOT NULL,
    "organizerUserId" UUID NOT NULL,
    "studentUserId" UUID NOT NULL,
    "mentorUserId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "location" TEXT,
    "studentMessage" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentTransition" (
    "id" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "fromStatus" "AppointmentStatus" NOT NULL,
    "toStatus" "AppointmentStatus" NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" UUID NOT NULL,
    "reason" TEXT,
    "metadataJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentWaitlistEntry" (
    "id" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "AppointmentWaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "joinedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promotedAt" TIMESTAMPTZ(6),
    "leftAt" TIMESTAMPTZ(6),

    CONSTRAINT "AppointmentWaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentAttendance" (
    "id" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "checkedInAt" TIMESTAMPTZ(6),
    "recordedByUserId" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AppointmentAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentoringCase" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "studentUserId" UUID NOT NULL,
    "primaryMentorProfileId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" "MentoringCaseStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMPTZ(6),
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MentoringCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentoringGoal" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetAt" TIMESTAMPTZ(6),
    "status" "MentoringGoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MentoringGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentoringSessionOutcome" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "progress" TEXT,
    "nextSteps" TEXT,
    "completedByUserId" UUID NOT NULL,
    "completedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MentoringSessionOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentoringTask" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "assigneeUserId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMPTZ(6),
    "status" "MentoringTaskStatus" NOT NULL DEFAULT 'TODO',
    "createdByUserId" UUID NOT NULL,
    "completedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MentoringTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentoringReferral" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "studentUserId" UUID NOT NULL,
    "destination" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "MentoringReferralStatus" NOT NULL DEFAULT 'DRAFT',
    "createdByUserId" UUID NOT NULL,
    "sentAt" TIMESTAMPTZ(6),
    "resolvedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MentoringReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentoringNote" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "appointmentId" UUID,
    "studentUserId" UUID NOT NULL,
    "authorUserId" UUID NOT NULL,
    "visibility" "MentoringNoteVisibility" NOT NULL,
    "encryptedBody" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MentoringNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MentorProfile_schoolId_verificationStatus_active_idx" ON "MentorProfile"("schoolId", "verificationStatus", "active");

-- CreateIndex
CREATE UNIQUE INDEX "MentorProfile_schoolId_userId_key" ON "MentorProfile"("schoolId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorProfile_id_schoolId_key" ON "MentorProfile"("id", "schoolId");

-- CreateIndex
CREATE INDEX "MentorSpecialty_schoolId_name_idx" ON "MentorSpecialty"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MentorSpecialty_schoolId_slug_key" ON "MentorSpecialty"("schoolId", "slug");

-- CreateIndex
CREATE INDEX "MentorProfileSpecialty_specialtyId_idx" ON "MentorProfileSpecialty"("specialtyId");

-- CreateIndex
CREATE INDEX "MentorStudentAssignment_schoolId_studentUserId_status_idx" ON "MentorStudentAssignment"("schoolId", "studentUserId", "status");

-- CreateIndex
CREATE INDEX "MentorStudentAssignment_mentorProfileId_status_idx" ON "MentorStudentAssignment"("mentorProfileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MentorStudentAssignment_schoolId_mentorProfileId_studentUse_key" ON "MentorStudentAssignment"("schoolId", "mentorProfileId", "studentUserId");

-- CreateIndex
CREATE INDEX "MentorAvailabilityRule_mentorProfileId_weekday_active_idx" ON "MentorAvailabilityRule"("mentorProfileId", "weekday", "active");

-- CreateIndex
CREATE INDEX "MentorAvailabilityException_mentorProfileId_startsAt_endsAt_idx" ON "MentorAvailabilityException"("mentorProfileId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "AppointmentType_schoolId_active_idx" ON "AppointmentType"("schoolId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentType_schoolId_name_mentorProfileId_key" ON "AppointmentType"("schoolId", "name", "mentorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentType_id_schoolId_key" ON "AppointmentType"("id", "schoolId");

-- CreateIndex
CREATE INDEX "Appointment_schoolId_startsAt_idx" ON "Appointment"("schoolId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_schoolId_mentorUserId_startsAt_idx" ON "Appointment"("schoolId", "mentorUserId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_schoolId_studentUserId_startsAt_idx" ON "Appointment"("schoolId", "studentUserId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_schoolId_status_startsAt_idx" ON "Appointment"("schoolId", "status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_id_schoolId_key" ON "Appointment"("id", "schoolId");

-- CreateIndex
CREATE INDEX "AppointmentTransition_appointmentId_createdAt_idx" ON "AppointmentTransition"("appointmentId", "createdAt");

-- CreateIndex
CREATE INDEX "AppointmentTransition_actorUserId_createdAt_idx" ON "AppointmentTransition"("actorUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentWaitlistEntry_appointmentId_key" ON "AppointmentWaitlistEntry"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentWaitlistEntry_status_joinedAt_id_idx" ON "AppointmentWaitlistEntry"("status", "joinedAt", "id");

-- CreateIndex
CREATE INDEX "AppointmentWaitlistEntry_userId_status_idx" ON "AppointmentWaitlistEntry"("userId", "status");

-- CreateIndex
CREATE INDEX "AppointmentAttendance_userId_status_idx" ON "AppointmentAttendance"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentAttendance_appointmentId_userId_key" ON "AppointmentAttendance"("appointmentId", "userId");

-- CreateIndex
CREATE INDEX "MentoringCase_schoolId_studentUserId_status_idx" ON "MentoringCase"("schoolId", "studentUserId", "status");

-- CreateIndex
CREATE INDEX "MentoringCase_primaryMentorProfileId_status_idx" ON "MentoringCase"("primaryMentorProfileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MentoringCase_id_schoolId_key" ON "MentoringCase"("id", "schoolId");

-- CreateIndex
CREATE INDEX "MentoringGoal_caseId_status_idx" ON "MentoringGoal"("caseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MentoringSessionOutcome_appointmentId_key" ON "MentoringSessionOutcome"("appointmentId");

-- CreateIndex
CREATE INDEX "MentoringSessionOutcome_caseId_completedAt_idx" ON "MentoringSessionOutcome"("caseId", "completedAt");

-- CreateIndex
CREATE INDEX "MentoringTask_schoolId_assigneeUserId_status_dueAt_idx" ON "MentoringTask"("schoolId", "assigneeUserId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "MentoringTask_caseId_status_idx" ON "MentoringTask"("caseId", "status");

-- CreateIndex
CREATE INDEX "MentoringReferral_schoolId_studentUserId_status_idx" ON "MentoringReferral"("schoolId", "studentUserId", "status");

-- CreateIndex
CREATE INDEX "MentoringReferral_caseId_status_idx" ON "MentoringReferral"("caseId", "status");

-- CreateIndex
CREATE INDEX "MentoringNote_schoolId_studentUserId_createdAt_idx" ON "MentoringNote"("schoolId", "studentUserId", "createdAt");

-- CreateIndex
CREATE INDEX "MentoringNote_caseId_createdAt_idx" ON "MentoringNote"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "MentoringNote_authorUserId_createdAt_idx" ON "MentoringNote"("authorUserId", "createdAt");

-- Domain constraints
ALTER TABLE "MentorProfile"
  ADD CONSTRAINT "MentorProfile_yearsExperience_check"
  CHECK ("yearsExperience" >= 0);

ALTER TABLE "MentorAvailabilityRule"
  ADD CONSTRAINT "MentorAvailabilityRule_weekday_check"
  CHECK ("weekday" BETWEEN 0 AND 6),
  ADD CONSTRAINT "MentorAvailabilityRule_capacity_check"
  CHECK ("capacity" > 0),
  ADD CONSTRAINT "MentorAvailabilityRule_time_check"
  CHECK ("startsAtLocal" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    AND "endsAtLocal" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    AND "startsAtLocal" < "endsAtLocal");

ALTER TABLE "MentorAvailabilityException"
  ADD CONSTRAINT "MentorAvailabilityException_range_check"
  CHECK ("startsAt" < "endsAt");

ALTER TABLE "AppointmentType"
  ADD CONSTRAINT "AppointmentType_durationMinutes_check"
  CHECK ("durationMinutes" BETWEEN 15 AND 480),
  ADD CONSTRAINT "AppointmentType_capacity_check"
  CHECK ("capacity" > 0);

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_range_check"
  CHECK ("startsAt" < "endsAt"),
  ADD CONSTRAINT "Appointment_capacity_check"
  CHECK ("capacity" > 0);

ALTER TABLE "AppointmentWaitlistEntry"
  ADD CONSTRAINT "AppointmentWaitlistEntry_position_check"
  CHECK ("position" > 0);

ALTER TABLE "MentoringGoal"
  ADD CONSTRAINT "MentoringGoal_progressPercent_check"
  CHECK ("progressPercent" BETWEEN 0 AND 100);

-- Transactional overlap protection. WAITLISTED/CANCELLED/DECLINED/COMPLETED
-- records remain in history but do not reserve a live time range.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_no_mentor_overlap"
  EXCLUDE USING gist (
    "schoolId" WITH =,
    "mentorUserId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
  )
  WHERE ("status" IN ('REQUESTED', 'CONFIRMED'));

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_no_student_overlap"
  EXCLUDE USING gist (
    "schoolId" WITH =,
    "studentUserId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
  )
  WHERE ("status" IN ('REQUESTED', 'CONFIRMED'));

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSpecialty" ADD CONSTRAINT "MentorSpecialty_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProfileSpecialty" ADD CONSTRAINT "MentorProfileSpecialty_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProfileSpecialty" ADD CONSTRAINT "MentorProfileSpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "MentorSpecialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorStudentAssignment" ADD CONSTRAINT "MentorStudentAssignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorStudentAssignment" ADD CONSTRAINT "MentorStudentAssignment_mentorProfileId_schoolId_fkey" FOREIGN KEY ("mentorProfileId", "schoolId") REFERENCES "MentorProfile"("id", "schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorStudentAssignment" ADD CONSTRAINT "MentorStudentAssignment_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorStudentAssignment" ADD CONSTRAINT "MentorStudentAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAvailabilityRule" ADD CONSTRAINT "MentorAvailabilityRule_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAvailabilityException" ADD CONSTRAINT "MentorAvailabilityException_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentType" ADD CONSTRAINT "AppointmentType_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentType" ADD CONSTRAINT "AppointmentType_mentorProfileId_schoolId_fkey" FOREIGN KEY ("mentorProfileId", "schoolId") REFERENCES "MentorProfile"("id", "schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_appointmentTypeId_schoolId_fkey" FOREIGN KEY ("appointmentTypeId", "schoolId") REFERENCES "AppointmentType"("id", "schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_organizerUserId_fkey" FOREIGN KEY ("organizerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_mentorUserId_fkey" FOREIGN KEY ("mentorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentTransition" ADD CONSTRAINT "AppointmentTransition_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentTransition" ADD CONSTRAINT "AppointmentTransition_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentWaitlistEntry" ADD CONSTRAINT "AppointmentWaitlistEntry_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentWaitlistEntry" ADD CONSTRAINT "AppointmentWaitlistEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAttendance" ADD CONSTRAINT "AppointmentAttendance_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAttendance" ADD CONSTRAINT "AppointmentAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAttendance" ADD CONSTRAINT "AppointmentAttendance_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringCase" ADD CONSTRAINT "MentoringCase_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringCase" ADD CONSTRAINT "MentoringCase_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringCase" ADD CONSTRAINT "MentoringCase_primaryMentorProfileId_schoolId_fkey" FOREIGN KEY ("primaryMentorProfileId", "schoolId") REFERENCES "MentorProfile"("id", "schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringCase" ADD CONSTRAINT "MentoringCase_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringGoal" ADD CONSTRAINT "MentoringGoal_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "MentoringCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringGoal" ADD CONSTRAINT "MentoringGoal_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringSessionOutcome" ADD CONSTRAINT "MentoringSessionOutcome_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "MentoringCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringSessionOutcome" ADD CONSTRAINT "MentoringSessionOutcome_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringSessionOutcome" ADD CONSTRAINT "MentoringSessionOutcome_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringTask" ADD CONSTRAINT "MentoringTask_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringTask" ADD CONSTRAINT "MentoringTask_caseId_schoolId_fkey" FOREIGN KEY ("caseId", "schoolId") REFERENCES "MentoringCase"("id", "schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringTask" ADD CONSTRAINT "MentoringTask_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringTask" ADD CONSTRAINT "MentoringTask_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringReferral" ADD CONSTRAINT "MentoringReferral_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringReferral" ADD CONSTRAINT "MentoringReferral_caseId_schoolId_fkey" FOREIGN KEY ("caseId", "schoolId") REFERENCES "MentoringCase"("id", "schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringReferral" ADD CONSTRAINT "MentoringReferral_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringReferral" ADD CONSTRAINT "MentoringReferral_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringNote" ADD CONSTRAINT "MentoringNote_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringNote" ADD CONSTRAINT "MentoringNote_caseId_schoolId_fkey" FOREIGN KEY ("caseId", "schoolId") REFERENCES "MentoringCase"("id", "schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringNote" ADD CONSTRAINT "MentoringNote_appointmentId_schoolId_fkey" FOREIGN KEY ("appointmentId", "schoolId") REFERENCES "Appointment"("id", "schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringNote" ADD CONSTRAINT "MentoringNote_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
