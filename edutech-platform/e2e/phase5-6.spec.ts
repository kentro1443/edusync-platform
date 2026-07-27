import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";
import { argon2id, hash } from "argon2";
import "dotenv/config";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://edutech:edutech_local@localhost:5432/edutech?schema=public";
const suffix = randomUUID().slice(0, 8);
const school = { id: randomUUID(), slug: `phase56-e2e-${suffix}`, name: `Trường E2E Phase 5 6 ${suffix}`, shortName: "E2E P56" };
const admin = { id: randomUUID(), membershipId: randomUUID(), email: `admin-${suffix}@phase56-e2e.local`, displayName: "E2E Điều phối" };
const reviewer = { id: randomUUID(), membershipId: randomUUID(), email: `reviewer-${suffix}@phase56-e2e.local`, displayName: "E2E Người duyệt" };
const student = { id: randomUUID(), membershipId: randomUUID(), email: `student-${suffix}@phase56-e2e.local`, displayName: "E2E Học sinh" };
const password = "Phase56-E2E-Password-2026!";
let database: Client;
let submissionId = "";
let recurrenceRuleId = "";

function createMinimalPdf(): Buffer {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    "<< /Length 52 >>\nstream\nBT /F1 24 Tf 72 720 Td (Workflow EduTech) Tj ET\nendstream",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${offset.toString().padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf);
}

async function removeStoredKey(storageKey: string): Promise<void> {
  const root = path.resolve(process.env.FILE_STORAGE_ROOT ?? "./storage");
  await rm(path.join(root, storageKey.slice(0, 2), storageKey.slice(2, 4), storageKey), { force: true });
}

test.describe.configure({ mode: "serial" });

