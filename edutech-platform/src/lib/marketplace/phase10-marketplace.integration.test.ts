import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AuthorizationContext } from "@/lib/auth/policies";
import { db } from "@/lib/db";
import {
  MarketplaceAuthorizationError,
  acceptMentorOffer,
  postMentorRequest,
  submitMentorOffer,
  updateEngagementPayment,
} from "@/lib/marketplace/marketplace-service";

describe.sequential("Phase 10 mentor marketplace", () => {
  const suffix = randomUUID().slice(0, 8);
  const schoolId = randomUUID();
  const otherSchoolId = randomUUID();
  const studentId = randomUUID();
  const studentMembershipId = randomUUID();
  const mentorAId = randomUUID();
  const mentorAMembershipId = randomUUID();
  const mentorAProfileId = randomUUID();
  const mentorBId = randomUUID();
  const mentorBMembershipId = randomUUID();
  const mentorBProfileId = randomUUID();
  const outsiderId = randomUUID();
  const outsiderMembershipId = randomUUID();
  const outsiderProfileId = randomUUID();
  const passwordHash = "not-used-in-this-integration-test";

  const studentActor: AuthorizationContext = {
    userId: studentId,
    schoolId,
    membershipId: studentMembershipId,
    schoolRoles: ["STUDENT"],
    platformRoles: [],
  };
  const mentorAActor: AuthorizationContext = {
    userId: mentorAId,
    schoolId,
    membershipId: mentorAMembershipId,
    schoolRoles: ["MENTOR_COUNSELOR"],
    platformRoles: [],
  };
  const mentorBActor: AuthorizationContext = {
    userId: mentorBId,
    schoolId,
    membershipId: mentorBMembershipId,
    schoolRoles: ["MENTOR_COUNSELOR"],
    platformRoles: [],
  };
  const outsiderActor: AuthorizationContext = {
    userId: outsiderId,
    schoolId: otherSchoolId,
    membershipId: outsiderMembershipId,
    schoolRoles: ["MENTOR_COUNSELOR"],
    platformRoles: [],
  };

  beforeAll(async () => {
    await db.school.createMany({
      data: [
        { id: schoolId, slug: `mkt-${suffix}`, name: `Trường MKT ${suffix}`, shortName: "MKT" },
        {
          id: otherSchoolId,
          slug: `mkt-other-${suffix}`,
          name: `Trường khác ${suffix}`,
          shortName: "OTH",
        },
      ],
    });
    await db.user.createMany({
      data: [
        { id: studentId, email: `student-${suffix}@mkt.local`, normalizedEmail: `student-${suffix}@mkt.local`, displayName: "Học sinh khóa dưới", passwordHash, mustChangePassword: false },
        { id: mentorAId, email: `mentora-${suffix}@mkt.local`, normalizedEmail: `mentora-${suffix}@mkt.local`, displayName: "Anh khóa trên A", passwordHash, mustChangePassword: false },
        { id: mentorBId, email: `mentorb-${suffix}@mkt.local`, normalizedEmail: `mentorb-${suffix}@mkt.local`, displayName: "Chị khóa trên B", passwordHash, mustChangePassword: false },
        { id: outsiderId, email: `outsider-${suffix}@mkt.local`, normalizedEmail: `outsider-${suffix}@mkt.local`, displayName: "Người trường khác", passwordHash, mustChangePassword: false },
      ],
    });
    await db.schoolMembership.createMany({
      data: [
        { id: studentMembershipId, schoolId, userId: studentId, status: "ACTIVE", joinedAt: new Date() },
        { id: mentorAMembershipId, schoolId, userId: mentorAId, status: "ACTIVE", joinedAt: new Date() },
        { id: mentorBMembershipId, schoolId, userId: mentorBId, status: "ACTIVE", joinedAt: new Date() },
        { id: outsiderMembershipId, schoolId: otherSchoolId, userId: outsiderId, status: "ACTIVE", joinedAt: new Date() },
      ],
    });
    await db.schoolRoleAssignment.createMany({
      data: [
        { membershipId: studentMembershipId, role: "STUDENT" },
        { membershipId: mentorAMembershipId, role: "MENTOR_COUNSELOR" },
        { membershipId: mentorBMembershipId, role: "MENTOR_COUNSELOR" },
        { membershipId: outsiderMembershipId, role: "MENTOR_COUNSELOR" },
      ],
    });
    await db.mentorProfile.createMany({
      data: [
        { id: mentorAProfileId, schoolId, userId: mentorAId, headline: "Cố vấn A", bio: "SAT 1520", verificationStatus: "VERIFIED", verifiedAt: new Date() },
        { id: mentorBProfileId, schoolId, userId: mentorBId, headline: "Cố vấn B", bio: "IELTS 8.0", verificationStatus: "VERIFIED", verifiedAt: new Date() },
        { id: outsiderProfileId, schoolId: otherSchoolId, userId: outsiderId, headline: "Ngoài", bio: "N/A", verificationStatus: "VERIFIED", verifiedAt: new Date() },
      ],
    });
  });

  afterAll(async () => {
    await db.mentorEngagement.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
    await db.mentorOffer.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
    await db.mentorRequest.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
    await db.auditEvent.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
    await db.domainOutboxEvent.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
    await db.mentorProfile.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
    await db.schoolRoleAssignment.deleteMany({ where: { membership: { schoolId: { in: [schoolId, otherSchoolId] } } } });
    await db.schoolMembership.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
    await db.user.deleteMany({ where: { id: { in: [studentId, mentorAId, mentorBId, outsiderId] } } });
    await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  });

  it("only creates one engagement when two offers race to be accepted, and audits it", async () => {
    const requestId = await postMentorRequest(studentActor, {
      title: "Luyện SAT Math 5 buổi",
      description: "Cần anh chị đã đạt điểm cao kèm 5 buổi trước kỳ thi.",
      preferredSessions: 5,
    });

    const offerAId = await submitMentorOffer(mentorAActor, {
      requestId,
      mentorProfileId: mentorAProfileId,
      pricePerSessionVnd: 150_000,
      message: "Mình từng đạt SAT 1520, kèm bài bản.",
    });
    const offerBId = await submitMentorOffer(mentorBActor, {
      requestId,
      mentorProfileId: mentorBProfileId,
      pricePerSessionVnd: 120_000,
      message: "Mình có lộ trình 5 buổi rõ ràng.",
    });

    const results = await Promise.allSettled([
      acceptMentorOffer(studentActor, offerAId),
      acceptMentorOffer(studentActor, offerBId),
    ]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled).toHaveLength(1);

    const engagements = await db.mentorEngagement.findMany({ where: { requestId } });
    expect(engagements).toHaveLength(1);

    const request = await db.mentorRequest.findUniqueOrThrow({ where: { id: requestId } });
    expect(request.status).toBe("MATCHED");

    const acceptedOffers = await db.mentorOffer.findMany({
      where: { requestId, status: "ACCEPTED" },
    });
    expect(acceptedOffers).toHaveLength(1);

    const audit = await db.auditEvent.findFirst({
      where: { schoolId, action: "marketplace.offer.accept" },
    });
    expect(audit).not.toBeNull();
    const outbox = await db.domainOutboxEvent.findFirst({
      where: { schoolId, eventType: "marketplace.offer.accepted" },
    });
    expect(outbox).not.toBeNull();
  });

  it("marks the winning engagement as paid and rejects double settlement", async () => {
    const engagement = await db.mentorEngagement.findFirstOrThrow({ where: { schoolId } });
    await updateEngagementPayment(studentActor, engagement.id, "PAID");
    const updated = await db.mentorEngagement.findUniqueOrThrow({ where: { id: engagement.id } });
    expect(updated.paymentStatus).toBe("PAID");
    await expect(updateEngagementPayment(studentActor, engagement.id, "WAIVED")).rejects.toThrow();
  });

  it("rejects a mentor from another school offering on the request", async () => {
    const requestId = await postMentorRequest(studentActor, {
      title: "Tư vấn hồ sơ du học",
      description: "Cần người từng apply thành công tư vấn hồ sơ.",
      preferredSessions: 2,
    });
    await expect(
      submitMentorOffer(outsiderActor, {
        requestId,
        mentorProfileId: outsiderProfileId,
        pricePerSessionVnd: 200_000,
        message: "Mình ở trường khác nhưng muốn nhận.",
      }),
    ).rejects.toThrow(MarketplaceAuthorizationError);
  });

  it("prevents a student from bidding on their own request", async () => {
    const requestId = await postMentorRequest(studentActor, {
      title: "Ôn thi học kỳ Toán",
      description: "Cần hỗ trợ ôn tập chương trình học kỳ.",
      preferredSessions: 1,
    });
    await expect(
      submitMentorOffer(studentActor, {
        requestId,
        mentorProfileId: mentorAProfileId,
        pricePerSessionVnd: 100_000,
        message: "Tự đề xuất cho chính mình.",
      }),
    ).rejects.toThrow();
  });
});
