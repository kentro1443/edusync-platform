import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";
import { argon2id, hash } from "argon2";
import "dotenv/config";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://edutech:edutech_local@localhost:5432/edutech?schema=public";
const suffix = randomUUID().slice(0, 8);
const school = { id: randomUUID(), slug: `phase56-e2e-${suffix}`, name: `Trường E2E Phase 5 6 ${suffix}`, shortName: "E2E P56" };
const admin = { id: randomUUID(), membershipId: randomUUID(), email: `admin-${suffix}@phase56-e2e.local`, displayName: "E2E Điều phối" };
const password = "Phase56-E2E-Password-2026!";
let database: Client;
let submissionId = "";

test.describe.configure({ mode: "serial" });

async function login(page: Page) {
  if (page.url().includes("/dashboard")) return;
  await page.goto("/login");
  await page.locator("#email").fill(admin.email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}

test.beforeAll(async () => {
  database = new Client({ connectionString: databaseUrl });
  await database.connect();
  const passwordHash = await hash(password, { type: argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1, hashLength: 32 });
  await database.query('INSERT INTO "School" (id, slug, name, "shortName", "updatedAt") VALUES ($1, $2, $3, $4, NOW())', [school.id, school.slug, school.name, school.shortName]);
  await database.query('INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1, $2, $2, $3, $4, false, NOW())', [admin.id, admin.email, passwordHash, admin.displayName]);
  await database.query('INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1, $2, $3, \'ACTIVE\', NOW(), NOW())', [admin.membershipId, school.id, admin.id]);
  await database.query('INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1, $2, \'SCHOOL_ADMIN\')', [randomUUID(), admin.membershipId]);
});

test.afterAll(async () => {
  await database.query('DELETE FROM "WorkflowSubmissionHistory" WHERE "submissionId" IN (SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "WorkflowDecision" WHERE "submissionId" IN (SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "WorkflowSubmissionStep" WHERE "submissionId" IN (SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "WorkflowSubmissionValue" WHERE "submissionId" IN (SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "WorkflowSubmission" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "WorkflowApprovalStep" WHERE "versionId" IN (SELECT id FROM "WorkflowVersion" WHERE "templateId" IN (SELECT id FROM "WorkflowTemplate" WHERE "schoolId" = $1))', [school.id]);
  await database.query('DELETE FROM "WorkflowFieldDefinition" WHERE "versionId" IN (SELECT id FROM "WorkflowVersion" WHERE "templateId" IN (SELECT id FROM "WorkflowTemplate" WHERE "schoolId" = $1))', [school.id]);
  await database.query('DELETE FROM "WorkflowVersion" WHERE "templateId" IN (SELECT id FROM "WorkflowTemplate" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "WorkflowTemplate" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "CalendarAttendance" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "CalendarBooking" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "RecurrenceException" WHERE "eventId" IN (SELECT id FROM "CalendarEvent" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "CalendarReminder" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "CalendarEvent" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "Calendar" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "CalendarSource" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "SchoolRoleAssignment" WHERE "membershipId" = $1', [admin.membershipId]);
  await database.query('DELETE FROM "SchoolMembership" WHERE id = $1', [admin.membershipId]);
  await database.query('DELETE FROM "Session" WHERE "userId" = $1', [admin.id]);
  await database.query('DELETE FROM "User" WHERE id = $1', [admin.id]);
  await database.query('DELETE FROM "School" WHERE id = $1', [school.id]);
  await database.end();
});

test("calendar tạo sự kiện, chặn trùng và xuất iCalendar", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/calendar");
  await expect(page.getByRole("heading", { name: "Lịch trường rõ ràng, dễ điều phối" })).toBeVisible();
  const start = new Date(Date.now() + 2 * 86_400_000);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60_000);
  const local = (date: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(date).replace(" ", "T");
  await page.getByLabel("Tên sự kiện").fill("Họp điều phối E2E");
  await page.getByLabel("Bắt đầu").fill(local(start));
  await page.getByLabel("Kết thúc").fill(local(end));
  await page.getByLabel("Địa điểm").fill("Phòng E2E");
  await page.getByRole("button", { name: "Tạo sự kiện" }).click();
  await expect(page).toHaveURL(/result=created/);
  await expect(page.getByText("Họp điều phối E2E")).toBeVisible();
  await page.getByLabel("Tên sự kiện").fill("Sự kiện trùng E2E");
  await page.getByLabel("Bắt đầu").fill(local(new Date(start.getTime() + 30 * 60_000)));
  await page.getByLabel("Kết thúc").fill(local(new Date(end.getTime() + 30 * 60_000)));
  await page.getByRole("button", { name: "Tạo sự kiện" }).click();
  await expect(page).toHaveURL(/error=conflict/);
  const ical = await page.evaluate(async () => {
    const response = await fetch("/dashboard/calendar/ical");
    return { status: response.status, contentType: response.headers.get("content-type"), body: await response.text() };
  });
  expect(ical.status).toBe(200);
  expect(ical.contentType).toContain("text/calendar");
  expect(ical.body).toContain("Họp điều phối E2E");
});

test("workflow builder publish, submit và approve giữ version lịch sử", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/workflows");
  await page.getByLabel("Tên quy trình").fill("Xin tổ chức E2E");
  await page.getByLabel("Mô tả").fill("Quy trình kiểm tra Phase 6.");
  await page.getByRole("button", { name: "Tạo bản nháp" }).click();
  await expect(page).toHaveURL(/\/dashboard\/workflows\/.+result=created/);
  await page.getByLabel("Mã trường").fill("reason");
  await page.getByLabel("Nhãn hiển thị").fill("Lý do");
  await page.getByRole("button", { name: "Thêm trường" }).click();
  await page.getByRole("button", { name: "Xuất bản version" }).click();
  await expect(page).toHaveURL(/result=published/);
  await page.goto("/dashboard/workflows");
  await page.getByRole("button", { name: "Nộp hồ sơ" }).click();
  await expect(page).toHaveURL(/\/dashboard\/workflows\/submissions\/.+/);
  submissionId = page.url().match(/submissions\/([^?]+)/)?.[1] ?? "";
  await page.getByLabel("Tiêu đề").fill("Hội thảo E2E");
  await page.getByLabel("Lý do").fill("Kiểm tra version bất biến.");
  await page.getByRole("button", { name: "Gửi hồ sơ" }).click();
  await expect(page).toHaveURL(/result=submitted/);
  await page.getByRole("button", { name: "Duyệt" }).click();
  await expect(page).toHaveURL(/result=decision/);
  await expect(page.getByText("APPROVED", { exact: true })).toBeVisible();
  expect((await database.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM "WorkflowVersion" WHERE "templateId" = (SELECT "templateId" FROM "WorkflowSubmission" WHERE id = $1)', [submissionId])).rows[0].count).toBe("2");
});
