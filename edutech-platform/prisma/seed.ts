import { PrismaPg } from "@prisma/adapter-pg";
import { argon2id, hash } from "argon2";

import {
  MembershipStatus,
  MentorAssignmentStatus,
  MentorVerificationStatus,
  ParentStudentLinkStatus,
  PlatformRole,
  SchoolRole,
} from "../src/generated/prisma/enums";
import { PrismaClient } from "../src/generated/prisma/client";
import { buildDemoUserUpsertData } from "./seed-user";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://edutech:edutech_local@localhost:5432/edutech?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

const demoPassword = "EduTech-Demo-2026!";
const seededAt = new Date("2026-07-22T00:00:00.000Z");

const schools = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    slug: "truong-minh-khai",
    name: "Trường Trung học Minh Khai",
    shortName: "Minh Khai",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    slug: "truong-nguyen-du",
    name: "Trường Trung học Nguyễn Du",
    shortName: "Nguyễn Du",
  },
] as const;

const users = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    email: "platform@edutech.local",
    displayName: "Quản trị nền tảng",
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    email: "admin.minhkhai@edutech.local",
    displayName: "Nguyễn Minh Anh",
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    email: "teacher.minhkhai@edutech.local",
    displayName: "Trần Thu Hà",
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    email: "mentor.minhkhai@edutech.local",
    displayName: "Lê Quốc Bảo",
  },
  {
    id: "20000000-0000-4000-8000-000000000005",
    email: "student.minhkhai@edutech.local",
    displayName: "Phạm Gia Huy",
  },
  {
    id: "20000000-0000-4000-8000-000000000006",
    email: "parent.minhkhai@edutech.local",
    displayName: "Phạm Thanh Mai",
  },
  {
    id: "20000000-0000-4000-8000-000000000007",
    email: "club.minhkhai@edutech.local",
    displayName: "Võ Hoàng Nam",
  },
  {
    id: "20000000-0000-4000-8000-000000000008",
    email: "approver.minhkhai@edutech.local",
    displayName: "Đặng Ngọc Lan",
  },
  {
    id: "20000000-0000-4000-8000-000000000009",
    email: "admin.nguyendu@edutech.local",
    displayName: "Bùi Đức Long",
  },
  {
    id: "20000000-0000-4000-8000-000000000010",
    email: "teacher.nguyendu@edutech.local",
    displayName: "Đỗ Mai Phương",
  },
  {
    id: "20000000-0000-4000-8000-000000000011",
    email: "mentor.nguyendu@edutech.local",
    displayName: "Hồ Nhật Minh",
  },
  {
    id: "20000000-0000-4000-8000-000000000012",
    email: "student.nguyendu@edutech.local",
    displayName: "Ngô Bảo Ngọc",
  },
  {
    id: "20000000-0000-4000-8000-000000000013",
    email: "parent.nguyendu@edutech.local",
    displayName: "Ngô Thanh Sơn",
  },
  {
    id: "20000000-0000-4000-8000-000000000014",
    email: "club.nguyendu@edutech.local",
    displayName: "Dương Khánh Linh",
  },
  {
    id: "20000000-0000-4000-8000-000000000015",
    email: "approver.nguyendu@edutech.local",
    displayName: "Tạ Quang Vinh",
  },
  {
    id: "20000000-0000-4000-8000-000000000016",
    email: "admin.multischool@edutech.local",
    displayName: "Nguyễn Hoài An",
  },
] as const;

