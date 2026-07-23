import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";
import { argon2id, hash } from "argon2";
import "dotenv/config";
import { Client } from "pg";

import { encryptMentoringNote } from "../src/lib/mentoring/note-crypto";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://edutech:edutech_local@localhost:5432/edutech?schema=public";
const suffix = randomUUID().slice(0, 8);
const school = {
  id: randomUUID(),
  slug: `phase3-e2e-${suffix}`,
  name: `Trường E2E Cố vấn ${suffix}`,
  shortName: "E2E P3",
};
const mentor = { id: randomUUID(), membershipId: randomUUID(), email: `mentor-${suffix}@phase3-e2e.local`, displayName: "E2E Cố vấn" };
const student = { id: randomUUID(), membershipId: randomUUID(), email: `student-${suffix}@phase3-e2e.local`, displayName: "E2E Học sinh" };
const parent = { id: randomUUID(), membershipId: randomUUID(), email: `parent-${suffix}@phase3-e2e.local`, displayName: "E2E Phụ huynh" };
const profileId = randomUUID();
const typeId = randomUUID();
const caseId = randomUUID();
const password = "Phase3-E2E-Password-2026!";
const noteSecret =
  process.env.AUTH_SECRET ?? "edutech-local-development-secret-change-me";
const startedAt = new Date();
let database: Client;

test.describe.configure({ mode: "serial" });

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}

