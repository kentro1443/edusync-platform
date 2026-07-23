import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AuthorizationContext } from "@/lib/auth/policies";
import { db } from "@/lib/db";
import {
  addMentoringGoal,
  addMentoringNote,
  addMentoringReferral,
  addMentoringTask,
} from "@/lib/mentoring/case-mutations";
import {
  CaseAuthorizationError,
  createMentoringCase,
  getMentoringCase,
} from "@/lib/mentoring/case-service";

describe.sequential("Phase 3 case privacy integration", () => {
  const suffix = randomUUID().slice(0, 8);
  const schoolId = randomUUID();
  const otherSchoolId = randomUUID();
  const mentorId = randomUUID();
  const studentId = randomUUID();
  const parentId = randomUUID();
  const adminId = randomUUID();
  const otherMentorId = randomUUID();
  const profileId = randomUUID();
  const passwordHash = "not-used-in-this-integration-test";
  const membershipIds = {
    mentor: randomUUID(),
    student: randomUUID(),
    parent: randomUUID(),
    admin: randomUUID(),
    otherMentor: randomUUID(),
  };

  function actor(
    userId: string,
    membershipId: string,
    roles: AuthorizationContext["schoolRoles"],
    actorSchoolId = schoolId,
  ): AuthorizationContext {
    return {
      userId,
      schoolId: actorSchoolId,
      membershipId,
      schoolRoles: roles,
      platformRoles: [],
    };
  }

  const mentorActor = actor(mentorId, membershipIds.mentor, [
    "MENTOR_COUNSELOR",
  ]);
  const studentActor = actor(studentId, membershipIds.student, ["STUDENT"]);
  const parentActor = actor(parentId, membershipIds.parent, [
    "PARENT_GUARDIAN",
  ]);
  const adminActor = actor(adminId, membershipIds.admin, ["SCHOOL_ADMIN"]);
  const otherMentorActor = actor(
    otherMentorId,
    membershipIds.otherMentor,
    ["MENTOR_COUNSELOR"],
    otherSchoolId,
  );

  let caseId: string;

  beforeAll(async () => {
    await db.school.createMany({
      data: [
        {
          id: schoolId,
          slug: `phase3-case-${suffix}`,
          name: `Trường Case ${suffix}`,
          shortName: "P3C",
        },
        {
          id: otherSchoolId,
          slug: `phase3-case-other-${suffix}`,
          name: `Trường Case khác ${suffix}`,
          shortName: "P3X",
        },
      ],
    });
    await db.user.createMany({
      data: [
        {
          id: mentorId,
          email: `mentor-case-${suffix}@phase3.local`,
          normalizedEmail: `mentor-case-${suffix}@phase3.local`,
          displayName: "Cố vấn hồ sơ",
          passwordHash,
          mustChangePassword: false,
        },
        {
          id: studentId,
          email: `student-case-${suffix}@phase3.local`,
          normalizedEmail: `student-case-${suffix}@phase3.local`,
          displayName: "Học sinh hồ sơ",
          passwordHash,
          mustChangePassword: false,
        },
        {
          id: parentId,
          email: `parent-case-${suffix}@phase3.local`,
          normalizedEmail: `parent-case-${suffix}@phase3.local`,
          displayName: "Phụ huynh hồ sơ",
          passwordHash,
          mustChangePassword: false,
        },
        {
          id: adminId,
          email: `admin-case-${suffix}@phase3.local`,
          normalizedEmail: `admin-case-${suffix}@phase3.local`,
          displayName: "Quản trị hồ sơ",
          passwordHash,
          mustChangePassword: false,
        },
        {
          id: otherMentorId,
          email: `other-mentor-case-${suffix}@phase3.local`,
          normalizedEmail: `other-mentor-case-${suffix}@phase3.local`,
          displayName: "Cố vấn trường khác",
          passwordHash,
          mustChangePassword: false,
        },
      ],
    });
    await db.schoolMembership.createMany({
      data: [
        {
          id: membershipIds.mentor,
          schoolId,
          userId: mentorId,
          status: "ACTIVE",
          joinedAt: new Date(),
        },
        {
          id: membershipIds.student,
          schoolId,
          userId: studentId,
          status: "ACTIVE",
          joinedAt: new Date(),
        },
        {
          id: membershipIds.parent,
          schoolId,
          userId: parentId,
          status: "ACTIVE",
          joinedAt: new Date(),
        },
        {
          id: membershipIds.admin,
          schoolId,
          userId: adminId,
          status: "ACTIVE",
          joinedAt: new Date(),
        },
        {
          id: membershipIds.otherMentor,
          schoolId: otherSchoolId,
          userId: otherMentorId,
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      ],
    });
    await db.schoolRoleAssignment.createMany({
      data: [
        {
          membershipId: membershipIds.mentor,
          role: "MENTOR_COUNSELOR",
        },
        { membershipId: membershipIds.student, role: "STUDENT" },
        {
          membershipId: membershipIds.parent,
          role: "PARENT_GUARDIAN",
        },
        { membershipId: membershipIds.admin, role: "SCHOOL_ADMIN" },
        {
          membershipId: membershipIds.otherMentor,
          role: "MENTOR_COUNSELOR",
        },
      ],
    });
    await db.parentStudentLink.create({
      data: {
        schoolId,
        parentUserId: parentId,
        studentUserId: studentId,
        relationshipType: "PARENT",
        status: "ACTIVE",
        startsAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
    await db.mentorProfile.create({
      data: {
        id: profileId,
        schoolId,
        userId: mentorId,
        headline: "Cố vấn hồ sơ",
        bio: "Hồ sơ integration test",
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await db.auditEvent.deleteMany({
      where: { schoolId: { in: [schoolId, otherSchoolId] } },
    });
    await db.domainOutboxEvent.deleteMany({
      where: { schoolId: { in: [schoolId, otherSchoolId] } },
    });
    await db.mentoringNote.deleteMany({ where: { schoolId } });
    await db.mentoringReferral.deleteMany({ where: { schoolId } });
    await db.mentoringTask.deleteMany({ where: { schoolId } });
    await db.mentoringSessionOutcome.deleteMany({
      where: { mentoringCase: { schoolId } },
    });
    await db.mentoringGoal.deleteMany({
      where: { mentoringCase: { schoolId } },
    });
    await db.mentoringCase.deleteMany({ where: { schoolId } });
    await db.mentorProfile.deleteMany({ where: { schoolId } });
    await db.parentStudentLink.deleteMany({ where: { schoolId } });
    await db.schoolRoleAssignment.deleteMany({
      where: {
        membership: { schoolId: { in: [schoolId, otherSchoolId] } },
      },
    });
    await db.schoolMembership.deleteMany({
      where: { schoolId: { in: [schoolId, otherSchoolId] } },
    });
    await db.user.deleteMany({
      where: {
        id: {
          in: [mentorId, studentId, parentId, adminId, otherMentorId],
        },
      },
    });
    await db.school.deleteMany({
      where: { id: { in: [schoolId, otherSchoolId] } },
    });
  });

  it("tạo case, goal, task và referral trong đúng tenant", async () => {
    caseId = await createMentoringCase(mentorActor, {
      studentUserId: studentId,
      mentorProfileId: profileId,
      title: "Kế hoạch cải thiện thói quen học tập",
      summary: "Theo dõi trong sáu tuần.",
      priority: "HIGH",
    });
    await addMentoringGoal(mentorActor, caseId, {
      title: "Hoàn thành kế hoạch tuần",
      progressPercent: 20,
    });
    await addMentoringTask(mentorActor, caseId, {
      assigneeUserId: studentId,
      title: "Ghi nhật ký học tập",
    });
    await addMentoringReferral(mentorActor, caseId, {
      destination: "Phòng hỗ trợ học tập",
      reason: "Bổ sung kỹ năng quản lý thời gian",
    });

    const mentoringCase = await getMentoringCase(mentorActor, caseId);
    expect(mentoringCase).toMatchObject({
      id: caseId,
      goals: [{ title: "Hoàn thành kế hoạch tuần" }],
      tasks: [{ title: "Ghi nhật ký học tập" }],
      referrals: [{ destination: "Phòng hỗ trợ học tập" }],
    });
    expect(
      await db.domainOutboxEvent.count({
        where: { aggregateType: "MentoringCase", aggregateId: caseId },
      }),
    ).toBe(4);
  });

  it("projection không lộ note riêng tư cho student, parent, admin hoặc tenant khác", async () => {
    await addMentoringNote(mentorActor, caseId, {
      visibility: "PRIVATE_COUNSELOR",
      body: "Riêng tư tuyệt đối",
    });
    await addMentoringNote(mentorActor, caseId, {
      visibility: "STUDENT_VISIBLE",
      body: "Học sinh được xem",
    });
    await addMentoringNote(mentorActor, caseId, {
      visibility: "GUARDIAN_VISIBLE",
      body: "Phụ huynh được xem",
    });
    await addMentoringNote(mentorActor, caseId, {
      visibility: "STAFF_VISIBLE",
      body: "Nhân sự được xem",
    });

    const mentorView = await getMentoringCase(mentorActor, caseId);
    const studentView = await getMentoringCase(studentActor, caseId);
    const parentView = await getMentoringCase(parentActor, caseId);
    const adminView = await getMentoringCase(adminActor, caseId);

    expect(mentorView?.notes.map(({ body }) => body)).toEqual([
      "Riêng tư tuyệt đối",
      "Học sinh được xem",
      "Phụ huynh được xem",
      "Nhân sự được xem",
    ]);
    expect(studentView?.notes.map(({ body }) => body)).toEqual([
      "Học sinh được xem",
      "Phụ huynh được xem",
    ]);
    expect(parentView?.notes.map(({ body }) => body)).toEqual([
      "Phụ huynh được xem",
    ]);
    expect(adminView?.notes.map(({ body }) => body)).toEqual([
      "Nhân sự được xem",
    ]);
    expect(JSON.stringify(studentView)).not.toContain("Riêng tư tuyệt đối");
    await expect(
      getMentoringCase(otherMentorActor, caseId),
    ).rejects.toBeInstanceOf(CaseAuthorizationError);
  });
});
