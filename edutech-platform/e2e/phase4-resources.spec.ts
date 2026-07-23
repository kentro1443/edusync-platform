import { randomUUID } from "node:crypto";
import path from "node:path";
import { rm } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";
import { argon2id, hash } from "argon2";
import "dotenv/config";
import { Client } from "pg";


const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://edutech:edutech_local@localhost:5432/edutech?schema=public";
const suffix = randomUUID().slice(0, 8);
const school = { id: randomUUID(), slug: `phase4-e2e-${suffix}`, name: `Trường E2E Tài nguyên ${suffix}`, shortName: "E2E P4" };
const author = { id: randomUUID(), membershipId: randomUUID(), email: `author-${suffix}@phase4-e2e.local`, displayName: "E2E Tác giả" };
const reviewer = { id: randomUUID(), membershipId: randomUUID(), email: `reviewer-${suffix}@phase4-e2e.local`, displayName: "E2E Duyệt" };
const reader = { id: randomUUID(), membershipId: randomUUID(), email: `reader-${suffix}@phase4-e2e.local`, displayName: "E2E Người đọc" };
const password = "Phase4-E2E-Password-2026!";
const startedAt = new Date();
let database: Client;
let resourceId = "";

function createMinimalPdf(): Buffer {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    "<< /Length 45 >>\nstream\nBT /F1 24 Tf 72 720 Td (EduTech PDF) Tj ET\nendstream",
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
  const passwordHash = await hash(password, { type: argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1, hashLength: 32 });
  await database.query('INSERT INTO "School" (id, slug, name, "shortName", "updatedAt") VALUES ($1, $2, $3, $4, NOW())', [school.id, school.slug, school.name, school.shortName]);
  for (const user of [author, reviewer, reader]) {
    await database.query('INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1, $2, $2, $3, $4, false, NOW())', [user.id, user.email, passwordHash, user.displayName]);
  }
  for (const [user, role] of [[author, "TEACHER_STAFF"], [reviewer, "SCHOOL_ADMIN"], [reader, "STUDENT"]] as const) {
    await database.query('INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1, $2, $3, \'ACTIVE\', NOW(), NOW())', [user.membershipId, school.id, user.id]);
    await database.query('INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1, $2, $3)', [randomUUID(), user.membershipId, role]);
  }
});

test.afterAll(async () => {
  const files = await database.query<{ storageKey: string }>('SELECT "storageKey" FROM "StoredFile" WHERE "schoolId" = $1', [school.id]);
  await Promise.all(files.rows.map((file) => removeStoredKey(file.storageKey).catch(() => undefined)));
  await database.query('DELETE FROM "AuditEvent" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "DomainOutboxEvent" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "ResourceAnalyticsEvent" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "ResourceAnalyticsCounter" WHERE "resourceId" IN (SELECT id FROM "Resource" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "ResourceCollectionItem" WHERE "collectionId" IN (SELECT id FROM "ResourceCollection" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "ResourceCollection" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "ResourceBookmark" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "ResourceComment" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "ResourceReport" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "FileLink" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "FileVersion" WHERE "fileId" IN (SELECT id FROM "StoredFile" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "StoredFile" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "ResourceTransition" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "ResourceVersion" WHERE "resourceId" IN (SELECT id FROM "Resource" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "Resource" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "SchoolRoleAssignment" WHERE "membershipId" IN (SELECT id FROM "SchoolMembership" WHERE "schoolId" = $1)', [school.id]);
  await database.query('DELETE FROM "SchoolMembership" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "Session" WHERE "userId" = ANY($1::uuid[])', [[author.id, reviewer.id, reader.id]]);
  await database.query('DELETE FROM "User" WHERE id = ANY($1::uuid[])', [[author.id, reviewer.id, reader.id]]);
  await database.query('DELETE FROM "School" WHERE id = $1', [school.id]);
  await database.query('DELETE FROM "AuthRateLimit" WHERE "updatedAt" >= $1', [startedAt]);
  await database.end();
});