const memberships = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    schoolId: schools[0].id,
    userId: users[1].id,
    roles: [SchoolRole.SCHOOL_ADMIN],
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    schoolId: schools[0].id,
    userId: users[2].id,
    roles: [SchoolRole.TEACHER_STAFF],
  },
  {
    id: "30000000-0000-4000-8000-000000000003",
    schoolId: schools[0].id,
    userId: users[3].id,
    roles: [SchoolRole.MENTOR_COUNSELOR, SchoolRole.TEACHER_STAFF],
  },
  {
    id: "30000000-0000-4000-8000-000000000004",
    schoolId: schools[0].id,
    userId: users[4].id,
    roles: [SchoolRole.STUDENT],
  },
  {
    id: "30000000-0000-4000-8000-000000000005",
    schoolId: schools[0].id,
    userId: users[5].id,
    roles: [SchoolRole.PARENT_GUARDIAN],
  },
  {
    id: "30000000-0000-4000-8000-000000000006",
    schoolId: schools[0].id,
    userId: users[6].id,
    roles: [SchoolRole.CLUB_LEADER],
  },
  {
    id: "30000000-0000-4000-8000-000000000007",
    schoolId: schools[0].id,
    userId: users[7].id,
    roles: [SchoolRole.APPROVER_REVIEWER],
  },
  {
    id: "30000000-0000-4000-8000-000000000008",
    schoolId: schools[1].id,
    userId: users[8].id,
    roles: [SchoolRole.SCHOOL_ADMIN],
  },
  {
    id: "30000000-0000-4000-8000-000000000009",
    schoolId: schools[1].id,
    userId: users[9].id,
    roles: [SchoolRole.TEACHER_STAFF],
  },
  {
    id: "30000000-0000-4000-8000-000000000010",
    schoolId: schools[1].id,
    userId: users[10].id,
    roles: [SchoolRole.MENTOR_COUNSELOR],
  },
  {
    id: "30000000-0000-4000-8000-000000000011",
    schoolId: schools[1].id,
    userId: users[11].id,
    roles: [SchoolRole.STUDENT],
  },
  {
    id: "30000000-0000-4000-8000-000000000012",
    schoolId: schools[1].id,
    userId: users[12].id,
    roles: [SchoolRole.PARENT_GUARDIAN],
  },
  {
    id: "30000000-0000-4000-8000-000000000013",
    schoolId: schools[1].id,
    userId: users[13].id,
    roles: [SchoolRole.CLUB_LEADER],
  },
  {
    id: "30000000-0000-4000-8000-000000000014",
    schoolId: schools[1].id,
    userId: users[14].id,
    roles: [SchoolRole.APPROVER_REVIEWER],
  },
  {
    id: "30000000-0000-4000-8000-000000000015",
    schoolId: schools[0].id,
    userId: users[15].id,
    roles: [SchoolRole.SCHOOL_ADMIN],
  },
  {
    id: "30000000-0000-4000-8000-000000000016",
    schoolId: schools[1].id,
    userId: users[15].id,
    roles: [SchoolRole.SCHOOL_ADMIN],
  },
] as const;

const mentorProfiles = [
  {
    id: "60000000-0000-4000-8000-000000000001",
    schoolId: schools[0].id,
    userId: users[3].id,
    headline: "Cố vấn phát triển năng lực và định hướng học tập",
    bio: "Đồng hành cùng học sinh xây dựng mục tiêu, thói quen học tập và kế hoạch phát triển cá nhân.",
    yearsExperience: 8,
    verifiedByUserId: users[1].id,
  },
  {
    id: "60000000-0000-4000-8000-000000000002",
    schoolId: schools[1].id,
    userId: users[10].id,
    headline: "Cố vấn tâm lý học đường và kỹ năng thích nghi",
    bio: "Hỗ trợ học sinh nhận diện sức mạnh, vượt qua áp lực và kết nối nguồn lực phù hợp.",
    yearsExperience: 6,
    verifiedByUserId: users[8].id,
  },
] as const;

const mentorSpecialties = [
  {
    id: "61000000-0000-4000-8000-000000000001",
    schoolId: schools[0].id,
    name: "Định hướng học tập",
    slug: "dinh-huong-hoc-tap",
    mentorProfileId: mentorProfiles[0].id,
  },
  {
    id: "61000000-0000-4000-8000-000000000002",
    schoolId: schools[0].id,
    name: "Kỹ năng cá nhân",
    slug: "ky-nang-ca-nhan",
    mentorProfileId: mentorProfiles[0].id,
  },
  {
    id: "61000000-0000-4000-8000-000000000003",
    schoolId: schools[1].id,
    name: "Tâm lý học đường",
    slug: "tam-ly-hoc-duong",
    mentorProfileId: mentorProfiles[1].id,
  },
] as const;

