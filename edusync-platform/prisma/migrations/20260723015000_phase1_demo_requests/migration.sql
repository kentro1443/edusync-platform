CREATE TABLE "DemoRequest" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "studentCount" INTEGER,
    "module" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DemoRequest_status_createdAt_idx" ON "DemoRequest"("status", "createdAt");
CREATE INDEX "DemoRequest_email_createdAt_idx" ON "DemoRequest"("email", "createdAt");
