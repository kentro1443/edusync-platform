# EduTech Data Model Boundary

## Modeling rules

- `School` is the tenant boundary.
- Tenant-owned aggregates carry `schoolId` directly whenever practical.
- IDs are opaque UUIDs.
- Timestamps are stored in UTC.
- Status changes are represented by explicit history records.
- Published workflow versions and uploaded file versions are immutable.
- Deletion of regulated records is soft deletion or policy-controlled archival.
- Unique constraints include `schoolId` unless uniqueness is platform-wide.
- Foreign keys and service checks prevent relationships across schools.

## Identity and tenancy

### `User`

Global identity record:

- `id`
- `email`
- `normalizedEmail`
- `passwordHash`
- `displayName`
- `avatarFileId`
- `locale`
- `timezone`
- `mustChangePassword`
- `status`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

### `School`

Tenant record:

- `id`
- `slug`
- `name`
- `shortName`
- `logoFileId`
- `status`
- `planCode`
- `storageQuotaBytes`
- `settingsJson`
- `createdAt`
- `updatedAt`

### `SchoolMembership`

User-to-school relationship:

- `id`
- `schoolId`
- `userId`
- `status`
- `joinedAt`
- `leftAt`
- `lastActiveAt`

Unique: `(schoolId, userId)`.

### `SchoolRoleAssignment`

- `id`
- `membershipId`
- `role`
- `assignedByUserId`
- `createdAt`

Unique: `(membershipId, role)`.

### `ParentStudentLink`

- `id`
- `schoolId`
- `parentUserId`
- `studentUserId`
- `relationshipType`
- `status`
- `startsAt`
- `endsAt`
- `visibilityPolicyJson`
- `createdAt`
- `updatedAt`

Unique: `(schoolId, parentUserId, studentUserId)`.

### `Invitation`

- `id`
- `schoolId`
- `email`
- `normalizedEmail`
- `tokenHash`
- `roleHintsJson`
- `expiresAt`
- `acceptedAt`
- `revokedAt`
- `lastSentAt`
- `sendCount`
- `createdByUserId`
- `createdAt`

Only the HMAC token hash is stored. A pending invitation is neither accepted,
revoked, nor expired. Resending rotates the token and invalidates the previous
link. Acceptance creates or reuses the global user, then activates exactly one
school membership with the requested roles.

### `Session`

Opaque database session record:

- `id`
- `sessionTokenHash`
- `userId`
- `expires`
- `revokedAt`
- `revokeReason`
- `lastSeenAt`
- `userAgent`
- `ipHash`
- `createdAt`
- `updatedAt`

Raw session tokens exist only in the secure cookie. Revocation preserves session
history for audit and incident review. Session resolution rejects expired,
revoked, inactive-user, suspended-school, and inactive-membership contexts.

### `PasswordResetToken`

- `id`
- `userId`
- `tokenHash`
- `expiresAt`
- `usedAt`
- `revokedAt`
- `createdAt`

Reset tokens are opaque and consume-once. Completing a reset revokes every
outstanding reset token and active session for the user.

### `AuthRateLimit`

- `keyHash`
- `action`
- `attempts`
- `windowStart`
- `blockedUntil`
- `updatedAt`

The key is an HMAC of action and normalized request subject. Email addresses and
IP addresses are not stored in clear text. Login, password-reset request, and
invitation delivery use durable database-backed limits.

### Identity indexes and audit

- Invitation lookup: `(schoolId, normalizedEmail)` and lifecycle fields.
- Session lookup: `(userId, revokedAt, expires)` and `(expires, revokedAt)`.
- Password reset lookup: `(userId, revokedAt, expiresAt)`.
- Audit lookup: school/time, actor/time, school/action/time,
  entity/type/time, and request ID.
- `EmailOutbox.schoolId` is nullable so platform-level identity messages remain
  deliverable without pretending to belong to a tenant.

## Academic structure

All records below include `schoolId`:

- `AcademicYear`: name, startsAt, endsAt, status.
- `Term`: academicYearId, name, startsAt, endsAt, status.
- `Department`: name, code, status.
- `Subject`: departmentId, name, code.
- `Grade`: name, sortOrder.
- `ClassGroup`: academicYearId, gradeId, name, homeroomTeacherId.
- `ClassEnrollment`: classGroupId, studentUserId, startsAt, endsAt, status.
- `StaffAssignment`: userId, classGroupId/subjectId, assignmentType.

## Files

### `StoredFile`

Metadata only; bytes live in the configured storage adapter:

- `id`
- `schoolId`
- `storageKey`
- `originalName`
- `mimeType`
- `sizeBytes`
- `sha256`
- `status`
- `createdByUserId`
- `createdAt`

### `FileVersion`

