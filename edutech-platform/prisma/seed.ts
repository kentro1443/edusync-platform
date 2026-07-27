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
  {
    id: "20000000-0000-4000-8000-000000000017",
    email: "dev@edutech.local",
    displayName: "Nhà phát triển EduTech",
    accountKind: "DEV_OPERATOR" as const,
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
    headline: "Anh khóa trên · SAT 1520, chuyên Toán & Business Case",
    bio: "Từng đạt SAT 1520 và giải Nhì Business Case cấp thành phố. Mình kèm em khóa dưới ôn SAT Math, luyện tư duy giải case và định hướng hồ sơ du học Mỹ.",
    yearsExperience: 3,
    gradeLabel: "Lớp 12",
    achievements: ["SAT 1520", "Giải Nhì Business Case TP", "Học bổng trại hè STEM"],
    hourlyRateMinVnd: 100_000,
    hourlyRateMaxVnd: 200_000,
    certifiedByUnion: true,
    verifiedByUserId: users[1].id,
  },
  {
    id: "60000000-0000-4000-8000-000000000002",
    schoolId: schools[1].id,
    userId: users[10].id,
    headline: "Chị khóa trên · IELTS 8.0, mentor viết luận du học",
    bio: "IELTS 8.0 và đã apply thành công học bổng bậc đại học. Mình hỗ trợ em khóa dưới luyện IELTS Writing/Speaking và xây dựng bài luận cá nhân.",
    yearsExperience: 2,
    gradeLabel: "Lớp 12",
    achievements: ["IELTS 8.0", "Học bổng đại học 50%", "Chủ nhiệm CLB Tiếng Anh"],
    hourlyRateMinVnd: 120_000,
    hourlyRateMaxVnd: 250_000,
    certifiedByUnion: true,
    verifiedByUserId: users[8].id,
  },
] as const;