async function login(page: Page) {
  if (page.url().includes("/dashboard")) return;
  await page.goto("/login");
  await page.locator("#email").fill(admin.email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}

async function submitServerAction(page: Page, buttonName: string, expectedRedirect: RegExp) {
  const [response] = await Promise.all([
    page.waitForResponse((candidate) => candidate.request().method() === "POST"),
    page.getByRole("button", { name: buttonName, exact: true }).click(),
  ]);

  expect(response.status()).toBe(303);
  const redirectPath = response.headers()["x-action-redirect"]?.split(";")[0];
  expect(redirectPath, `${buttonName} must return a Next.js action redirect`).toMatch(expectedRedirect);

  try {
    await page.waitForURL(expectedRedirect, { timeout: 1_000 });
  } catch {
    await page.goto(redirectPath!);
  }

  await expect(page).toHaveURL(expectedRedirect);
}

test.beforeAll(async () => {
  database = new Client({ connectionString: databaseUrl });
  await database.connect();
  const passwordHash = await hash(password, { type: argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1, hashLength: 32 });
  await database.query('INSERT INTO "School" (id, slug, name, "shortName", "updatedAt") VALUES ($1, $2, $3, $4, NOW())', [school.id, school.slug, school.name, school.shortName]);
  await database.query('INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1, $2, $2, $3, $4, false, NOW())', [admin.id, admin.email, passwordHash, admin.displayName]);
  await database.query('INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1, $2, $2, $3, $4, false, NOW())', [reviewer.id, reviewer.email, passwordHash, reviewer.displayName]);
  await database.query('INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1, $2, $2, $3, $4, false, NOW())', [student.id, student.email, passwordHash, student.displayName]);
  await database.query('INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1, $2, $3, \'ACTIVE\', NOW(), NOW())', [admin.membershipId, school.id, admin.id]);
  await database.query('INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1, $2, $3, \'ACTIVE\', NOW(), NOW())', [reviewer.membershipId, school.id, reviewer.id]);
  await database.query('INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1, $2, $3, \'ACTIVE\', NOW(), NOW())', [student.membershipId, school.id, student.id]);
  await database.query('INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1, $2, \'SCHOOL_ADMIN\')', [randomUUID(), admin.membershipId]);
  await database.query('INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1, $2, \'SCHOOL_ADMIN\')', [randomUUID(), reviewer.membershipId]);
  await database.query('INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1, $2, \'STUDENT\')', [randomUUID(), student.membershipId]);
});

test.afterAll(async () => {
  const files = await database.query<{ storageKey: string }>('SELECT "storageKey" FROM "StoredFile" WHERE "schoolId" = $1', [school.id]);
  await Promise.all(files.rows.map((file) => removeStoredKey(file.storageKey).catch(() => undefined)));
  await database.query('DELETE FROM "WorkflowSubmissionComment" WHERE "submissionId" IN (SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "WorkflowSubmissionHistory" WHERE "submissionId" IN (SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "WorkflowDecision" WHERE "submissionId" IN (SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "WorkflowDelegation" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "WorkflowSubmissionStep" WHERE "submissionId" IN (SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "WorkflowSubmissionValue" WHERE "submissionId" IN (SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "WorkflowSubmission" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "FileLink" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "FileVersion" WHERE "fileId" IN (SELECT id FROM "StoredFile" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "StoredFile" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "WorkflowApprovalStep" WHERE "versionId" IN (SELECT id FROM "WorkflowVersion" WHERE "templateId" IN (SELECT id FROM "WorkflowTemplate" WHERE "schoolId" = $1))', [school.id]);
  await database.query('DELETE FROM "WorkflowFieldDefinition" WHERE "versionId" IN (SELECT id FROM "WorkflowVersion" WHERE "templateId" IN (SELECT id FROM "WorkflowTemplate" WHERE "schoolId" = $1))', [school.id]);
  await database.query('DELETE FROM "WorkflowVersion" WHERE "templateId" IN (SELECT id FROM "WorkflowTemplate" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "WorkflowTemplate" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "CalendarAttendance" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "CalendarBooking" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "RecurrenceException" WHERE "eventId" IN (SELECT id FROM "CalendarEvent" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "CalendarReminder" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "CalendarEvent" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "BlockedPeriod" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "BookableResource" WHERE "schoolId" = $1', [school.id]);
  if (recurrenceRuleId) await database.query('DELETE FROM "RecurrenceRule" WHERE id = $1', [recurrenceRuleId]);
  await database.query('DELETE FROM "Calendar" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "CalendarSource" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "SchoolRoleAssignment" WHERE "membershipId" = $1', [admin.membershipId]);
  await database.query('DELETE FROM "SchoolRoleAssignment" WHERE "membershipId" = $1', [reviewer.membershipId]);
  await database.query('DELETE FROM "SchoolRoleAssignment" WHERE "membershipId" = $1', [student.membershipId]);
  await database.query('DELETE FROM "SchoolMembership" WHERE id = $1', [admin.membershipId]);
  await database.query('DELETE FROM "SchoolMembership" WHERE id = $1', [reviewer.membershipId]);
  await database.query('DELETE FROM "SchoolMembership" WHERE id = $1', [student.membershipId]);
  await database.query('DELETE FROM "Session" WHERE "userId" = $1', [admin.id]);
  await database.query('DELETE FROM "Session" WHERE "userId" = $1', [reviewer.id]);
  await database.query('DELETE FROM "Session" WHERE "userId" = $1', [student.id]);
  await database.query('DELETE FROM "User" WHERE id = $1', [admin.id]);
  await database.query('DELETE FROM "User" WHERE id = $1', [reviewer.id]);
  await database.query('DELETE FROM "User" WHERE id = $1', [student.id]);
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
  const calendarId = (await database.query<{ id: string }>('SELECT id FROM "Calendar" WHERE "schoolId" = $1 ORDER BY "createdAt" LIMIT 1', [school.id])).rows[0].id;
  await database.query('INSERT INTO "CalendarEvent" (id, "schoolId", "calendarId", "createdByUserId", title, "startsAt", "endsAt", location, "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, \'Phòng E2E\', NOW())', [randomUUID(), school.id, calendarId, admin.id, "Họp điều phối E2E", start, end]);
  await page.goto(`/dashboard/calendar?date=${local(start).slice(0, 10)}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Họp điều phối E2E")).toBeVisible();
  await page.getByLabel("Tên sự kiện").fill("Sự kiện trùng E2E");
  await page.getByLabel("Bắt đầu").fill(local(new Date(start.getTime() + 30 * 60_000)));
  await page.getByLabel("Kết thúc").fill(local(new Date(end.getTime() + 30 * 60_000)));
  await submitServerAction(page, "Tạo sự kiện", /error=conflict/);
  await page.goto("/dashboard/calendar/resources");
  await expect(page.getByRole("heading", { name: "Phòng và tài nguyên đặt chỗ" })).toBeVisible();
  await page.getByLabel("Tên").fill("Studio E2E");
  await page.locator('form').filter({ has: page.getByRole("button", { name: "Thêm tài nguyên" }) }).locator('input[name="capacity"]').fill("24");
  await submitServerAction(page, "Thêm tài nguyên", /result=resource/);
  const resourceId = (await database.query<{ id: string }>('SELECT id FROM "BookableResource" WHERE "schoolId" = $1 AND name = $2', [school.id, "Studio E2E"])).rows[0].id;
  const blockedStart = new Date(start.getTime() + 6 * 60 * 60_000);
  const blockedEnd = new Date(blockedStart.getTime() + 60 * 60_000);
  await page.getByLabel("Tài nguyên").selectOption(resourceId);
  await page.getByLabel("Bắt đầu").fill(local(blockedStart));
  await page.getByLabel("Kết thúc").fill(local(blockedEnd));
  await page.getByLabel("Lý do").fill("Bảo trì E2E");
  await submitServerAction(page, "Khóa khung giờ", /result=blocked/);
  await page.goto("/dashboard/calendar");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Tên sự kiện").fill("Sự kiện dùng phòng bị khóa");
  await page.getByLabel("Bắt đầu").fill(local(new Date(blockedStart.getTime() + 15 * 60_000)));
  await page.getByLabel("Kết thúc").fill(local(new Date(blockedEnd.getTime() + 15 * 60_000)));
  await page.getByLabel("Tài nguyên đặt chỗ").selectOption(resourceId);
  await submitServerAction(page, "Tạo sự kiện", /error=conflict/);
  const recurringStart = new Date(start.getTime() + 3 * 60 * 60_000);
  const recurringEnd = new Date(recurringStart.getTime() + 60 * 60_000);
  recurrenceRuleId = randomUUID();
  const recurringEventId = randomUUID();
  await database.query('INSERT INTO "RecurrenceRule" (id, frequency, interval, count, "byWeekday") VALUES ($1, \'WEEKLY\', 1, 3, ARRAY[]::integer[])', [recurrenceRuleId]);
  await database.query('INSERT INTO "CalendarEvent" (id, "schoolId", "calendarId", "createdByUserId", "recurrenceRuleId", title, "startsAt", "endsAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())', [recurringEventId, school.id, calendarId, admin.id, recurrenceRuleId, "Lịch lặp E2E", recurringStart, recurringEnd]);
  await page.goto(`/dashboard/calendar?view=day&date=${local(recurringStart).slice(0, 10)}`);
  await page.getByRole("link", { name: "Lịch lặp E2E" }).click();
  await expect(page.getByRole("heading", { name: "Ngoại lệ lịch lặp" })).toBeVisible();
  await page.getByLabel("Xử lý").selectOption("cancel");
  await submitServerAction(page, "Lưu ngoại lệ", /result=recurrence/);
  await expect(page.getByText("Đã hủy")).toBeVisible();
  await page.goto("/dashboard/calendar");
  const ical = await page.evaluate(async () => {
    const response = await fetch("/dashboard/calendar/ical");
    return { status: response.status, contentType: response.headers.get("content-type"), body: await response.text() };
  });
  expect(ical.status).toBe(200);
  expect(ical.contentType).toContain("text/calendar");
  expect(ical.body).toContain("Họp điều phối E2E");
});

test("workflow builder publish, submit và approve giữ version lịch sử", async ({ page, browser }) => {
  await login(page);
  const templateId = randomUUID();
  const versionId = randomUUID();
  await database.query('INSERT INTO "WorkflowTemplate" (id, "schoolId", "createdById", name, slug, description, "currentVersionId", "updatedAt") VALUES ($1, $2, $3, \'Xin tổ chức E2E\', $4, \'Quy trình kiểm tra Phase 6.\', $5, NOW())', [templateId, school.id, admin.id, `xin-to-chuc-${suffix}`, versionId]);
  await database.query('INSERT INTO "WorkflowVersion" (id, "templateId", version) VALUES ($1, $2, 1)', [versionId, templateId]);
  await database.query('INSERT INTO "WorkflowFieldDefinition" (id, "versionId", key, label, type, position, required) VALUES ($1, $2, \'title\', \'Tiêu đề\', \'TEXT\', 0, true), ($3, $2, \'reason\', \'Lý do\', \'TEXT\', 1, false), ($4, $2, \'kind\', \'Loại hồ sơ\', \'TEXT\', 2, false)', [randomUUID(), versionId, randomUUID(), randomUUID()]);
  await database.query('INSERT INTO "WorkflowApprovalStep" (id, "versionId", name, position, role) VALUES ($1, $2, \'Duyệt nội dung\', 0, \'SCHOOL_ADMIN\')', [randomUUID(), versionId]);
  await database.query('INSERT INTO "WorkflowApprovalStep" (id, "versionId", name, position, role, "parallelGroup") VALUES ($1, $2, \'Duyệt song song A\', 1, \'SCHOOL_ADMIN\', 1), ($3, $2, \'Duyệt song song B\', 2, \'SCHOOL_ADMIN\', 1)', [randomUUID(), versionId, randomUUID()]);
  await database.query('INSERT INTO "WorkflowApprovalStep" (id, "versionId", name, position, role, "conditionJson") VALUES ($1, $2, \'Chỉ duyệt hồ sơ VIP\', 3, \'SCHOOL_ADMIN\', $3::jsonb)', [randomUUID(), versionId, JSON.stringify({ field: "kind", operator: "equals", value: "VIP" })]);
  await page.goto(`/dashboard/workflows/${templateId}`);
  await expect(page.getByText("kind · TEXT")).toBeVisible();
  await expect(page.getByText("nhóm song song 1")).toHaveCount(2);
  await expect(page.getByText("Chỉ chạy khi kind equals VIP")).toBeVisible();
  const nextVersionId = randomUUID();
  await database.query('UPDATE "WorkflowVersion" SET "publishedAt" = NOW() WHERE id = $1', [versionId]);
  await database.query('INSERT INTO "WorkflowVersion" (id, "templateId", version) VALUES ($1, $2, 2)', [nextVersionId, templateId]);
  await database.query('UPDATE "WorkflowTemplate" SET status = \'PUBLISHED\', "currentVersionId" = $1, "updatedAt" = NOW() WHERE id = $2', [nextVersionId, templateId]);
  submissionId = randomUUID();
  await database.query('INSERT INTO "WorkflowSubmission" (id, "schoolId", "templateId", "versionId", "ownerUserId", status, "updatedAt") VALUES ($1, $2, $3, $4, $5, \'DRAFT\', NOW())', [submissionId, school.id, templateId, versionId, admin.id]);
  await database.query('INSERT INTO "WorkflowSubmissionStep" (id, "submissionId", "stepId", status) SELECT gen_random_uuid(), $1, id, \'PENDING\' FROM "WorkflowApprovalStep" WHERE "versionId" = $2', [submissionId, versionId]);
  await database.query('INSERT INTO "WorkflowSubmissionHistory" (id, "submissionId", "actorUserId", action, "toStatus") VALUES (gen_random_uuid(), $1, $2, \'CREATE\', \'DRAFT\')', [submissionId, admin.id]);
  await page.goto(`/dashboard/workflows/submissions/${submissionId}`);
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Tiêu đề").fill("Hội thảo E2E");
  await page.getByLabel("Lý do").fill("Kiểm tra version bất biến.");
  await page.getByLabel("Loại hồ sơ").fill("STANDARD");
  await page.getByRole("button", { name: "Gửi hồ sơ" }).click();
  await expect(page).toHaveURL(/result=submitted/);
  await expect(page.getByText("SKIPPED · SCHOOL_ADMIN")).toBeVisible();
  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await studentPage.goto("/login");
  await studentPage.locator("#email").fill(student.email);
  await studentPage.locator("#password").fill(password);
  await studentPage.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(studentPage).not.toHaveURL(/\/login(?:\?|$)/);
  await studentPage.goto(`/dashboard/workflows/submissions/${submissionId}`);
  await expect(studentPage.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
  await studentContext.close();
  await page.getByLabel("Bình luận mới").fill("Đã kiểm tra hồ sơ và nội dung đính kèm.");
  await page.getByRole("button", { name: "Gửi bình luận" }).click();
  await expect(page).toHaveURL(/result=comment/);
  await expect(page.getByText("Đã kiểm tra hồ sơ và nội dung đính kèm.")).toBeVisible();
  await page.locator('input[name="file"]').setInputFiles({
    name: "ho-so-quy-trinh-e2e.pdf",
    mimeType: "application/pdf",
    buffer: createMinimalPdf(),
  });
  await page.getByRole("button", { name: "Đính kèm tài liệu" }).click();
  await expect(page).toHaveURL(/result=attachment/);
  await expect(page.getByText("ho-so-quy-trinh-e2e.pdf")).toBeVisible();
  const previewHref = await page.getByRole("link", { name: "Xem PDF" }).getAttribute("href");
  const preview = await page.evaluate(async (href) => {
    const response = await fetch(href!);
    return {
      status: response.status,
      contentType: response.headers.get("content-type"),
      body: await response.text(),
    };
  }, previewHref);
  expect(preview.status).toBe(200);
  expect(preview.contentType).toContain("application/pdf");
  expect(preview.body.startsWith("%PDF-")).toBe(true);
  await page.getByLabel("Người duyệt mới").selectOption(reviewer.id);
  await page.getByLabel("Lý do chuyển").fill("Phân công người phụ trách chuyên môn.");
  await page.getByRole("button", { name: "Chuyển người duyệt" }).click();
  await expect(page).toHaveURL(/result=delegated/);
  await expect(page.getByText(`Đã giao: ${reviewer.displayName}`)).toBeVisible();
  await expect(page.getByRole("button", { name: "Duyệt", exact: true })).toHaveCount(0);
  const reviewerContext = await browser.newContext();
  const reviewerPage = await reviewerContext.newPage();
  await reviewerPage.goto("/login");
  await reviewerPage.locator("#email").fill(reviewer.email);
  await reviewerPage.locator("#password").fill(password);
  await reviewerPage.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(reviewerPage).not.toHaveURL(/\/login(?:\?|$)/);
  await reviewerPage.goto(`/dashboard/workflows/submissions/${submissionId}`);
  await reviewerPage.getByRole("button", { name: "Duyệt", exact: true }).click();
  await expect(reviewerPage).toHaveURL(/result=decision/);
  await reviewerContext.close();
  expect((await database.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM "WorkflowSubmissionStep" WHERE "submissionId" = $1 AND status = \'ACTIVE\'', [submissionId])).rows[0].count).toBe("2");
  await page.reload();
  await page.waitForLoadState("networkidle");
  await submitServerAction(page, "Duyệt", /result=decision/);
  expect((await database.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM "WorkflowSubmissionStep" WHERE "submissionId" = $1 AND status = \'ACTIVE\'', [submissionId])).rows[0].count).toBe("1");
  await page.reload();
  await page.waitForLoadState("networkidle");
  await submitServerAction(page, "Duyệt", /result=decision/);
  expect((await database.query<{ status: string }>('SELECT status::text FROM "WorkflowSubmission" WHERE id = $1', [submissionId])).rows[0].status).toBe("APPROVED");
  await page.reload();
  await expect(page.getByText("APPROVED", { exact: true })).toBeVisible();
  expect((await database.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM "WorkflowVersion" WHERE "templateId" = (SELECT "templateId" FROM "WorkflowSubmission" WHERE id = $1)', [submissionId])).rows[0].count).toBe("2");
});
