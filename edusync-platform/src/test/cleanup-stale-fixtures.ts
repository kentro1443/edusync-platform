import { rm } from "node:fs/promises";
import path from "node:path";

import "dotenv/config";
import { Client } from "pg";

const fallbackDatabaseUrl =
  "postgresql://edusync:edusync_local@localhost:5432/edusync?schema=public";

const fixtureSlugExpressions = [
  "^cal-e2e-[0-9a-f]{8}$",
  "^phase2-e2e-[ab]-[0-9a-f]{8}$",
  "^phase2-provisioned-[0-9a-f]{8}$",
  "^phase3-e2e-[0-9a-f]{8}$",
  "^phase4-e2e-[0-9a-f]{8}$",
  "^phase4(-other)?-[0-9a-f]{8}$",
  "^phase56-e2e-[0-9a-f]{8}$",
  "^phase7-e2e-[0-9a-f]{8}$",
  "^phase8-e2e-[0-9a-f]{8}$",
  "^phase9-(e2e|other)-[0-9a-f]{8}$",
  "^mkt(-other)?-[0-9a-f]{8}$",
] as const;

const fixtureEmailPatterns = [
  "%@cal-e2e.local",
  "%@phase2-e2e.local",
  "%@phase3-e2e.local",
  "%@phase4-e2e.local",
  "%@phase56-e2e.local",
  "%@phase7-e2e.local",
  "%@phase8-e2e.local",
  "%@phase9-e2e.local",
] as const;

type CleanupSummary = {
  schools: number;
  users: number;
  storedFiles: number;
};

function storagePath(storageKey: string) {
  const root = path.resolve(process.env.FILE_STORAGE_ROOT ?? "./storage");
  return path.join(
    root,
    storageKey.slice(0, 2),
    storageKey.slice(2, 4),
    storageKey,
  );
}

