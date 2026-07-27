import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";

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
  slug: `phase8-e2e-${suffix}`,
  name: `Trường E2E Phase 8 ${suffix}`,
  shortName: "E2E P8",
};
const sender = {
  id: randomUUID(),
  membershipId: randomUUID(),
  email: `sender-${suffix}@phase8-e2e.local`,
  displayName: "E2E Người gửi",
};
const recipient = {
  id: randomUUID(),
  membershipId: randomUUID(),
  email: `recipient-${suffix}@phase8-e2e.local`,
  displayName: "E2E Người nhận",
};
const outsider = {
  id: randomUUID(),
  membershipId: randomUUID(),
  email: `outsider-${suffix}@phase8-e2e.local`,
  displayName: "E2E Người ngoài cuộc",
};
const password = "Phase8-E2E-Password-2026!";
let database: Client;

test.describe.configure({ mode: "serial" });

async function login(
  page: Page,
  account: typeof sender | typeof recipient | typeof outsider,
) {
  await page.goto("/login");
  await page.locator("#email").fill(account.email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function closeContext(context: BrowserContext | undefined) {
  if (!context) return;
  try {
    await context.close();
  } catch {
    // Playwright may already close contexts after a timeout.
  }
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
  await database.query(
    'INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1, $2, $2, $3, $4, false, NOW()), ($5, $6, $6, $3, $7, false, NOW()), ($8, $9, $9, $3, $10, false, NOW())',
    [
      sender.id,
      sender.email,
      passwordHash,
      sender.displayName,
      recipient.id,
      recipient.email,
      recipient.displayName,
      outsider.id,
      outsider.email,
      outsider.displayName,
    ],
  );
  await database.query(
    'INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1, $2, $3, \'ACTIVE\', NOW(), NOW()), ($4, $2, $5, \'ACTIVE\', NOW(), NOW()), ($6, $2, $7, \'ACTIVE\', NOW(), NOW())',
    [
      sender.membershipId,
      school.id,
      sender.id,
      recipient.membershipId,
      recipient.id,
      outsider.membershipId,
      outsider.id,
    ],
  );
  await database.query(
    'INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1, $2, \'SCHOOL_ADMIN\'), ($3, $4, \'TEACHER_STAFF\'), ($5, $6, \'STUDENT\')',
    [
      randomUUID(),
      sender.membershipId,
      randomUUID(),
      recipient.membershipId,
      randomUUID(),
      outsider.membershipId,
    ],
  );
});

test.afterAll(async () => {
  const storedObjects = await database.query<{ storageKey: string }>(
    'SELECT "storageKey" FROM "StoredFile" WHERE "schoolId" = $1',
    [school.id],
  );
  await database.query('DELETE FROM "Notification" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "NotificationPreference" WHERE "schoolId" = $1', [
    school.id,
  ]);
  await database.query('DELETE FROM "ActivityFeedProjection" WHERE "schoolId" = $1', [
    school.id,
  ]);
  await database.query('DELETE FROM "AuditEvent" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "DomainOutboxEvent" WHERE "schoolId" = $1', [
    school.id,
  ]);
  await database.query('DELETE FROM "Message" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "Conversation" WHERE "schoolId" = $1', [school.id]);
  await database.query('DELETE FROM "FileLink" WHERE "schoolId" = $1', [school.id]);
  await database.query(
    'DELETE FROM "FileVersion" WHERE "fileId" IN (SELECT id FROM "StoredFile" WHERE "schoolId" = $1)',
    [school.id],
  );
  await database.query('DELETE FROM "StoredFile" WHERE "schoolId" = $1', [school.id]);
  await database.query(
    'DELETE FROM "SchoolRoleAssignment" WHERE "membershipId" IN ($1, $2, $3)',
    [sender.membershipId, recipient.membershipId, outsider.membershipId],
  );
  await database.query(
    'DELETE FROM "SchoolMembership" WHERE id IN ($1, $2, $3)',
    [sender.membershipId, recipient.membershipId, outsider.membershipId],
  );
  await database.query('DELETE FROM "Session" WHERE "userId" IN ($1, $2, $3)', [
    sender.id,
    recipient.id,
    outsider.id,
  ]);
  await database.query('DELETE FROM "User" WHERE id IN ($1, $2, $3)', [
    sender.id,
    recipient.id,
    outsider.id,
  ]);
  await database.query('DELETE FROM "School" WHERE id = $1', [school.id]);
  await database.end();
  const storageRoot = path.resolve(process.env.FILE_STORAGE_ROOT ?? "./storage");
  await Promise.all(
    storedObjects.rows.map((object) =>
      rm(path.resolve(storageRoot, object.storageKey), { force: true }),
    ),
  );
});

test("conversation stays participant-scoped and delivers configurable notifications", async ({
  browser,
}, testInfo) => {
  testInfo.setTimeout(60_000);
  let senderContext: BrowserContext | undefined;
  let recipientContext: BrowserContext | undefined;
  let outsiderContext: BrowserContext | undefined;
  try {
    senderContext = await browser.newContext();
    const senderPage = await senderContext.newPage();
    await login(senderPage, sender);
    await senderPage.goto("/dashboard/messages");
    await expect(
      senderPage.getByRole("heading", {
        name: "Trao đổi trong đúng ngữ cảnh trường",
      }),
    ).toBeVisible();
    await senderPage.getByLabel("Tên nhóm").fill("Điều phối hội thảo E2E");
    await senderPage.getByLabel(recipient.displayName).check();
    await senderPage.getByRole("button", { name: "Tạo cuộc trò chuyện" }).click();
    await expect(senderPage).toHaveURL(/result=created/);

    const conversation = (
      await database.query<{ id: string }>(
        'SELECT id FROM "Conversation" WHERE "schoolId" = $1 AND title = $2',
        [school.id, "Điều phối hội thảo E2E"],
      )
    ).rows[0];
    expect(conversation?.id).toBeTruthy();

    await senderPage.goto(`/dashboard/messages/${conversation.id}`);
    await senderPage
      .getByRole("textbox", { name: "Tin nhắn (bắt buộc)" })
      .fill("Xin chào, vui lòng kiểm tra kế hoạch.");
    await senderPage.getByText("Nhắc thành viên").click();
    await senderPage.getByLabel(recipient.displayName).check();
    await senderPage.locator('input[type="file"]').setInputFiles({
      name: "Kế hoạch tiếng Việt.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% E2E attachment\n"),
    });
    await senderPage.getByRole("button", { name: "Gửi tin nhắn" }).click();
    await expect(senderPage).toHaveURL(/result=sent/);
    await expect(senderPage.getByText("Xin chào, vui lòng kiểm tra kế hoạch.")).toBeVisible();
    const attachmentHref = await senderPage
      .getByRole("link", { name: "Kế hoạch tiếng Việt.pdf" })
      .getAttribute("href");
    expect(attachmentHref).toBeTruthy();

    recipientContext = await browser.newContext();
    const recipientPage = await recipientContext.newPage();
    await login(recipientPage, recipient);
    await recipientPage.goto("/dashboard/notifications");
    await expect(
      recipientPage.getByRole("heading", {
        name: `${sender.displayName} đã nhắc đến bạn`,
      }),
    ).toBeVisible();
    await expect(
      recipientPage.locator("#main-content").getByText("1 chưa đọc", { exact: true }),
    ).toBeVisible();
    await recipientPage.getByRole("button", { name: "Mở" }).click();
    await expect(recipientPage).toHaveURL(
      new RegExp(`/dashboard/messages/${conversation.id}$`),
    );
    await expect(
      recipientPage
        .getByLabel("Lịch sử tin nhắn")
        .getByText("Xin chào, vui lòng kiểm tra kế hoạch."),
    ).toBeVisible();
    await expect(
      recipientPage.getByRole("link", { name: "Kế hoạch tiếng Việt.pdf" }),
    ).toBeVisible();
    const preview = await recipientPage.evaluate(async (href) => {
      const response = await fetch(href, { credentials: "same-origin" });
      return {
        status: response.status,
        contentType: response.headers.get("content-type"),
        bytes: (await response.arrayBuffer()).byteLength,
      };
    }, attachmentHref!);
    expect(preview).toMatchObject({
      status: 200,
      contentType: "application/pdf",
    });
    expect(preview.bytes).toBeGreaterThan(0);
    await recipientPage.getByRole("button", { name: "Đánh dấu đã đọc" }).click();
    await expect(recipientPage).toHaveURL(/result=read/);
    await expect(recipientPage.getByText(/Cập nhật trực tiếp/)).toBeVisible();

    await senderPage.goto(`/dashboard/messages/${conversation.id}`);
    await senderPage
      .getByRole("textbox", { name: "Tin nhắn (bắt buộc)" })
      .fill("Cập nhật trực tiếp qua kênh có xác thực.");
    await senderPage.getByRole("button", { name: "Gửi tin nhắn" }).click();
    await expect(senderPage).toHaveURL(/result=sent/);
    await expect(
      recipientPage
        .getByLabel("Lịch sử tin nhắn")
        .getByText("Cập nhật trực tiếp qua kênh có xác thực."),
    ).toBeVisible({ timeout: 7_000 });

    outsiderContext = await browser.newContext();
    const outsiderPage = await outsiderContext.newPage();
    await login(outsiderPage, outsider);
    await outsiderPage.goto(`/dashboard/messages/${conversation.id}`);
    await expect(
      outsiderPage.getByRole("heading", { name: "Không tìm thấy trang" }),
    ).toBeVisible();
    await expect(
      outsiderPage.getByText("Xin chào, vui lòng kiểm tra kế hoạch."),
    ).toHaveCount(0);
    const deniedAttachment = await outsiderPage.evaluate(async (href) => {
      const response = await fetch(href, { credentials: "same-origin" });
      return response.status;
    }, attachmentHref!);
    expect(deniedAttachment).toBe(404);

    await recipientPage.goto("/dashboard/notifications");
    await recipientPage.getByLabel("Thông báo trong ứng dụng").uncheck();
    await recipientPage.getByRole("button", { name: "Lưu tùy chọn" }).click();
    await expect(recipientPage).toHaveURL(/result=preference/);

    await senderPage.goto(`/dashboard/messages/${conversation.id}`);
    await senderPage
      .getByRole("textbox", { name: "Tin nhắn (bắt buộc)" })
      .fill("Tin sau khi tắt preference không tạo thông báo.");
    await senderPage.getByRole("button", { name: "Gửi tin nhắn" }).click();
    await expect(senderPage).toHaveURL(/result=sent/);
    const notificationCount = await database.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM "Notification" WHERE "schoolId" = $1 AND "userId" = $2',
      [school.id, recipient.id],
    );
    expect(notificationCount.rows[0].count).toBe("2");

    await senderPage.route("**/dashboard/messages/*/stream", (route) => route.abort());
    await senderPage.setViewportSize({ width: 375, height: 812 });
    await senderPage.goto(`/dashboard/messages/${conversation.id}`);
    await expect(senderPage.getByText(/chế độ dự phòng 8 giây/)).toBeVisible();
    await senderPage
      .getByRole("textbox", { name: "Tin nhắn (bắt buộc)" })
      .fill("Tin vẫn được lưu khi kênh trực tiếp gián đoạn.");
    await senderPage.getByRole("button", { name: "Gửi tin nhắn" }).click();
    await expect(
      senderPage
        .getByLabel("Lịch sử tin nhắn")
        .getByText("Tin vẫn được lưu khi kênh trực tiếp gián đoạn."),
    ).toBeVisible();
    const dimensions = await senderPage.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  } finally {
    await closeContext(outsiderContext);
    await closeContext(recipientContext);
    await closeContext(senderContext);
  }
});
