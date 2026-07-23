-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResourceVisibility" AS ENUM ('PRIVATE', 'SCHOOL', 'PUBLIC');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "ResourceReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "FileLink" ADD COLUMN     "resourceId" UUID;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Resource" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "status" "ResourceStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "ResourceVisibility" NOT NULL DEFAULT 'SCHOOL',
    "currentVersionId" UUID,
    "publishedAt" TIMESTAMPTZ(6),
    "archivedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceVersion" (
    "id" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT,
    "metadataJson" JSONB NOT NULL DEFAULT '{}',
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceCategory" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceTag" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceTransition" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" "ResourceStatus",
    "toStatus" "ResourceStatus" NOT NULL,
    "reason" TEXT,
    "actorUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceComment" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "authorUserId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ResourceComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceReport" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "reporterUserId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ResourceReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ResourceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceBookmark" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceCollection" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ResourceCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceCollectionItem" (
    "id" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceCollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceAnalyticsEvent" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "actorUserId" UUID,
    "eventType" TEXT NOT NULL,
    "versionId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceAnalyticsCounter" (
    "resourceId" UUID NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "previews" INTEGER NOT NULL DEFAULT 0,
    "bookmarks" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "reports" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ResourceAnalyticsCounter_pkey" PRIMARY KEY ("resourceId")
);

-- CreateTable
CREATE TABLE "_ResourceToResourceCategory" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ResourceToResourceCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ResourceToResourceTag" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ResourceToResourceTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resource_currentVersionId_key" ON "Resource"("currentVersionId");

-- CreateIndex
CREATE INDEX "Resource_schoolId_status_updatedAt_idx" ON "Resource"("schoolId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "Resource_schoolId_visibility_status_idx" ON "Resource"("schoolId", "visibility", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_id_schoolId_key" ON "Resource"("id", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_schoolId_slug_key" ON "Resource"("schoolId", "slug");

-- CreateIndex
CREATE INDEX "ResourceVersion_resourceId_createdAt_idx" ON "ResourceVersion"("resourceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceVersion_resourceId_versionNumber_key" ON "ResourceVersion"("resourceId", "versionNumber");

-- CreateIndex
CREATE INDEX "ResourceCategory_schoolId_name_idx" ON "ResourceCategory"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceCategory_schoolId_slug_key" ON "ResourceCategory"("schoolId", "slug");

-- CreateIndex
CREATE INDEX "ResourceTag_schoolId_name_idx" ON "ResourceTag"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceTag_schoolId_slug_key" ON "ResourceTag"("schoolId", "slug");

-- CreateIndex
CREATE INDEX "ResourceTransition_schoolId_resourceId_createdAt_idx" ON "ResourceTransition"("schoolId", "resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceTransition_schoolId_toStatus_createdAt_idx" ON "ResourceTransition"("schoolId", "toStatus", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceComment_schoolId_resourceId_status_createdAt_idx" ON "ResourceComment"("schoolId", "resourceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceReport_schoolId_status_createdAt_idx" ON "ResourceReport"("schoolId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceReport_schoolId_resourceId_createdAt_idx" ON "ResourceReport"("schoolId", "resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceBookmark_schoolId_userId_createdAt_idx" ON "ResourceBookmark"("schoolId", "userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceBookmark_schoolId_resourceId_userId_key" ON "ResourceBookmark"("schoolId", "resourceId", "userId");

-- CreateIndex
CREATE INDEX "ResourceCollection_schoolId_ownerUserId_updatedAt_idx" ON "ResourceCollection"("schoolId", "ownerUserId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceCollection_schoolId_ownerUserId_name_key" ON "ResourceCollection"("schoolId", "ownerUserId", "name");

-- CreateIndex
CREATE INDEX "ResourceCollectionItem_resourceId_idx" ON "ResourceCollectionItem"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceCollectionItem_collectionId_resourceId_key" ON "ResourceCollectionItem"("collectionId", "resourceId");

-- CreateIndex
CREATE INDEX "ResourceAnalyticsEvent_schoolId_resourceId_eventType_create_idx" ON "ResourceAnalyticsEvent"("schoolId", "resourceId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceAnalyticsEvent_schoolId_eventType_createdAt_idx" ON "ResourceAnalyticsEvent"("schoolId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "_ResourceToResourceCategory_B_index" ON "_ResourceToResourceCategory"("B");

-- CreateIndex
CREATE INDEX "_ResourceToResourceTag_B_index" ON "_ResourceToResourceTag"("B");

-- CreateIndex
CREATE INDEX "FileLink_schoolId_resourceId_idx" ON "FileLink"("schoolId", "resourceId");

-- AddForeignKey
ALTER TABLE "FileLink" ADD CONSTRAINT "FileLink_resourceId_schoolId_fkey" FOREIGN KEY ("resourceId", "schoolId") REFERENCES "Resource"("id", "schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "ResourceVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceVersion" ADD CONSTRAINT "ResourceVersion_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceVersion" ADD CONSTRAINT "ResourceVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceCategory" ADD CONSTRAINT "ResourceCategory_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceCategory" ADD CONSTRAINT "ResourceCategory_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceTag" ADD CONSTRAINT "ResourceTag_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceTag" ADD CONSTRAINT "ResourceTag_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceTransition" ADD CONSTRAINT "ResourceTransition_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceTransition" ADD CONSTRAINT "ResourceTransition_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceComment" ADD CONSTRAINT "ResourceComment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceComment" ADD CONSTRAINT "ResourceComment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceComment" ADD CONSTRAINT "ResourceComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceReport" ADD CONSTRAINT "ResourceReport_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceReport" ADD CONSTRAINT "ResourceReport_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceReport" ADD CONSTRAINT "ResourceReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceBookmark" ADD CONSTRAINT "ResourceBookmark_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceBookmark" ADD CONSTRAINT "ResourceBookmark_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceBookmark" ADD CONSTRAINT "ResourceBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceCollection" ADD CONSTRAINT "ResourceCollection_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceCollection" ADD CONSTRAINT "ResourceCollection_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceCollectionItem" ADD CONSTRAINT "ResourceCollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ResourceCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceCollectionItem" ADD CONSTRAINT "ResourceCollectionItem_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAnalyticsEvent" ADD CONSTRAINT "ResourceAnalyticsEvent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAnalyticsEvent" ADD CONSTRAINT "ResourceAnalyticsEvent_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAnalyticsEvent" ADD CONSTRAINT "ResourceAnalyticsEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAnalyticsCounter" ADD CONSTRAINT "ResourceAnalyticsCounter_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResourceToResourceCategory" ADD CONSTRAINT "_ResourceToResourceCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResourceToResourceCategory" ADD CONSTRAINT "_ResourceToResourceCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "ResourceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResourceToResourceTag" ADD CONSTRAINT "_ResourceToResourceTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResourceToResourceTag" ADD CONSTRAINT "_ResourceToResourceTag_B_fkey" FOREIGN KEY ("B") REFERENCES "ResourceTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
