CREATE TABLE "WorkflowSubmissionComment" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "authorUserId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowSubmissionComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkflowSubmissionComment_schoolId_submissionId_createdAt_idx"
ON "WorkflowSubmissionComment"("schoolId", "submissionId", "createdAt");

ALTER TABLE "WorkflowSubmissionComment"
ADD CONSTRAINT "WorkflowSubmissionComment_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowSubmissionComment"
ADD CONSTRAINT "WorkflowSubmissionComment_submissionId_fkey"
FOREIGN KEY ("submissionId") REFERENCES "WorkflowSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowSubmissionComment"
ADD CONSTRAINT "WorkflowSubmissionComment_authorUserId_fkey"
FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
