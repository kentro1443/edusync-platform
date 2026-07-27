import { randomUUID } from "node:crypto";

import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { argon2id, hash } from "argon2";
import "dotenv/config";
import { Client } from "pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://edusync:edusync_local@localhost:5432/edusync?schema=public";
const suffix = randomUUID().slice(0, 8);
const school = {
  id: randomUUID(),
  slug: `phase9-e2e-${suffix}`,
  name: `Trường E2E Phase 9 ${suffix}`,
};
const otherSchoolId = randomUUID();
const admin = {
  id: randomUUID(),
  membershipId: randomUUID(),
  email: `admin-${suffix}@phase9-e2e.local`,
  displayName: "E2E Quản trị báo cáo",
};
const student = {
  id: randomUUID(),
  membershipId: randomUUID(),
  email: `student-${suffix}@phase9-e2e.local`,
  displayName: "E2E Học sinh tìm kiếm",
};
const password = "Phase9-E2E-Password-2026!";
const resourceTitle = `Cẩm nang vận hành ${suffix}`;
const otherResourceTitle = `Cẩm nang vận hành ${suffix} bí mật trường khác`;
let database: Client;

async function login(page: Page, account: typeof admin | typeof student) {
  await page.goto("/login");
  await page.locator("#email").fill(account.email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe.configure({ mode: "serial" });

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
    'INSERT INTO "School" (id, slug, name, "shortName", "updatedAt") VALUES ($1, $2, $3, $4, NOW()), ($5, $6, $7, $8, NOW())',
    [
      school.id,
      school.slug,
      school.name,
      "E2E P9",
      otherSchoolId,
      `phase9-other-${suffix}`,
      `Trường khác ${suffix}`,
      "OTHER",
    ],
  );
  await database.query(
    'INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1, $2, $2, $3, $4, false, NOW()), ($5, $6, $6, $3, $7, false, NOW())',
    [
      admin.id,
      admin.email,
      passwordHash,
      admin.displayName,
      student.id,
      student.email,
      student.displayName,
    ],
  );
  await database.query(
    'INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1, $2, $3, \'ACTIVE\', NOW(), NOW()), ($4, $2, $5, \'ACTIVE\', NOW(), NOW())',
    [admin.membershipId, school.id, admin.id, student.membershipId, student.id],
  );
  await database.query(
    'INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1, $2, \'SCHOOL_ADMIN\'), ($3, $4, \'STUDENT\')',
    [randomUUID(), admin.membershipId, randomUUID(), student.membershipId],
  );
  await database.query(
    'INSERT INTO "Resource" (id, "schoolId", "createdByUserId", title, slug, summary, status, visibility, "publishedAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, \'PUBLISHED\', \'SCHOOL\', NOW(), NOW()), ($7, $8, $3, $9, $10, $11, \'PUBLISHED\', \'SCHOOL\', NOW(), NOW())',
    [
      randomUUID(),
      school.id,
      admin.id,
      resourceTitle,
      `cam-nang-${suffix}`,
      "Tài liệu tìm kiếm trong đúng tenant.",
      randomUUID(),
      otherSchoolId,
      otherResourceTitle,
      `cam-nang-khac-${suffix}`,
      "Không được rò sang trường E2E.",
    ],
  );
});

test.afterAll(async () => {
  await database.query('DELETE FROM "AuditEvent" WHERE "schoolId" IN ($1, $2)', [
    school.id,
    otherSchoolId,
  ]);
  await database.query('DELETE FROM "Resource" WHERE "schoolId" IN ($1, $2)', [
    school.id,
    otherSchoolId,
  ]);
  await database.query(
    'DELETE FROM "SchoolRoleAssignment" WHERE "membershipId" IN ($1, $2)',
    [admin.membershipId, student.membershipId],
  );
  await database.query('DELETE FROM "SchoolMembership" WHERE id IN ($1, $2)', [
    admin.membershipId,
    student.membershipId,
  ]);
  await database.query('DELETE FROM "Session" WHERE "userId" IN ($1, $2)', [
    admin.id,
    student.id,
  ]);
  await database.query('DELETE FROM "User" WHERE id IN ($1, $2)', [
    admin.id,
    student.id,
  ]);
  await database.query('DELETE FROM "School" WHERE id IN ($1, $2)', [
    school.id,
    otherSchoolId,
  ]);
  await database.end();
});

test("admin reports, permission-filtered search, audit export and health checks work", async ({
  browser,
  request,
}) => {
  let adminContext: BrowserContext | undefined;
  let studentContext: BrowserContext | undefined;
  try {
    const health = await request.get("/api/health");
    expect(health.status()).toBe(200);
    expect(await health.json()).toMatchObject({ status: "ok" });
    expect(health.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
    expect(health.headers()["x-frame-options"]).toBe("SAMEORIGIN");
    const readiness = await request.get("/api/readiness");
    expect(readiness.status()).toBe(200);
    expect(await readiness.json()).toMatchObject({
      status: "ready",
      checks: { database: "ok" },
    });

    adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await login(adminPage, admin);
    await expect(adminPage.getByRole("heading", { name: "Việc cần ưu tiên" })).toBeVisible();
    await expect(adminPage.locator('a[href="/dashboard/reports"]')).toHaveCount(1);
    await expect(adminPage.locator('a[href="/dashboard/audit"]')).toHaveCount(1);

    await adminPage.getByRole("button", { name: "Tìm kiếm trong ứng dụng" }).click();
    await adminPage.locator("#app-search").fill(`Cẩm nang vận hành ${suffix}`);
    await adminPage.getByRole("button", { name: "Tìm", exact: true }).click();
    await expect(adminPage).toHaveURL(/\/dashboard\/search\?q=/);
    await expect(adminPage.getByRole("link", { name: new RegExp(resourceTitle) })).toBeVisible();
    await expect(adminPage.getByText(otherResourceTitle)).toHaveCount(0);

    await adminPage.goto("/dashboard/reports");
    await expect(
      adminPage.getByRole("heading", { name: `Dữ liệu thật tại ${school.name}` }),
    ).toBeVisible();
    await expect(adminPage.getByRole("table")).toBeVisible();
    const reportExport = await adminPage.evaluate(async () => {
      const link = document.querySelector<HTMLAnchorElement>(
        'a[href^="/dashboard/reports/export"]',
      );
      const response = await fetch(link!.href, { credentials: "same-origin" });
      const bytes = [...new Uint8Array(await response.arrayBuffer()).slice(0, 3)];
      return {
        status: response.status,
        contentType: response.headers.get("content-type"),
        bytes,
      };
    });
    expect(reportExport.status).toBe(200);
    expect(reportExport.contentType).toContain("text/csv");
    expect(reportExport.bytes).toEqual([0xef, 0xbb, 0xbf]);

    await adminPage.goto("/dashboard/audit");
    await expect(adminPage.getByText("REPORT_EXPORTED")).toHaveCount(1);

    studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();
    await login(studentPage, student);
    await expect(studentPage.locator('a[href="/dashboard/reports"]')).toHaveCount(0);
    await studentPage.goto(`/dashboard/search?q=${encodeURIComponent(resourceTitle)}`);
    await expect(
      studentPage.getByRole("link", { name: new RegExp(resourceTitle) }),
    ).toBeVisible();
    await expect(studentPage.getByText(otherResourceTitle)).toHaveCount(0);
    await studentPage.goto("/dashboard/reports");
    await expect(studentPage).toHaveURL(/\/forbidden$/);
  } finally {
    await studentContext?.close();
    await adminContext?.close();
  }
});