async function logout(page: Page) {
  await page.locator("summary").filter({ hasText: "Mở menu tài khoản" }).click();
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

test.beforeAll(async () => {
  database = new Client({ connectionString: databaseUrl });
  await database.connect();
  const passwordHash = await hash(password, {
    type: argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    hashLength: 32,
  });

  await database.query(
    'INSERT INTO "School" (id, slug, name, "shortName", "updatedAt") VALUES ($1, $2, $3, $4, NOW())',
    [school.id, school.slug, school.name, school.shortName],
  );
  for (const user of [mentor, student, parent]) {
    await database.query(
      'INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1, $2, $2, $3, $4, false, NOW())',
      [user.id, user.email, passwordHash, user.displayName],
    );
  }
  for (const [user, role] of [
    [mentor, "MENTOR_COUNSELOR"],
    [student, "STUDENT"],
    [parent, "PARENT_GUARDIAN"],
  ] as const) {
    await database.query(
      'INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1, $2, $3, \'ACTIVE\', NOW(), NOW())',
      [user.membershipId, school.id, user.id],
    );
    await database.query(
      'INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1, $2, $3)',
      [randomUUID(), user.membershipId, role],
    );
  }
  await database.query(
    'INSERT INTO "ParentStudentLink" (id, "schoolId", "parentUserId", "studentUserId", "relationshipType", status, "startsAt", "updatedAt") VALUES ($1, $2, $3, $4, \'PARENT\', \'ACTIVE\', NOW(), NOW())',
    [randomUUID(), school.id, parent.id, student.id],
  );
  await database.query(
    'INSERT INTO "MentorProfile" (id, "schoolId", "userId", headline, bio, "yearsExperience", "verificationStatus", "verifiedByUserId", "verifiedAt", active, "updatedAt") VALUES ($1, $2, $3, $4, $5, 5, \'VERIFIED\', $3, NOW(), true, NOW())',
    [profileId, school.id, mentor.id, "Đồng hành học tập", "Hỗ trợ mục tiêu học tập và thói quen tự học."],
  );
  for (let weekday = 0; weekday < 7; weekday += 1) {
    await database.query(
      'INSERT INTO "MentorAvailabilityRule" (id, "mentorProfileId", weekday, "startsAtLocal", "endsAtLocal", timezone, capacity, active, "updatedAt") VALUES ($1, $2, $3, \'09:00\', \'16:00\', \'Asia/Ho_Chi_Minh\', 1, true, NOW())',
      [randomUUID(), profileId, weekday],
    );
  }
  await database.query(
    'INSERT INTO "AppointmentType" (id, "schoolId", "mentorProfileId", name, description, "durationMinutes", capacity, "requiresApproval", active, "updatedAt") VALUES ($1, $2, $3, \'Phiên E2E\', \'Phiên kiểm thử vòng đời\', 60, 1, true, true, NOW())',
    [typeId, school.id, profileId],
  );
  await database.query(
    'INSERT INTO "MentorStudentAssignment" (id, "schoolId", "mentorProfileId", "studentUserId", status, "startsAt", "assignedByUserId", "updatedAt") VALUES ($1, $2, $3, $4, \'ACTIVE\', NOW(), $5, NOW())',
    [randomUUID(), school.id, profileId, student.id, mentor.id],
  );
  await database.query(
    'INSERT INTO "MentoringCase" (id, "schoolId", "studentUserId", "primaryMentorProfileId", title, summary, priority, status, "createdByUserId", "updatedAt") VALUES ($1, $2, $3, $4, \'Hồ sơ E2E\', \'Kiểm tra quyền riêng tư ghi chú.\', \'NORMAL\', \'OPEN\', $5, NOW())',
    [caseId, school.id, student.id, profileId, mentor.id],
  );
  await database.query(
    'INSERT INTO "MentoringNote" (id, "schoolId", "caseId", "studentUserId", "authorUserId", visibility, "encryptedBody", "updatedAt") VALUES ($1, $2, $3, $4, $5, \'PRIVATE_COUNSELOR\', $6, NOW()), ($7, $2, $3, $4, $5, \'GUARDIAN_VISIBLE\', $8, NOW())',
    [
      randomUUID(),
      school.id,
      caseId,
      student.id,
      mentor.id,
      encryptMentoringNote("Ghi chú riêng của cố vấn.", noteSecret),
      randomUUID(),
      encryptMentoringNote("Thông tin đã thống nhất với gia đình.", noteSecret),
    ],
  );
});

test.afterAll(async () => {
  const schoolIds = [school.id];
  await database.query('DELETE FROM "AppointmentTransition" WHERE "appointmentId" IN (SELECT id FROM "Appointment" WHERE "schoolId" = ANY($1::uuid[]))', [schoolIds]);
  await database.query('DELETE FROM "AppointmentAttendance" WHERE "appointmentId" IN (SELECT id FROM "Appointment" WHERE "schoolId" = ANY($1::uuid[]))', [schoolIds]);
  await database.query('DELETE FROM "AppointmentWaitlistEntry" WHERE "appointmentId" IN (SELECT id FROM "Appointment" WHERE "schoolId" = ANY($1::uuid[]))', [schoolIds]);
  await database.query('DELETE FROM "MentoringNote" WHERE "schoolId" = ANY($1::uuid[])', [schoolIds]);
  await database.query('DELETE FROM "MentoringCase" WHERE "schoolId" = ANY($1::uuid[])', [schoolIds]);
  await database.query('DELETE FROM "Appointment" WHERE "schoolId" = ANY($1::uuid[])', [schoolIds]);
  await database.query('DELETE FROM "MentorStudentAssignment" WHERE "schoolId" = ANY($1::uuid[])', [schoolIds]);
  await database.query('DELETE FROM "AppointmentType" WHERE "schoolId" = ANY($1::uuid[])', [schoolIds]);
  await database.query('DELETE FROM "MentorAvailabilityRule" WHERE "mentorProfileId" = $1', [profileId]);
  await database.query('DELETE FROM "MentorProfile" WHERE "schoolId" = ANY($1::uuid[])', [schoolIds]);
  await database.query('DELETE FROM "ParentStudentLink" WHERE "schoolId" = ANY($1::uuid[])', [schoolIds]);
  await database.query('DELETE FROM "SchoolRoleAssignment" WHERE "membershipId" IN (SELECT id FROM "SchoolMembership" WHERE "schoolId" = ANY($1::uuid[]))', [schoolIds]);
  await database.query('DELETE FROM "SchoolMembership" WHERE "schoolId" = ANY($1::uuid[])', [schoolIds]);
  await database.query('DELETE FROM "AuditEvent" WHERE "schoolId" = ANY($1::uuid[])', [schoolIds]);
  await database.query('DELETE FROM "DomainOutboxEvent" WHERE "schoolId" = ANY($1::uuid[])', [schoolIds]);
  await database.query('DELETE FROM "Session" WHERE "userId" = ANY($1::uuid[])', [[mentor.id, student.id, parent.id]]);
  await database.query('DELETE FROM "User" WHERE id = ANY($1::uuid[])', [[mentor.id, student.id, parent.id]]);
  await database.query('DELETE FROM "School" WHERE id = ANY($1::uuid[])', [schoolIds]);
  await database.query('DELETE FROM "AuthRateLimit" WHERE "updatedAt" >= $1', [startedAt]);
  await database.end();
});

test("học sinh đặt lịch, cố vấn duyệt, điểm danh và hoàn tất phiên", async ({ page }) => {
  await login(page, student.email);
  await page.goto("/dashboard/mentoring/mentors");
  await page.getByRole("link", { name: "Xem hồ sơ →" }).click();
  await expect(page.getByRole("heading", { name: mentor.displayName })).toBeVisible();
  await page.getByRole("button", { name: "Gửi yêu cầu đặt lịch" }).click();
  await expect(page).toHaveURL(/\/dashboard\/appointments\?result=booked$/);
  const appointment = await database.query<{ id: string }>(
    'SELECT id FROM "Appointment" WHERE "schoolId" = $1 ORDER BY "createdAt" DESC LIMIT 1',
    [school.id],
  );
  const appointmentId = appointment.rows[0].id;
  await logout(page);

  await login(page, mentor.email);
  await page.goto(`/dashboard/appointments/${appointmentId}`);
  await expect(page.getByRole("button", { name: "Duyệt lịch" })).toBeVisible();
  await page.getByRole("button", { name: "Duyệt lịch" }).click();
  await expect
    .poll(async () => {
      const result = await database.query<{ status: string }>(
        'SELECT status FROM "Appointment" WHERE id = $1',
        [appointmentId],
      );
      return result.rows[0]?.status;
    })
    .toBe("CONFIRMED");
  await page.reload();
  await page.getByRole("button", { name: "Lưu điểm danh" }).click();
  await expect
    .poll(async () => {
      const result = await database.query<{ status: string }>(
        'SELECT status FROM "AppointmentAttendance" WHERE "appointmentId" = $1 AND "userId" = $2',
        [appointmentId, student.id],
      );
      return result.rows[0]?.status;
    })
    .toBe("PRESENT");
  await page.reload();
  await page.getByRole("button", { name: "Đánh dấu hoàn tất" }).click();
  await expect
    .poll(async () => {
      const result = await database.query<{ status: string }>(
        'SELECT status FROM "Appointment" WHERE id = $1',
        [appointmentId],
      );
      return result.rows[0]?.status;
    })
    .toBe("COMPLETED");
});

test("phụ huynh thấy hồ sơ nhưng không thấy ghi chú riêng của cố vấn", async ({ page }) => {
  await page.context().clearCookies();
  await login(page, parent.email);
  await page.goto(`/dashboard/mentoring/cases/${caseId}`);
  await expect(page.getByRole("heading", { name: "Hồ sơ E2E" })).toBeVisible();
  await expect(page.getByText("Thông tin đã thống nhất với gia đình.")).toBeVisible();
  await expect(page.getByText("Ghi chú riêng của cố vấn.")).toHaveCount(0);
});