- `id`
- `fileId`
- `versionNumber`
- `storageKey`
- `originalName`
- `mimeType`
- `sizeBytes`
- `sha256`
- `createdByUserId`
- `createdAt`

Unique: `(fileId, versionNumber)`.

### `FileLink`

Associates a file with an authorized aggregate:

- `id`
- `schoolId`
- `fileId`
- `entityType`
- `entityId`
- `visibility`
- `createdByUserId`
- `createdAt`

The service layer verifies that the linked entity belongs to the same school.

## Mentoring

- `MentorProfile`, `MentorSpecialty`, `MentorProfileSpecialty`: verified mentor directory, specialties, and school-scoped ownership.
- `MentorStudentAssignment`: active primary mentor assignment for a student.
- `MentorAvailabilityRule`, `MentorAvailabilityException`: recurring local-time availability, timezone, capacity, and explicit exceptions.
- `AppointmentType`, `Appointment`, `AppointmentTransition`: appointment policy, lifecycle state, and append-only transition history.
- `AppointmentWaitlistEntry`, `AppointmentAttendance`: deterministic queue promotion and per-participant attendance.
- `MentoringCase`, `MentoringGoal`, `MentoringSessionOutcome`, `MentoringTask`, `MentoringReferral`: the counseling case workspace and follow-up workflow.
- `MentoringNote`: encrypted AES-256-GCM body with explicit `PRIVATE_COUNSELOR`, `STUDENT_VISIBLE`, `GUARDIAN_VISIBLE`, and `STAFF_VISIBLE` projections.

Appointments have school/mentor/student indexes and PostgreSQL exclusion constraints on half-open
`tstzrange(startsAt, endsAt, '[)')` for live `REQUESTED`/`CONFIRMED` reservations. Booking and waitlist promotion are transactional and emit audit/outbox records in the same transaction.

## Resources

- `Resource`: schoolId, title, summary, status, authorUserId, subjectId, gradeId, curriculumYear, license, publishedAt.
- `ResourceVersion`: resourceId, versionNumber, fileId, changeSummary, createdByUserId, createdAt.
- `ResourceTag`: schoolId, name.
- `ResourceTagLink`: resourceId, tagId.
- `ResourceBookmark`: schoolId, resourceId, userId.
- `ResourceCollection`: schoolId, ownerUserId, name.
- `ResourceCollectionItem`: collectionId, resourceId.
- `ResourceComment`: schoolId, resourceId, authorUserId, body, status, parentCommentId.
- `ResourceRating`: schoolId, resourceId, userId, rating.
- `ResourceReport`: schoolId, resourceId, reporterUserId, reason, status.
- `ResourceViewEvent`: schoolId, resourceId, userId, occurredAt.
- `ResourceDownloadEvent`: schoolId, resourceId, fileVersionId, userId, occurredAt.

Resource status history is append-only. A published resource references a specific immutable version.

## Scheduling

- `Calendar`: schoolId, ownerType, ownerId, name, visibility.
- `CalendarEvent`: schoolId, calendarId, organizerUserId, title, startsAt, endsAt, recurrenceRule, status, capacity, location.
- `CalendarEventException`: eventId, occurrenceDate, status, replacementStartsAt, replacementEndsAt.
- `CalendarResource`: schoolId, name, type, capacity, status.
- `CalendarEventResource`: eventId, resourceId.
- `CalendarBlock`: schoolId, startsAt, endsAt, reason, scope.
- `AttendanceRecord`: schoolId, eventId/appointmentId, userId, status, checkedInAt.
- `SchedulingPolicy`: schoolId, cancellationWindowHours, bookingWindowDays, reminderPolicyJson.

Use transactional constraints or an equivalent locking strategy for overlapping appointments/events. If PostgreSQL exclusion constraints are used, they must be introduced through a reviewed migration.

## Workflow engine

- `WorkflowTemplate`: schoolId, key, name, description, status, currentDraftVersionId, createdByUserId.
- `WorkflowTemplateVersion`: templateId, versionNumber, status, definitionJson, publishedAt, publishedByUserId.
- `WorkflowSubmission`: schoolId, templateVersionId, submittedByUserId, subjectType, subjectId, status, dataJson, submittedAt, completedAt.
- `WorkflowStepInstance`: submissionId, stepKey, sequence, status, assigneeRole, assigneeUserId, dueAt, decidedAt.
- `WorkflowDecision`: stepInstanceId, actorUserId, action, comment, createdAt.
- `WorkflowComment`: schoolId, submissionId, authorUserId, body, createdAt.
- `WorkflowAttachment`: submissionId, fileId.
- `WorkflowEvent`: submissionId, eventType, actorUserId, payloadJson, createdAt.

Workflow definitions are validated before publication. Submissions retain the exact `templateVersionId`. Published versions cannot be updated or deleted.