test("tác giả gửi duyệt, reviewer xuất bản, reader đọc tài nguyên", async ({ page }) => {
  await login(page, author.email);
  await page.goto("/dashboard/resources/new");
  await page.getByLabel("Tiêu đề").fill("Tài nguyên E2E Phase 4");
  await page.getByLabel("Mô tả ngắn").fill("Kiểm tra vòng đời tài nguyên.");
  await page.getByLabel("Nội dung").fill("Nội dung tài nguyên đã xuất bản.");
  await page.getByRole("button", { name: "Tạo bản nháp" }).click();
  await expect(page).toHaveURL(/\/dashboard\/resources\/.+\?result=created$/);
  resourceId = page.url().match(/resources\/([^?]+)/)?.[1] ?? "";
  await page.getByRole("button", { name: "Gửi duyệt" }).click();
  await expect.poll(async () => (await database.query<{ status: string }>('SELECT status FROM "Resource" WHERE id = $1', [resourceId])).rows[0]?.status).toBe("PENDING_REVIEW");
  await logout(page);

  await login(page, reviewer.email);
  await page.goto("/dashboard/resources/moderation");
  await page.getByRole("link", { name: "Tài nguyên E2E Phase 4" }).click();
  await page.getByRole("button", { name: "Duyệt và xuất bản" }).click();
  await expect.poll(async () => (await database.query<{ status: string }>('SELECT status FROM "Resource" WHERE id = $1', [resourceId])).rows[0]?.status).toBe("PUBLISHED");
  await logout(page);

  await login(page, reader.email);
  await page.goto(`/dashboard/resources/${resourceId}`);
  await expect(page.getByRole("heading", { name: "Tài nguyên E2E Phase 4" })).toBeVisible();
  await expect(page.getByText("Nội dung tài nguyên đã xuất bản.")).toBeVisible();
});

test("invalid upload bị chặn, version mới và rollback không mutate version cũ", async ({ page }) => {
  await login(page, author.email);
  await page.goto(`/dashboard/resources/${resourceId}`);
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({ name: "malware.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("not allowed") });
  await page.getByRole("button", { name: "Lưu phiên bản mới" }).click();
  await expect(page).toHaveURL(/error=invalid/);
  await page.reload();
  await fileInput.setInputFiles({ name: "guide.pdf", mimeType: "application/pdf", buffer: createMinimalPdf() });
  await page.getByLabel("Tiêu đề phiên bản").fill("Tài nguyên E2E Phase 4 — bản hai");
  await page.getByRole("button", { name: "Lưu phiên bản mới" }).click();
  await expect.poll(async () => (await database.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM "ResourceVersion" WHERE "resourceId" = $1', [resourceId])).rows[0]?.count).toBe("2");
  await page.reload();
  const secondVersion = await database.query<{ id: string }>(
    'SELECT id FROM "ResourceVersion" WHERE "resourceId" = $1 ORDER BY "versionNumber" DESC LIMIT 1',
    [resourceId],
  );
  const secondVersionId = secondVersion.rows[0]?.id ?? "";
  const preview = page.getByTitle("Xem trước PDF guide.pdf");
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute(
    "src",
    `/dashboard/resources/${resourceId}/preview?versionId=${secondVersionId}`,
  );
  const previewResponse = await page.evaluate(async (url) => {
    const response = await fetch(url);
    return {
      status: response.status,
      contentType: response.headers.get("content-type"),
      contentDisposition: response.headers.get("content-disposition"),
    };
  }, `/dashboard/resources/${resourceId}/preview?versionId=${secondVersionId}`);
  expect(previewResponse.status).toBe(200);
  expect(previewResponse.contentType).toContain("application/pdf");
  expect(previewResponse.contentDisposition).toContain("inline");
  await expect.poll(async () => (
    await database.query<{ previews: number }>(
      'SELECT previews FROM "ResourceAnalyticsCounter" WHERE "resourceId" = $1',
      [resourceId],
    )
  ).rows[0]?.previews).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Khôi phục thành phiên bản mới" }).first().click();
  await expect.poll(async () => (await database.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM "ResourceVersion" WHERE "resourceId" = $1', [resourceId])).rows[0]?.count).toBe("3");
});