const mentorSpecialties = [
  {
    id: "61000000-0000-4000-8000-000000000001",
    schoolId: schools[0].id,
    name: "Luyện thi SAT",
    slug: "luyen-thi-sat",
    mentorProfileId: mentorProfiles[0].id,
  },
  {
    id: "61000000-0000-4000-8000-000000000002",
    schoolId: schools[0].id,
    name: "Business Case & Hackathon",
    slug: "business-case-hackathon",
    mentorProfileId: mentorProfiles[0].id,
  },
  {
    id: "61000000-0000-4000-8000-000000000004",
    schoolId: schools[0].id,
    name: "Định hướng du học Mỹ",
    slug: "dinh-huong-du-hoc-my",
    mentorProfileId: mentorProfiles[0].id,
  },
  {
    id: "61000000-0000-4000-8000-000000000003",
    schoolId: schools[1].id,
    name: "Luyện thi IELTS",
    slug: "luyen-thi-ielts",
    mentorProfileId: mentorProfiles[1].id,
  },
  {
    id: "61000000-0000-4000-8000-000000000005",
    schoolId: schools[1].id,
    name: "Viết luận du học",
    slug: "viet-luan-du-hoc",
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

const demoClub = {
  id: "6a000000-0000-4000-8000-000000000001",
  eventId: "6a000000-0000-4000-8000-000000000101",
  schoolId: schools[0].id,
  createdByUserId: users[6].id,
  name: "Robotics Lab Minh Khai",
  slug: "robotics-lab-minh-khai",
};

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
        gradeLabel: profile.gradeLabel,
        achievements: [...profile.achievements],
        hourlyRateMinVnd: profile.hourlyRateMinVnd,
        hourlyRateMaxVnd: profile.hourlyRateMaxVnd,
        certifiedByUnion: profile.certifiedByUnion,
        certifiedAt: profile.certifiedByUnion ? seededAt : null,
        acceptingRequests: true,
        verificationStatus: MentorVerificationStatus.VERIFIED,
        verifiedByUserId: profile.verifiedByUserId,
        verifiedAt: seededAt,
        active: true,
      },
      create: {
        ...profile,
        achievements: [...profile.achievements],
        certifiedAt: profile.certifiedByUnion ? seededAt : null,
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

  // Peer-mentor marketplace demo (school Minh Khai): one open request awaiting a
  // decision, and one matched request with a settled engagement to show income.
  const openRequestId = "66000000-0000-4000-8000-000000000001";
  const openOfferId = "66000000-0000-4000-8000-000000000002";
  const matchedRequestId = "66000000-0000-4000-8000-000000000003";
  const matchedOfferId = "66000000-0000-4000-8000-000000000004";
  const engagementId = "66000000-0000-4000-8000-000000000005";

  await prisma.mentorRequest.upsert({
    where: { id: openRequestId },
    update: { status: "OPEN" },
    create: {
      id: openRequestId,
      schoolId: schools[0].id,
      studentUserId: users[4].id,
      specialtyId: mentorSpecialties[0].id,
      title: "Luyện SAT Math 5 buổi trước kỳ thi tháng 12",
      description:
        "Em đang ở mức SAT Math 680, muốn anh chị đã đạt 750+ kèm 5 buổi tập trung vào phần Đại số và Data Analysis.",
      preferredSessions: 5,
      budgetHintVnd: 150_000,
    },
  });
  await prisma.mentorOffer.upsert({
    where: { id: openOfferId },
    update: { status: "PENDING" },
    create: {
      id: openOfferId,
      schoolId: schools[0].id,
      requestId: openRequestId,
      mentorProfileId: mentorProfiles[0].id,
      mentorUserId: users[3].id,
      pricePerSessionVnd: 140_000,
      message:
        "Mình từng đạt SAT 1520, có lộ trình 5 buổi bám sát điểm yếu Đại số. Buổi đầu mình test nhanh để cá nhân hóa.",
    },
  });

  await prisma.mentorRequest.upsert({
    where: { id: matchedRequestId },
    update: { status: "MATCHED" },
    create: {
      id: matchedRequestId,
      schoolId: schools[0].id,
      studentUserId: users[4].id,
      specialtyId: mentorSpecialties[1].id,
      title: "Hỗ trợ vòng loại Business Case toàn trường",
      description:
        "Nhóm em cần mentor từng đoạt giải kèm 3 buổi xây khung phân tích và luyện phản biện trước vòng loại.",
      preferredSessions: 3,
      budgetHintVnd: 180_000,
    },
  });
  await prisma.mentorOffer.upsert({
    where: { id: matchedOfferId },
    update: { status: "ACCEPTED" },
    create: {
      id: matchedOfferId,
      schoolId: schools[0].id,
      requestId: matchedRequestId,
      mentorProfileId: mentorProfiles[0].id,
      mentorUserId: users[3].id,
      pricePerSessionVnd: 180_000,
      message: "Mình có bộ khung Business Case đã dùng để đạt giải Nhì, sẽ luyện cùng nhóm 3 buổi.",
      status: "ACCEPTED",
    },
  });
  await prisma.mentorEngagement.upsert({
    where: { id: engagementId },
    update: { paymentStatus: "PENDING" },
    create: {
      id: engagementId,
      schoolId: schools[0].id,
      requestId: matchedRequestId,
      offerId: matchedOfferId,
      mentorProfileId: mentorProfiles[0].id,
      mentorUserId: users[3].id,
      studentUserId: users[4].id,
      agreedPricePerSessionVnd: 180_000,
      sessions: 3,
      totalAmountVnd: 540_000,
      paymentStatus: "PENDING",
    },
  });

  // No-code approval workflows — digitising the paper CLB/event/admin forms the
  // PDF calls out (4 signatures, 1–2 weeks → 24–48h with real-time tracking).
  type SeedField = {
    key: string;
    label: string;
    type: "TEXT" | "TEXTAREA" | "NUMBER" | "DATE" | "SELECT" | "CHECKBOX" | "FILE";
    required?: boolean;
  };
  type SeedStep = { name: string; role: SchoolRole };
  type SeedTemplate = {
    idBase: string;
    slug: string;
    name: string;
    description: string;
    fields: SeedField[];
    steps: SeedStep[];
  };

  const workflowTemplates: SeedTemplate[] = [
    {
      idBase: "67000000-0000-4000-8000-00000000000",
      slug: "don-to-chuc-su-kien-clb",
      name: "Đơn xin tổ chức sự kiện CLB",
      description:
        "Số hóa quy trình 4 chữ ký: Chủ tịch CLB → GV phụ trách CLB → GV Ban Liên chi Đoàn → Phó Hiệu trưởng.",
      fields: [
        { key: "ten_su_kien", label: "Tên sự kiện", type: "TEXT", required: true },
        { key: "ngay_to_chuc", label: "Ngày tổ chức", type: "DATE", required: true },
        { key: "dia_diem", label: "Địa điểm", type: "TEXT", required: true },
        { key: "so_nguoi", label: "Số người dự kiến", type: "NUMBER", required: true },
        { key: "mo_ta", label: "Mô tả & mục tiêu", type: "TEXTAREA", required: true },
      ],
      steps: [
        { name: "Chủ tịch CLB duyệt", role: SchoolRole.CLUB_LEADER },
        { name: "Giáo viên phụ trách CLB", role: SchoolRole.TEACHER_STAFF },
        { name: "GV phụ trách Ban Liên chi Đoàn", role: SchoolRole.APPROVER_REVIEWER },
        { name: "Phó Hiệu trưởng phê duyệt", role: SchoolRole.SCHOOL_ADMIN },
      ],
    },
    {
      idBase: "67000000-0000-4000-8000-00000000010",
      slug: "don-muon-co-so-vat-chat",
      name: "Đơn xin mượn cơ sở vật chất",
      description: "Đề nghị mượn phòng học, hội trường hoặc thiết bị, theo dõi trạng thái real-time.",
      fields: [
        { key: "khu_vuc", label: "Phòng/khu vực", type: "TEXT", required: true },
        { key: "thoi_gian", label: "Thời gian sử dụng", type: "DATE", required: true },
        { key: "muc_dich", label: "Mục đích sử dụng", type: "TEXTAREA", required: true },
      ],
      steps: [
        { name: "Giáo viên phụ trách", role: SchoolRole.TEACHER_STAFF },
        { name: "Phó Hiệu trưởng phê duyệt", role: SchoolRole.SCHOOL_ADMIN },
      ],
    },
    {
      idBase: "67000000-0000-4000-8000-00000000020",
      slug: "don-xin-nghi-hoc",
      name: "Đơn xin nghỉ học có lý do",
      description: "Thủ tục hành chính cá nhân: nộp và theo dõi đơn xin nghỉ minh bạch.",
      fields: [
        { key: "ngay_nghi", label: "Ngày nghỉ", type: "DATE", required: true },
        { key: "ly_do", label: "Lý do", type: "TEXTAREA", required: true },
      ],
      steps: [{ name: "Giáo viên chủ nhiệm duyệt", role: SchoolRole.TEACHER_STAFF }],
    },
    {
      idBase: "67000000-0000-4000-8000-00000000030",
      slug: "don-xin-doi-mon",
      name: "Đơn xin đổi môn học",
      description: "Đề nghị đổi môn tự chọn, có xác nhận của giáo viên và nhà trường.",
      fields: [
        { key: "mon_hien_tai", label: "Môn hiện tại", type: "TEXT", required: true },
        { key: "mon_muon_doi", label: "Môn muốn đổi", type: "TEXT", required: true },
        { key: "ly_do", label: "Lý do", type: "TEXTAREA", required: true },
      ],
      steps: [
        { name: "Giáo viên phụ trách", role: SchoolRole.TEACHER_STAFF },
        { name: "Nhà trường xác nhận", role: SchoolRole.SCHOOL_ADMIN },
      ],
    },
  ];

  const templateVersionIds: Record<string, { versionId: string; stepIds: string[] }> = {};
  for (const template of workflowTemplates) {
    const templateId = `${template.idBase}1`;
    const versionId = `${template.idBase}2`;
    await prisma.workflowTemplate.upsert({
      where: { id: templateId },
      update: { name: template.name, description: template.description, status: "PUBLISHED", currentVersionId: versionId },
      create: {
        id: templateId,
        schoolId: schools[0].id,
        createdById: users[1].id,
        name: template.name,
        slug: template.slug,
        description: template.description,
        status: "PUBLISHED",
      },
    });
    await prisma.workflowVersion.upsert({
      where: { id: versionId },
      update: { publishedAt: seededAt },
      create: { id: versionId, templateId, version: 1, publishedAt: seededAt },
    });
    for (const [index, field] of template.fields.entries()) {
      await prisma.workflowFieldDefinition.upsert({
        where: { versionId_key: { versionId, key: field.key } },
        update: { label: field.label, type: field.type, position: index, required: field.required ?? false },
        create: { versionId, key: field.key, label: field.label, type: field.type, position: index, required: field.required ?? false },
      });
    }
    const stepIds: string[] = [];
    for (const [index, step] of template.steps.entries()) {
      const stepId = `${template.idBase}${(index + 3).toString(16)}`;
      stepIds.push(stepId);
      await prisma.workflowApprovalStep.upsert({
        where: { versionId_position: { versionId, position: index } },
        update: { name: step.name, role: step.role },
        create: { id: stepId, versionId, name: step.name, position: index, role: step.role },
      });
    }
    await prisma.workflowTemplate.update({ where: { id: templateId }, data: { currentVersionId: versionId } });
    templateVersionIds[template.slug] = { versionId, stepIds };
  }

  // A partially-approved event submission so reviewers have a live item and the
  // status timeline shows the "2 weeks → 48h" progress story.
  const eventTemplate = workflowTemplates[0];
  const eventTemplateId = `${eventTemplate.idBase}1`;
  const eventVersion = templateVersionIds[eventTemplate.slug];
  const submissionId = "68000000-0000-4000-8000-000000000001";
  await prisma.workflowSubmission.upsert({
    where: { id: submissionId },
    update: { status: "IN_REVIEW" },
    create: {
      id: submissionId,
      schoolId: schools[0].id,
      templateId: eventTemplateId,
      versionId: eventVersion.versionId,
      ownerUserId: users[4].id,
      status: "IN_REVIEW",
      submittedAt: seededAt,
    },
  });
  const submissionValues: Record<string, unknown> = {
    ten_su_kien: "Ngày hội STEM & Robot học đường",
    ngay_to_chuc: "2026-09-15",
    dia_diem: "Hội trường A",
    so_nguoi: 220,
    mo_ta: "Trưng bày dự án robot, workshop lập trình và giao lưu với cựu học sinh.",
  };
  for (const [key, value] of Object.entries(submissionValues)) {
    await prisma.workflowSubmissionValue.upsert({
      where: { submissionId_fieldKey: { submissionId, fieldKey: key } },
      update: { valueJson: value as never },
      create: { submissionId, fieldKey: key, valueJson: value as never },
    });
  }
  // steps 0,1 approved; step 2 active (awaiting Ban Liên chi Đoàn); step 3 pending.
  const stepStates: Array<"APPROVED" | "ACTIVE" | "PENDING"> = ["APPROVED", "APPROVED", "ACTIVE", "PENDING"];
  const stepActors = [users[6].id, users[2].id, users[7].id, users[1].id];
  for (const [index, stepId] of eventVersion.stepIds.entries()) {
    await prisma.workflowSubmissionStep.upsert({
      where: { submissionId_stepId: { submissionId, stepId } },
      update: { status: stepStates[index] },
      create: {
        submissionId,
        stepId,
        status: stepStates[index],
        assignedUserId: stepStates[index] === "ACTIVE" ? stepActors[index] : null,
        actedAt: stepStates[index] === "APPROVED" ? seededAt : null,
      },
    });
    if (stepStates[index] === "APPROVED") {
      await prisma.workflowDecision.upsert({
        where: { id: `68000000-0000-4000-8000-0000000001${(index + 1).toString(16)}0` },
        update: {},
        create: {
          id: `68000000-0000-4000-8000-0000000001${(index + 1).toString(16)}0`,
          submissionId,
          stepId,
          actorUserId: stepActors[index],
          type: "APPROVE",
          reason: "Đồng ý, kế hoạch rõ ràng.",
        },
      });
    }
  }

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

  await prisma.club.upsert({
    where: { id: demoClub.id },
    update: {
      name: demoClub.name,
      slug: demoClub.slug,
      status: "ACTIVE",
      description: "Không gian chế tạo, lập trình và thi đấu robot dành cho học sinh yêu công nghệ.",
      capacity: 40,
    },
    create: {
      id: demoClub.id,
      schoolId: demoClub.schoolId,
      createdByUserId: demoClub.createdByUserId,
      name: demoClub.name,
      slug: demoClub.slug,
      description: "Không gian chế tạo, lập trình và thi đấu robot dành cho học sinh yêu công nghệ.",
      status: "ACTIVE",
      capacity: 40,
    },
  });
  await prisma.clubMembership.upsert({
    where: { clubId_userId: { clubId: demoClub.id, userId: users[6].id } },
    update: { role: "LEADER", status: "ACTIVE", joinedAt: seededAt },
    create: {
      schoolId: demoClub.schoolId,
      clubId: demoClub.id,
      userId: users[6].id,
      role: "LEADER",
      status: "ACTIVE",
      joinedAt: seededAt,
    },
  });
  await prisma.clubMembership.upsert({
    where: { clubId_userId: { clubId: demoClub.id, userId: users[4].id } },
    update: { role: "MEMBER", status: "ACTIVE", joinedAt: seededAt },
    create: {
      schoolId: demoClub.schoolId,
      clubId: demoClub.id,
      userId: users[4].id,
      role: "MEMBER",
      status: "ACTIVE",
      joinedAt: seededAt,
    },
  });
  await prisma.clubEvent.upsert({
    where: { id: demoClub.eventId },
    update: {
      title: "Ngày hội robot học đường",
      startsAt: new Date("2026-08-15T02:00:00.000Z"),
      endsAt: new Date("2026-08-15T05:00:00.000Z"),
      status: "APPROVED",
      capacity: 30,
      location: "Phòng STEM 204",
    },
    create: {
      id: demoClub.eventId,
      schoolId: demoClub.schoolId,
      clubId: demoClub.id,
      createdByUserId: demoClub.createdByUserId,
      title: "Ngày hội robot học đường",
      description: "Trình diễn sản phẩm và vòng thi robot thân thiện.",
      startsAt: new Date("2026-08-15T02:00:00.000Z"),
      endsAt: new Date("2026-08-15T05:00:00.000Z"),
      status: "APPROVED",
      capacity: 30,
      location: "Phòng STEM 204",
    },
  });

  // Club leader workspace demo: announcement, tasks, budget + expense.
  await prisma.clubAnnouncement.upsert({
    where: { id: "6a100000-0000-4000-8000-000000000001" },
    update: { title: "Chuẩn bị Ngày hội robot" },
    create: {
      id: "6a100000-0000-4000-8000-000000000001",
      schoolId: demoClub.schoolId,
      clubId: demoClub.id,
      authorUserId: users[6].id,
      title: "Chuẩn bị Ngày hội robot",
      body: "Các nhóm hoàn thiện sản phẩm trước ngày 12/08 và đăng ký khung trình diễn.",
      publishedAt: seededAt,
    },
  });
  await prisma.clubTask.upsert({
    where: { id: "6a200000-0000-4000-8000-000000000001" },
    update: { title: "Đặt bàn trưng bày" },
    create: {
      id: "6a200000-0000-4000-8000-000000000001",
      schoolId: demoClub.schoolId,
      clubId: demoClub.id,
      createdById: users[6].id,
      assigneeUserId: users[4].id,
      title: "Đặt bàn trưng bày",
      description: "Liên hệ phòng hành chính mượn 8 bàn.",
      status: "IN_PROGRESS",
    },
  });
  await prisma.clubTask.upsert({
    where: { id: "6a200000-0000-4000-8000-000000000002" },
    update: { title: "Chuẩn bị poster" },
    create: {
      id: "6a200000-0000-4000-8000-000000000002",
      schoolId: demoClub.schoolId,
      clubId: demoClub.id,
      createdById: users[6].id,
      title: "Chuẩn bị poster",
      status: "TODO",
    },
  });
  await prisma.clubBudget.upsert({
    where: { id: "6a300000-0000-4000-8000-000000000001" },
    update: { name: "Ngân sách Ngày hội robot", amount: 5_000_000, spent: 1_200_000, status: "SUBMITTED" },
    create: {
      id: "6a300000-0000-4000-8000-000000000001",
      schoolId: demoClub.schoolId,
      clubId: demoClub.id,
      name: "Ngân sách Ngày hội robot",
      amount: 5_000_000,
      spent: 1_200_000,
      status: "SUBMITTED",
    },
  });
  await prisma.clubExpense.upsert({
    where: { id: "6a400000-0000-4000-8000-000000000001" },
    update: { description: "Vật tư trưng bày" },
    create: {
      id: "6a400000-0000-4000-8000-000000000001",
      budgetId: "6a300000-0000-4000-8000-000000000001",
      description: "Vật tư trưng bày",
      amount: 1_200_000,
      spentAt: seededAt,
    },
  });
  // Student registered for the event; guardian consent pending (parent demo).
  await prisma.clubRegistration.upsert({
    where: { eventId_userId: { eventId: demoClub.eventId, userId: users[4].id } },
    update: { status: "REGISTERED" },
    create: {
      schoolId: demoClub.schoolId,
      eventId: demoClub.eventId,
      userId: users[4].id,
      status: "REGISTERED",
      position: null,
    },
  });
  await prisma.clubConsent.upsert({
    where: {
      eventId_studentId_guardianId: {
        eventId: demoClub.eventId,
        studentId: users[4].id,
        guardianId: users[5].id,
      },
    },
    update: { status: "PENDING" },
    create: {
      schoolId: demoClub.schoolId,
      eventId: demoClub.eventId,
      studentId: users[4].id,
      guardianId: users[5].id,
      status: "PENDING",
    },
  });

  const demoConversationId = "6b000000-0000-4000-8000-000000000001";
  const demoMessageId = "6b000000-0000-4000-8000-000000000101";
  await prisma.conversation.upsert({
    where: { id: demoConversationId },
    update: { title: "Điều phối tuần học Minh Khai" },
    create: {
      id: demoConversationId,
      schoolId: schools[0].id,
      createdByUserId: users[1].id,
      title: "Điều phối tuần học Minh Khai",
      createdAt: seededAt,
    },
  });
  for (const userId of [users[1].id, users[2].id]) {
    await prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: demoConversationId, userId } },
      update: {},
      create: {
        conversationId: demoConversationId,
        userId,
        joinedAt: seededAt,
        lastReadAt: userId === users[1].id ? seededAt : null,
      },
    });
  }
  await prisma.message.upsert({
    where: { id: demoMessageId },
    update: {
      body: "Chào cô Hà, lịch họp tổ chuyên môn đã được cập nhật trong lịch trường.",
    },
    create: {
      id: demoMessageId,
      schoolId: schools[0].id,
      conversationId: demoConversationId,
      senderUserId: users[1].id,
      body: "Chào cô Hà, lịch họp tổ chuyên môn đã được cập nhật trong lịch trường.",
      createdAt: seededAt,
    },
  });
  await prisma.messageMention.upsert({
    where: {
      messageId_userId: { messageId: demoMessageId, userId: users[2].id },
    },
    update: {},
    create: { messageId: demoMessageId, userId: users[2].id, createdAt: seededAt },
  });
  await prisma.notification.upsert({
    where: { dedupeKey: `notification:MENTION:${demoMessageId}:${users[2].id}` },
    update: {},
    create: {
      schoolId: schools[0].id,
      userId: users[2].id,
      type: "MENTION",
      title: `${users[1].displayName} đã nhắc đến bạn`,
      body: "Lịch họp tổ chuyên môn đã được cập nhật.",
      href: `/dashboard/messages/${demoConversationId}`,
      dedupeKey: `notification:MENTION:${demoMessageId}:${users[2].id}`,
      createdAt: seededAt,
    },
  });
  await prisma.activityFeedProjection.upsert({
    where: { dedupeKey: `activity:message.sent:${demoMessageId}:${users[2].id}` },
    update: {},
    create: {
      schoolId: schools[0].id,
      userId: users[2].id,
      actorUserId: users[1].id,
      eventType: "MESSAGE_SENT",
      objectType: "Message",
      objectId: demoMessageId,
      summary: `${users[1].displayName} đã gửi tin nhắn mới.`,
      href: `/dashboard/messages/${demoConversationId}`,
      dedupeKey: `activity:message.sent:${demoMessageId}:${users[2].id}`,
      createdAt: seededAt,
    },
  });

  console.info(
    `Seeded ${schools.length} schools, ${users.length} development users and ${mentorProfiles.length} mentor profiles. Shared password: ${demoPassword}`,
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
