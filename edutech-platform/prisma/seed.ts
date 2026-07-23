import { PrismaPg } from "@prisma/adapter-pg";
import { argon2id, hash } from "argon2";

import {
  MembershipStatus,
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

  console.info(
    `Seeded ${schools.length} schools and ${users.length} demo users. Shared password: ${demoPassword}`,
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
