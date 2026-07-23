import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";
import { argon2id, hash } from "argon2";
import "dotenv/config";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://edutech:edutech_local@localhost:5432/edutech?schema=public";
const suffix = randomUUID().slice(0, 8);
const school = { id: randomUUID(), slug: `phase7-e2e-${suffix}`, name: `Trường E2E Phase 7 ${suffix}`, shortName: "E2E P7" };
const admin = { id: randomUUID(), membershipId: randomUUID(), email: `admin-${suffix}@phase7-e2e.local`, displayName: "E2E Quản trị CLB" };
const student = { id: randomUUID(), membershipId: randomUUID(), email: `student-${suffix}@phase7-e2e.local`, displayName: "E2E Học sinh" };
const password = "Phase7-E2E-Password-2026!";
let database: Client;

test.describe.configure({ mode: "serial" });

async function login(page: Page, account: typeof admin | typeof student) {
  await page.goto("/login");
  await page.locator("#email").fill(account.email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}

test.beforeAll(async () => {
  database = new Client({ connectionString: databaseUrl });
  await database.connect();
  const passwordHash = await hash(password, { type: argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1, hashLength: 32 });
  await database.query('INSERT INTO "School" (id, slug, name, "shortName", "updatedAt") VALUES ($1, $2, $3, $4, NOW())', [school.id, school.slug, school.name, school.shortName]);
  await database.query('INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1, $2, $2, $3, $4, false, NOW()), ($5, $6, $6, $3, $7, false, NOW())', [admin.id, admin.email, passwordHash, admin.displayName, student.id, student.email, student.displayName]);
  await database.query('INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1, $2, $3, \'ACTIVE\', NOW(), NOW()), ($4, $2, $5, \'ACTIVE\', NOW(), NOW())', [admin.membershipId, school.id, admin.id, student.membershipId, student.id]);
  await database.query('INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1, $2, \'SCHOOL_ADMIN\'), ($3, $4, \'STUDENT\')', [randomUUID(), admin.membershipId, randomUUID(), student.membershipId]);
});

test.afterAll(async () => {
  await database.query('DELETE FROM "ClubPostEventReport" WHERE "eventId" IN (SELECT id FROM "ClubEvent" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "ClubSafetyPlan" WHERE "eventId" IN (SELECT id FROM "ClubEvent" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "ClubAttendance" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "ClubConsent" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "ClubRegistration" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "ClubEvent" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "ClubTask" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "ClubAnnouncement" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "ClubMembership" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "ClubApplication" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "ClubBudget" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "Club" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "SchoolRoleAssignment" WHERE "membershipId" IN ($1, $2)', [admin.membershipId, student.membershipId]);
  await database.query('DELETE FROM "SchoolMembership" WHERE id IN ($1, $2)', [admin.membershipId, student.membershipId]);
  await database.query('DELETE FROM "Session" WHERE "userId" IN ($1, $2)', [admin.id, student.id]);
  await database.query('DELETE FROM "User" WHERE id IN ($1, $2)', [admin.id, student.id]);
  await database.query('DELETE FROM "School" WHERE id = $1', [school.id]);
  await database.end();
});

test("admin creates club and event, student sees club and registers", async ({ page }) => {
  await login(page, admin);
  await page.goto("/dashboard/clubs-events");
  await expect(page.getByRole("heading", { name: "Hoạt động học sinh có tổ chức" })).toBeVisible();
  await page.getByLabel("Tên câu lạc bộ").fill("Nhiếp ảnh E2E");
  await page.getByLabel("Mô tả").fill("Không gian kể chuyện bằng hình ảnh.");
  await page.getByLabel("Mở đăng ký ngay sau khi tạo").check();
  await page.getByRole("button", { name: "Tạo câu lạc bộ" }).click();
  await expect(page).toHaveURL(/result=club/);
  const clubId = (await database.query<{ id: string }>('SELECT id FROM "Club" WHERE "schoolId" = $1 AND name = $2', [school.id, "Nhiếp ảnh E2E"])).rows[0].id;
  const start = new Date(Date.now() + 3 * 86_400_000);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 90 * 60_000);
  const local = (date: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(date).replace(" ", "T");
  await page.goto(`/dashboard/clubs-events/${clubId}`);
  await page.getByLabel("Tên sự kiện").fill("Workshop nhiếp ảnh");
  await page.getByLabel("Bắt đầu").fill(local(start));
  await page.getByLabel("Kết thúc").fill(local(end));
  await page.getByRole("button", { name: "Tạo đề xuất" }).click();
  await expect(page).toHaveURL(/result=event/);
  await expect(page.getByText("Workshop nhiếp ảnh")).toBeVisible();
  await page.getByRole("button", { name: "Duyệt" }).click();
  await expect(page).toHaveURL(/result=event-review/);
  await page.locator("summary").filter({ hasText: "Mở menu tài khoản" }).click();
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, student);
  await page.goto(`/dashboard/clubs-events/${clubId}`);
  await expect(page.getByRole("heading", { name: "Nhiếp ảnh E2E" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo đề xuất" })).toHaveCount(0);
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL(/result=registration/);
  await page.getByRole("button", { name: "Gửi đơn tham gia" }).click();
  await expect(page).toHaveURL(/result=application/);
});