const appointmentTypes = [
  {
    id: "62000000-0000-4000-8000-000000000001",
    schoolId: schools[0].id,
    mentorProfileId: mentorProfiles[0].id,
    name: "Phiên cố vấn cá nhân",
    description: "Trao đổi 1:1 về mục tiêu và kế hoạch hành động.",
    durationMinutes: 60,
  },
  {
    id: "62000000-0000-4000-8000-000000000002",
    schoolId: schools[1].id,
    mentorProfileId: mentorProfiles[1].id,
    name: "Phiên hỗ trợ học đường",
    description: "Trao đổi 1:1 trong không gian an toàn và bảo mật.",
    durationMinutes: 60,
  },
] as const;

const demoMentoringCase = {
  id: "65000000-0000-4000-8000-000000000001",
  goalId: "65000000-0000-4000-8000-000000000002",
  taskId: "65000000-0000-4000-8000-000000000003",
  title: "Kế hoạch học tập học kỳ I",
  summary:
    "Theo dõi mục tiêu học tập, thói quen tự học và các mốc cần hỗ trợ trong học kỳ.",
};

const resourceCategories = [
  {
    id: "67000000-0000-4000-8000-000000000001",
    schoolId: schools[0].id,
    name: "Phương pháp học tập",
    slug: "phuong-phap-hoc-tap",
    createdByUserId: users[1].id,
  },
  {
    id: "67000000-0000-4000-8000-000000000002",
    schoolId: schools[0].id,
    name: "Kỹ năng sống",
    slug: "ky-nang-song",
    createdByUserId: users[1].id,
  },
] as const;

const resourceTags = [
  {
    id: "68000000-0000-4000-8000-000000000001",
    schoolId: schools[0].id,
    name: "Học kỳ I",
    slug: "hoc-ky-i",
    createdByUserId: users[1].id,
  },
  {
    id: "68000000-0000-4000-8000-000000000002",
    schoolId: schools[0].id,
    name: "Thực hành",
    slug: "thuc-hanh",
    createdByUserId: users[1].id,
  },
] as const;

const demoResources = [
  {
    id: "69000000-0000-4000-8000-000000000001",
    versionId: "69000000-0000-4000-8000-000000000101",
    schoolId: schools[0].id,
    createdByUserId: users[2].id,
    title: "Bộ công cụ lập kế hoạch học tập",
    slug: "bo-cong-cu-lap-ke-hoach-hoc-tap",
    summary: "Mẫu kế hoạch tuần giúp học sinh bắt đầu từ mục tiêu nhỏ và đo được tiến độ.",
    body: "Tài nguyên demo của EduTech. Hãy chọn một mục tiêu, chia thành hành động nhỏ và rà soát vào cuối tuần.",
    status: "PUBLISHED" as const,
    visibility: "SCHOOL" as const,
    categoryId: resourceCategories[0].id,
    tagId: resourceTags[0].id,
  },
  {
    id: "69000000-0000-4000-8000-000000000002",
    versionId: "69000000-0000-4000-8000-000000000102",
    schoolId: schools[0].id,
    createdByUserId: users[3].id,
    title: "Bài tập phản tư sau phiên cố vấn",
    slug: "bai-tap-phan-tu-sau-phien-co-van",
    summary: "Bộ câu hỏi riêng tư để học sinh ghi lại điều đã học và bước tiếp theo.",
    body: "Tài nguyên nháp demo, chỉ tác giả và người được cấp quyền nhìn thấy.",
    status: "DRAFT" as const,
    visibility: "PRIVATE" as const,
    categoryId: resourceCategories[1].id,
    tagId: resourceTags[1].id,
  },
] as const;