## Clubs and events

- `Club`: schoolId, name, slug, description, status, visibility, ownerUserId, supervisorUserId.
- `ClubMembership`: schoolId, clubId, userId, role, status, joinedAt, leftAt.
- `ClubApplication`: schoolId, clubId, applicantUserId, status, answersJson, decidedAt.
- `ClubAnnouncement`: schoolId, clubId, authorUserId, body, status.
- `ClubTask`: schoolId, clubId, assigneeUserId, title, dueAt, status.
- `ClubEvent`: schoolId, clubId, calendarEventId, proposalSubmissionId, status.
- `ClubBudget`: schoolId, clubId, status, requestedAmount, approvedAmount, currency.
- `ClubExpense`: budgetId, description, amount, receiptFileId, status.
- `ClubAttendance`: schoolId, clubEventId, userId, status.
- `ClubReport`: schoolId, clubEventId, submittedByUserId, outcomesJson, submittedAt.

## Collaboration

- `Conversation`: schoolId, type, title, createdByUserId, status.
- `ConversationParticipant`: conversationId, userId, joinedAt, leftAt, mutedAt.
- `Message`: schoolId, conversationId, authorUserId, body, status, createdAt, editedAt, deletedAt.
- `MessageAttachment`: messageId, fileId.
- `CommentMention`: schoolId, commentType, commentId, mentionedUserId.
- `Notification`: schoolId, recipientUserId, type, title, body, entityType, entityId, readAt, idempotencyKey.
- `NotificationPreference`: userId, schoolId, eventType, inAppEnabled, emailEnabled.
- `EmailOutbox`: schoolId, recipientUserId, toAddress, templateKey, payloadJson, status, attempts, sentAt, lastError.
- `ActivityEvent`: schoolId, actorUserId, entityType, entityId, eventType, payloadJson, createdAt.

Conversation membership and every message read/send operation are authorization-checked. Attachments use the normal file policy.

## Audit and platform operations

- `AuditEvent`: schoolId nullable, actorUserId, actorType, action, entityType, entityId, beforeJson, afterJson, requestId, createdAt.
- `DomainOutboxEvent`: schoolId nullable, eventType, aggregateType, aggregateId, payloadJson, status, attempts, availableAt, processedAt.
- `SupportSession`: platformUserId, schoolId, mode, reason, startsAt, expiresAt, endedAt.
- `FeatureFlag`: schoolId nullable, key, enabled, configurationJson.
- `UsageCounter`: schoolId, metric, periodStart, value.

Audit and outbox records are append-only from application code. Administrative retention jobs may archive according to policy but may not silently rewrite history.

## Resource library implementation

`Resource` is the tenant-scoped aggregate. It owns metadata, visibility,
moderation status, current version pointer and explicit transition history.
`ResourceVersion` is append-only: published content is never mutated in place;
rollback copies an older version into a new version number.

Supporting models:

- `ResourceCategory` and `ResourceTag` use school-scoped slugs.
- `StoredFile` is the logical file and `FileVersion` stores immutable bytes
  metadata. `FileLink` carries the resource link and visibility projection.
- `ResourceComment`, `ResourceReport`, `ResourceBookmark`,
  `ResourceCollection`/`ResourceCollectionItem` cover collaboration and
  personal organization.
- `ResourceAnalyticsEvent` is the durable event stream and
  `ResourceAnalyticsCounter` is the read-optimized aggregate.

Resource reads and file downloads require an active membership in the same
school. Draft/private resources are limited to the author or moderation roles;
students and parents see only published non-private content. Uploads use opaque
storage keys, safe original names, allow-listed MIME types and a 25 MiB limit.
Audit and domain-outbox records are written in the same transaction as lifecycle
mutations.

## Index and constraint baseline

- Index every tenant-owned table by `schoolId`.
- Add composite indexes for common tenant/status/time queries.
- Add unique constraints with school scope.
- Add foreign keys for all same-tenant relationship roots.
- Reject inactive users and memberships in service-layer mutations.
- Use check constraints for nonnegative amounts, valid time ranges, and bounded ratings.
- Use optimistic version fields for editable records where concurrent updates are possible.
- Use idempotency keys for notifications and domain events.
- Add database-level overlap protection for appointments/events after the initial schema is validated.

## Migration sequencing

1. Identity and schools.
2. Memberships, roles, parent links, and sessions.
3. Academic structure.
4. Files and audit/outbox.
5. Mentoring and appointments.
6. Resources.
7. Scheduling.
8. Workflow engine.
9. Clubs/events.
10. Collaboration and notifications.
11. Reporting indexes and usage counters.

Each migration must be reversible where practical, reviewed for tenant leakage, and tested against a clean database plus a seeded database.
