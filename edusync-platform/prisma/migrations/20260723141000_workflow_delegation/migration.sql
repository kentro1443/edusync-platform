ALTER TABLE "WorkflowSubmissionStep"
ADD CONSTRAINT "WorkflowSubmissionStep_assignedUserId_fkey"
FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "WorkflowDelegation" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "submissionStepId" UUID NOT NULL,
    "delegatedByUserId" UUID NOT NULL,
    "delegatedToUserId" UUID NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowDelegation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkflowDelegation_schoolId_submissionStepId_createdAt_idx"
ON "WorkflowDelegation"("schoolId", "submissionStepId", "createdAt");

CREATE INDEX "WorkflowDelegation_delegatedToUserId_createdAt_idx"
ON "WorkflowDelegation"("delegatedToUserId", "createdAt");

ALTER TABLE "WorkflowDelegation"
ADD CONSTRAINT "WorkflowDelegation_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowDelegation"
ADD CONSTRAINT "WorkflowDelegation_submissionStepId_fkey"
FOREIGN KEY ("submissionStepId") REFERENCES "WorkflowSubmissionStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowDelegation"
ADD CONSTRAINT "WorkflowDelegation_delegatedByUserId_fkey"
FOREIGN KEY ("delegatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowDelegation"
ADD CONSTRAINT "WorkflowDelegation_delegatedToUserId_fkey"
FOREIGN KEY ("delegatedToUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
