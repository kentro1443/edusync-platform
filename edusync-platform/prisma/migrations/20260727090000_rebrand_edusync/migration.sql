-- Update persisted product-owned identifiers while preserving immutable migration history.
ALTER TABLE "CalendarSource"
ALTER COLUMN "provider" SET DEFAULT 'EDUSYNC';

UPDATE "CalendarSource"
SET "provider" = 'EDUSYNC'
WHERE "provider" = 'EDUTECH';

UPDATE "User"
SET
    "email" = replace("email", '@edutech.local', '@edusync.local'),
    "normalizedEmail" = replace("normalizedEmail", '@edutech.local', '@edusync.local')
WHERE "normalizedEmail" LIKE '%@edutech.local';

UPDATE "Invitation"
SET
    "email" = replace("email", '@edutech.local', '@edusync.local'),
    "normalizedEmail" = replace("normalizedEmail", '@edutech.local', '@edusync.local')
WHERE "normalizedEmail" LIKE '%@edutech.local';

UPDATE "DemoRequest"
SET "email" = replace("email", '@edutech.local', '@edusync.local')
WHERE lower("email") LIKE '%@edutech.local';
