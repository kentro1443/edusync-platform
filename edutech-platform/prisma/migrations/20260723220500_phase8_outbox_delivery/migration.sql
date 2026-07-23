ALTER TABLE "EmailOutbox"
  ADD COLUMN "dedupeKey" TEXT,
  ADD COLUMN "availableAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "EmailOutbox_dedupeKey_key"
  ON "EmailOutbox"("dedupeKey");

CREATE INDEX "EmailOutbox_status_availableAt_idx"
  ON "EmailOutbox"("status", "availableAt");