async function main() {
  const passwordHash = await hash(demoPassword, {
    type: argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    hashLength: 32,
  });

  for (const school of schools) {
    await prisma.school.upsert({
      where: { slug: school.slug },
      update: {
        name: school.name,
        shortName: school.shortName,
      },
      create: school,
    });
  }

  const demoUserIds = users.map(({ id }) => id);
  await prisma.$transaction([
    ...users.map((user) => {
      const userData = buildDemoUserUpsertData(user, passwordHash);
      return prisma.user.upsert({
        where: { normalizedEmail: user.email },
        update: userData.update,
        create: userData.create,
      });
    }),
    prisma.session.deleteMany({
      where: { userId: { in: demoUserIds } },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: { in: demoUserIds } },
    }),
  ]);

  await prisma.platformRoleAssignment.upsert({
    where: {
      userId_role: {
        userId: users[0].id,
        role: PlatformRole.PLATFORM_SUPER_ADMIN,
      },
    },
    update: {},
    create: {
      id: "40000000-0000-4000-8000-000000000001",
      userId: users[0].id,
      role: PlatformRole.PLATFORM_SUPER_ADMIN,
    },
  });

  for (const membership of memberships) {
    await prisma.schoolMembership.upsert({
      where: {
        schoolId_userId: {
          schoolId: membership.schoolId,
          userId: membership.userId,
        },
      },
      update: {
        status: MembershipStatus.ACTIVE,
        joinedAt: seededAt,
        leftAt: null,
      },
      create: {
        id: membership.id,
        schoolId: membership.schoolId,
        userId: membership.userId,
        status: MembershipStatus.ACTIVE,
        joinedAt: seededAt,
      },
    });

    for (const role of membership.roles) {
      await prisma.schoolRoleAssignment.upsert({
        where: {
          membershipId_role: {
            membershipId: membership.id,
            role,
          },
        },
        update: {},
        create: {
          membershipId: membership.id,
          role,
        },
      });
    }
  }

  await prisma.parentStudentLink.upsert({
    where: {
      schoolId_parentUserId_studentUserId: {
        schoolId: schools[0].id,
        parentUserId: users[5].id,
        studentUserId: users[4].id,
      },
    },
    update: {
      status: ParentStudentLinkStatus.ACTIVE,
      startsAt: seededAt,
      endsAt: null,
      visibilityPolicyJson: {
        attendance: true,
        profile: true,
        privateCounselingNotes: false,
      },
    },
    create: {
      id: "50000000-0000-4000-8000-000000000001",
      schoolId: schools[0].id,
      parentUserId: users[5].id,
      studentUserId: users[4].id,
      relationshipType: "MOTHER",
      status: ParentStudentLinkStatus.ACTIVE,
      startsAt: seededAt,
      visibilityPolicyJson: {
        attendance: true,
        profile: true,
        privateCounselingNotes: false,
      },
    },
  });

  await prisma.parentStudentLink.upsert({
    where: {
      schoolId_parentUserId_studentUserId: {
        schoolId: schools[1].id,
        parentUserId: users[12].id,
        studentUserId: users[11].id,
      },
    },
    update: {
      status: ParentStudentLinkStatus.ACTIVE,
      startsAt: seededAt,
      endsAt: null,
      visibilityPolicyJson: {
        attendance: true,
        profile: true,
        privateCounselingNotes: false,
      },
    },
    create: {
      id: "50000000-0000-4000-8000-000000000002",
      schoolId: schools[1].id,
      parentUserId: users[12].id,
      studentUserId: users[11].id,
      relationshipType: "FATHER",
      status: ParentStudentLinkStatus.ACTIVE,
      startsAt: seededAt,
      visibilityPolicyJson: {
        attendance: true,
        profile: true,
        privateCounselingNotes: false,
      },
    },
  });

  for (const profile of mentorProfiles) {
    await prisma.mentorProfile.upsert({
      where: {
        schoolId_userId: {
          schoolId: profile.schoolId,
          userId: profile.userId,
        },
      },
      update: {
        headline: profile.headline,
        bio: profile.bio,
        yearsExperience: profile.yearsExperience,
        verificationStatus: MentorVerificationStatus.VERIFIED,
        verifiedByUserId: profile.verifiedByUserId,
        verifiedAt: seededAt,
        active: true,
      },
      create: {
        ...profile,
        verificationStatus: MentorVerificationStatus.VERIFIED,
        verifiedAt: seededAt,
      },
    });
  }

  for (const specialty of mentorSpecialties) {
    await prisma.mentorSpecialty.upsert({
      where: {
        schoolId_slug: {
          schoolId: specialty.schoolId,
          slug: specialty.slug,
        },
      },
      update: { name: specialty.name },
      create: {
        id: specialty.id,
        schoolId: specialty.schoolId,
        name: specialty.name,
        slug: specialty.slug,
      },
    });
    await prisma.mentorProfileSpecialty.upsert({
      where: {
        mentorProfileId_specialtyId: {
          mentorProfileId: specialty.mentorProfileId,
          specialtyId: specialty.id,
        },
      },
      update: {},
      create: {
        mentorProfileId: specialty.mentorProfileId,
        specialtyId: specialty.id,
      },
    });
  }

  for (const [profileIndex, profile] of mentorProfiles.entries()) {
    for (const [weekdayIndex, weekday] of [1, 2, 3, 4, 5].entries()) {
      const id = `63000000-0000-4000-800${profileIndex}-${String(
        weekdayIndex + 1,
      ).padStart(12, "0")}`;
      await prisma.mentorAvailabilityRule.upsert({
        where: { id },
        update: {
          weekday,
          startsAtLocal: "09:00",
          endsAtLocal: "16:00",
          timezone: "Asia/Ho_Chi_Minh",
          capacity: 1,
          active: true,
        },
        create: {
          id,
          mentorProfileId: profile.id,
          weekday,
          startsAtLocal: "09:00",
          endsAtLocal: "16:00",
          timezone: "Asia/Ho_Chi_Minh",
          capacity: 1,
        },
      });
    }
  }

  for (const appointmentType of appointmentTypes) {
    await prisma.appointmentType.upsert({
      where: { id: appointmentType.id },
      update: {
        name: appointmentType.name,
        description: appointmentType.description,
        durationMinutes: appointmentType.durationMinutes,
        requiresApproval: true,
        active: true,
      },
      create: {
        ...appointmentType,
        requiresApproval: true,
      },
    });
  }

  await prisma.mentorStudentAssignment.upsert({
    where: {
      schoolId_mentorProfileId_studentUserId: {
        schoolId: schools[0].id,
        mentorProfileId: mentorProfiles[0].id,
        studentUserId: users[4].id,
      },
    },
    update: {
      status: MentorAssignmentStatus.ACTIVE,
      startsAt: seededAt,
      endsAt: null,
      assignedByUserId: users[1].id,
    },
    create: {
      id: "64000000-0000-4000-8000-000000000001",
      schoolId: schools[0].id,
      mentorProfileId: mentorProfiles[0].id,
      studentUserId: users[4].id,
      status: MentorAssignmentStatus.ACTIVE,
      startsAt: seededAt,
      assignedByUserId: users[1].id,
    },
  });

  await prisma.mentoringCase.upsert({
    where: { id: demoMentoringCase.id },
    update: {
      title: demoMentoringCase.title,
      summary: demoMentoringCase.summary,
      status: "OPEN",
      primaryMentorProfileId: mentorProfiles[0].id,
      studentUserId: users[4].id,
      createdByUserId: users[1].id,
    },
    create: {
      id: demoMentoringCase.id,
      schoolId: schools[0].id,
      studentUserId: users[4].id,
      primaryMentorProfileId: mentorProfiles[0].id,
      title: demoMentoringCase.title,
      summary: demoMentoringCase.summary,
      status: "OPEN",
      priority: "NORMAL",
      createdByUserId: users[1].id,
      openedAt: seededAt,
    },
  });

  await prisma.mentoringGoal.upsert({
    where: { id: demoMentoringCase.goalId },
    update: {
      title: "Duy trì 4 buổi tự học mỗi tuần",
      description: "Ghi nhận tiến độ hằng tuần cùng cố vấn.",
      status: "ACTIVE",
      progressPercent: 25,
      createdByUserId: users[3].id,
    },
    create: {
      id: demoMentoringCase.goalId,
      caseId: demoMentoringCase.id,
      title: "Duy trì 4 buổi tự học mỗi tuần",
      description: "Ghi nhận tiến độ hằng tuần cùng cố vấn.",
      status: "ACTIVE",
      progressPercent: 25,
      createdByUserId: users[3].id,
    },
  });

  await prisma.mentoringTask.upsert({
    where: { id: demoMentoringCase.taskId },
    update: {
      title: "Chuẩn bị kế hoạch tuần tiếp theo",
      description: "Học sinh cập nhật kế hoạch trước phiên cố vấn.",
      status: "TODO",
      assigneeUserId: users[4].id,
      createdByUserId: users[3].id,
    },
    create: {
      id: demoMentoringCase.taskId,
      schoolId: schools[0].id,
      caseId: demoMentoringCase.id,
      assigneeUserId: users[4].id,
      title: "Chuẩn bị kế hoạch tuần tiếp theo",
      description: "Học sinh cập nhật kế hoạch trước phiên cố vấn.",
      status: "TODO",
      createdByUserId: users[3].id,
    },
  });

  for (const category of resourceCategories) {
    await prisma.resourceCategory.upsert({
      where: { id: category.id },
      update: {
        name: category.name,
        slug: category.slug,
        schoolId: category.schoolId,
      },
      create: category,
    });
  }

  for (const tag of resourceTags) {
    await prisma.resourceTag.upsert({
      where: { id: tag.id },
      update: {
        name: tag.name,
        slug: tag.slug,
        schoolId: tag.schoolId,
      },
      create: tag,
    });
  }

  for (const resource of demoResources) {
    await prisma.resource.upsert({
      where: { id: resource.id },
      update: {
        title: resource.title,
        slug: resource.slug,
        summary: resource.summary,
        status: resource.status,
        visibility: resource.visibility,
        createdByUserId: resource.createdByUserId,
        currentVersionId: null,
        publishedAt: resource.status === "PUBLISHED" ? seededAt : null,
      },
      create: {
        id: resource.id,
        schoolId: resource.schoolId,
        createdByUserId: resource.createdByUserId,
        title: resource.title,
        slug: resource.slug,
        summary: resource.summary,
        status: resource.status,
        visibility: resource.visibility,
        currentVersionId: null,
        publishedAt: resource.status === "PUBLISHED" ? seededAt : null,
      },
    });
    await prisma.resourceVersion.upsert({
      where: { id: resource.versionId },
      update: {
        resourceId: resource.id,
        versionNumber: 1,
        title: resource.title,
        summary: resource.summary,
        body: resource.body,
        createdByUserId: resource.createdByUserId,
      },
      create: {
        id: resource.versionId,
        resourceId: resource.id,
        versionNumber: 1,
        title: resource.title,
        summary: resource.summary,
        body: resource.body,
        createdByUserId: resource.createdByUserId,
      },
    });
    await prisma.resource.update({
      where: { id: resource.id },
      data: {
        currentVersionId: resource.versionId,
        categories: { set: [{ id: resource.categoryId }] },
        tags: { set: [{ id: resource.tagId }] },
      },
    });
    await prisma.resourceAnalyticsCounter.upsert({
      where: { resourceId: resource.id },
      update: {},
      create: { resourceId: resource.id },
    });
  }

  console.info(
    `Seeded ${schools.length} schools, ${users.length} demo users and ${mentorProfiles.length} mentor profiles. Shared password: ${demoPassword}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
