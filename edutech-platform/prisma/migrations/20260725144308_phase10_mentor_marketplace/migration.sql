-- CreateEnum
CREATE TYPE "MentorRequestStatus" AS ENUM ('OPEN', 'MATCHED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MentorOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "MentorPaymentStatus" AS ENUM ('PENDING', 'PAID', 'WAIVED');

-- AlterTable
ALTER TABLE "MentorProfile" ADD COLUMN     "acceptingRequests" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "certifiedAt" TIMESTAMPTZ(6),
ADD COLUMN     "certifiedByUnion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gradeLabel" TEXT,
ADD COLUMN     "hourlyRateMaxVnd" INTEGER,
ADD COLUMN     "hourlyRateMinVnd" INTEGER;

-- CreateTable
CREATE TABLE "MentorRequest" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "studentUserId" UUID NOT NULL,
    "specialtyId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "preferredSessions" INTEGER NOT NULL DEFAULT 1,
    "budgetHintVnd" INTEGER,
    "status" "MentorRequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MentorRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorOffer" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "mentorProfileId" UUID NOT NULL,
    "mentorUserId" UUID NOT NULL,
    "pricePerSessionVnd" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" "MentorOfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MentorOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorEngagement" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "mentorProfileId" UUID NOT NULL,
    "mentorUserId" UUID NOT NULL,
    "studentUserId" UUID NOT NULL,
    "agreedPricePerSessionVnd" INTEGER NOT NULL,
    "sessions" INTEGER NOT NULL DEFAULT 1,
    "totalAmountVnd" INTEGER NOT NULL,
    "paymentStatus" "MentorPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MentorEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MentorRequest_schoolId_status_createdAt_idx" ON "MentorRequest"("schoolId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MentorRequest_schoolId_studentUserId_status_idx" ON "MentorRequest"("schoolId", "studentUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MentorRequest_id_schoolId_key" ON "MentorRequest"("id", "schoolId");

-- CreateIndex
CREATE INDEX "MentorOffer_schoolId_mentorUserId_status_idx" ON "MentorOffer"("schoolId", "mentorUserId", "status");

-- CreateIndex
CREATE INDEX "MentorOffer_requestId_status_idx" ON "MentorOffer"("requestId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MentorOffer_requestId_mentorProfileId_key" ON "MentorOffer"("requestId", "mentorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorEngagement_requestId_key" ON "MentorEngagement"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorEngagement_offerId_key" ON "MentorEngagement"("offerId");

-- CreateIndex
CREATE INDEX "MentorEngagement_schoolId_mentorUserId_paymentStatus_idx" ON "MentorEngagement"("schoolId", "mentorUserId", "paymentStatus");

-- CreateIndex
CREATE INDEX "MentorEngagement_schoolId_studentUserId_idx" ON "MentorEngagement"("schoolId", "studentUserId");

-- AddForeignKey
ALTER TABLE "MentorRequest" ADD CONSTRAINT "MentorRequest_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorRequest" ADD CONSTRAINT "MentorRequest_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorRequest" ADD CONSTRAINT "MentorRequest_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "MentorSpecialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorOffer" ADD CONSTRAINT "MentorOffer_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorOffer" ADD CONSTRAINT "MentorOffer_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MentorRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorOffer" ADD CONSTRAINT "MentorOffer_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "MentorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorOffer" ADD CONSTRAINT "MentorOffer_mentorUserId_fkey" FOREIGN KEY ("mentorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorEngagement" ADD CONSTRAINT "MentorEngagement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorEngagement" ADD CONSTRAINT "MentorEngagement_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MentorRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorEngagement" ADD CONSTRAINT "MentorEngagement_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "MentorOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorEngagement" ADD CONSTRAINT "MentorEngagement_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "MentorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorEngagement" ADD CONSTRAINT "MentorEngagement_mentorUserId_fkey" FOREIGN KEY ("mentorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorEngagement" ADD CONSTRAINT "MentorEngagement_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
