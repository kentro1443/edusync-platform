CREATE TYPE "UserAccountKind" AS ENUM ('STANDARD', 'DEMO', 'DEV_OPERATOR');

ALTER TABLE "User"
ADD COLUMN "accountKind" "UserAccountKind" NOT NULL DEFAULT 'STANDARD';

ALTER TABLE "Session"
ADD COLUMN "operatorUserId" UUID;

ALTER TABLE "Session"
ADD CONSTRAINT "Session_operatorUserId_fkey"
FOREIGN KEY ("operatorUserId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Session_operatorUserId_revokedAt_expires_idx"
ON "Session"("operatorUserId", "revokedAt", "expires");