export async function cleanupStaleTestFixtures(
  databaseUrl = process.env.DATABASE_URL ?? fallbackDatabaseUrl,
): Promise<CleanupSummary> {
  const database = new Client({ connectionString: databaseUrl });
  await database.connect();

  try {
    const schools = await database.query<{ id: string }>(
      `SELECT id
       FROM "School"
       WHERE EXISTS (
         SELECT 1
         FROM unnest($1::text[]) expression
         WHERE slug ~ expression
       )`,
      [fixtureSlugExpressions],
    );
    const schoolIds = schools.rows.map(({ id }) => id);

    if (schoolIds.length === 0) {
      return { schools: 0, users: 0, storedFiles: 0 };
    }

    const users = await database.query<{ id: string }>(
      `SELECT DISTINCT u.id
       FROM "User" u
       LEFT JOIN "SchoolMembership" membership ON membership."userId" = u.id
       WHERE membership."schoolId" = ANY($1::uuid[])
          OR u."normalizedEmail" LIKE ANY($2::text[])`,
      [schoolIds, fixtureEmailPatterns],
    );
    const userIds = users.rows.map(({ id }) => id);
    const files = await database.query<{ storageKey: string }>(
      `SELECT "storageKey"
       FROM "StoredFile"
       WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );
    const recurrenceRules = await database.query<{ recurrenceRuleId: string }>(
      `SELECT DISTINCT "recurrenceRuleId"
       FROM "CalendarEvent"
       WHERE "schoolId" = ANY($1::uuid[])
         AND "recurrenceRuleId" IS NOT NULL`,
      [schoolIds],
    );
    const recurrenceRuleIds = recurrenceRules.rows.map(
      ({ recurrenceRuleId }) => recurrenceRuleId,
    );

    await database.query("BEGIN");

    await database.query(
      `DELETE FROM "WorkflowSubmissionComment"
       WHERE "submissionId" IN (
         SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "WorkflowSubmissionHistory"
       WHERE "submissionId" IN (
         SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "WorkflowDecision"
       WHERE "submissionId" IN (
         SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "WorkflowDelegation" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "WorkflowSubmissionStep"
       WHERE "submissionId" IN (
         SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "WorkflowSubmissionValue"
       WHERE "submissionId" IN (
         SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "WorkflowSubmission" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );

    await database.query(
      `DELETE FROM "FileLink" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "FileVersion"
       WHERE "fileId" IN (
         SELECT id FROM "StoredFile" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "StoredFile" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );

    await database.query(
      `DELETE FROM "ResourceAnalyticsEvent" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "ResourceAnalyticsCounter"
       WHERE "resourceId" IN (
         SELECT id FROM "Resource" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "ResourceCollectionItem"
       WHERE "collectionId" IN (
         SELECT id FROM "ResourceCollection" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "ResourceCollection" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );
    for (const table of [
      "ResourceBookmark",
      "ResourceComment",
      "ResourceReport",
      "ResourceTransition",
    ]) {
      await database.query(
        `DELETE FROM "${table}" WHERE "schoolId" = ANY($1::uuid[])`,
        [schoolIds],
      );
    }
    await database.query(
      `DELETE FROM "ResourceVersion"
       WHERE "resourceId" IN (
         SELECT id FROM "Resource" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "Resource" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );

    await database.query(
      `DELETE FROM "WorkflowApprovalStep"
       WHERE "versionId" IN (
         SELECT id FROM "WorkflowVersion"
         WHERE "templateId" IN (
           SELECT id FROM "WorkflowTemplate" WHERE "schoolId" = ANY($1::uuid[])
         )
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "WorkflowFieldDefinition"
       WHERE "versionId" IN (
         SELECT id FROM "WorkflowVersion"
         WHERE "templateId" IN (
           SELECT id FROM "WorkflowTemplate" WHERE "schoolId" = ANY($1::uuid[])
         )
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "WorkflowVersion"
       WHERE "templateId" IN (
         SELECT id FROM "WorkflowTemplate" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "WorkflowTemplate" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );

    for (const table of [
      "CalendarAttendance",
      "CalendarBooking",
      "CalendarReminder",
    ]) {
      await database.query(
        `DELETE FROM "${table}" WHERE "schoolId" = ANY($1::uuid[])`,
        [schoolIds],
      );
    }
    await database.query(
      `DELETE FROM "RecurrenceException"
       WHERE "eventId" IN (
         SELECT id FROM "CalendarEvent" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "CalendarEvent" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "BlockedPeriod" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "BookableResource" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );
    if (recurrenceRuleIds.length > 0) {
      await database.query(
        `DELETE FROM "RecurrenceRule" WHERE id = ANY($1::uuid[])`,
        [recurrenceRuleIds],
      );
    }
    await database.query(
      `DELETE FROM "Calendar" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "CalendarSource" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );

    for (const table of [
      "AppointmentTransition",
      "AppointmentAttendance",
      "AppointmentWaitlistEntry",
    ]) {
      await database.query(
        `DELETE FROM "${table}"
         WHERE "appointmentId" IN (
           SELECT id FROM "Appointment" WHERE "schoolId" = ANY($1::uuid[])
         )`,
        [schoolIds],
      );
    }
    for (const table of [
      "MentoringNote",
      "MentoringTask",
      "MentoringReferral",
    ]) {
      await database.query(
        `DELETE FROM "${table}" WHERE "schoolId" = ANY($1::uuid[])`,
        [schoolIds],
      );
    }
    await database.query(
      `DELETE FROM "MentoringSessionOutcome"
       WHERE "caseId" IN (
         SELECT id FROM "MentoringCase" WHERE "schoolId" = ANY($1::uuid[])
       )
          OR "appointmentId" IN (
            SELECT id FROM "Appointment" WHERE "schoolId" = ANY($1::uuid[])
          )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "MentoringGoal"
       WHERE "caseId" IN (
         SELECT id FROM "MentoringCase" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    for (const table of [
      "MentoringCase",
      "Appointment",
      "MentorStudentAssignment",
      "AppointmentType",
      "MentorEngagement",
      "MentorOffer",
      "MentorRequest",
    ]) {
      await database.query(
        `DELETE FROM "${table}" WHERE "schoolId" = ANY($1::uuid[])`,
        [schoolIds],
      );
    }
    await database.query(
      `DELETE FROM "MentorProfile" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "MentorSpecialty" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );

    await database.query(
      `DELETE FROM "ClubPostEventReport"
       WHERE "eventId" IN (
         SELECT id FROM "ClubEvent" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "ClubSafetyPlan"
       WHERE "eventId" IN (
         SELECT id FROM "ClubEvent" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    for (const table of [
      "ClubAttendance",
      "ClubConsent",
      "ClubRegistration",
      "ClubEvent",
      "ClubTask",
      "ClubAnnouncement",
      "ClubMembership",
      "ClubApplication",
    ]) {
      await database.query(
        `DELETE FROM "${table}" WHERE "schoolId" = ANY($1::uuid[])`,
        [schoolIds],
      );
    }
    await database.query(
      `DELETE FROM "ClubExpense"
       WHERE "budgetId" IN (
         SELECT id FROM "ClubBudget" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "ClubBudget" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "Club" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );

    await database.query(
      `DELETE FROM "Message" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "Conversation" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );

    for (const table of [
      "Notification",
      "NotificationPreference",
      "ActivityFeedProjection",
      "DomainOutboxEvent",
    ]) {
      await database.query(
        `DELETE FROM "${table}" WHERE "schoolId" = ANY($1::uuid[])`,
        [schoolIds],
      );
    }
    await database.query(
      `DELETE FROM "AuditEvent"
       WHERE "schoolId" = ANY($1::uuid[])
          OR "actorUserId" = ANY($2::uuid[])`,
      [schoolIds, userIds],
    );
    await database.query(
      `DELETE FROM "EmailOutbox"
       WHERE "schoolId" = ANY($1::uuid[])
          OR "recipientUserId" = ANY($2::uuid[])
          OR "toAddress" LIKE ANY($3::text[])`,
      [schoolIds, userIds, fixtureEmailPatterns],
    );
    for (const table of ["ParentStudentLink", "Invitation"]) {
      await database.query(
        `DELETE FROM "${table}" WHERE "schoolId" = ANY($1::uuid[])`,
        [schoolIds],
      );
    }

    await database.query(
      `DELETE FROM "SchoolRoleAssignment"
       WHERE "membershipId" IN (
         SELECT id FROM "SchoolMembership" WHERE "schoolId" = ANY($1::uuid[])
       )`,
      [schoolIds],
    );
    await database.query(
      `DELETE FROM "SchoolMembership" WHERE "schoolId" = ANY($1::uuid[])`,
      [schoolIds],
    );

    if (userIds.length > 0) {
      for (const table of [
        "Session",
        "PasswordResetToken",
        "PlatformRoleAssignment",
      ]) {
        await database.query(
          `DELETE FROM "${table}" WHERE "userId" = ANY($1::uuid[])`,
          [userIds],
        );
      }
      await database.query(
        `DELETE FROM "User"
         WHERE id = ANY($1::uuid[])
           AND NOT EXISTS (
             SELECT 1 FROM "SchoolMembership" WHERE "userId" = "User".id
           )`,
        [userIds],
      );
    }

    await database.query(`DELETE FROM "School" WHERE id = ANY($1::uuid[])`, [
      schoolIds,
    ]);
    await database.query("COMMIT");

    await Promise.all(
      files.rows.map(({ storageKey }) =>
        rm(storagePath(storageKey), { force: true }).catch(() => undefined),
      ),
    );

    return {
      schools: schoolIds.length,
      users: userIds.length,
      storedFiles: files.rows.length,
    };
  } catch (error) {
    await database.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await database.end();
  }
}
