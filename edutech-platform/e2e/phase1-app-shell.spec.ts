import { expect, test, type Page } from "@playwright/test";
import { argon2id, hash } from "argon2";
import { Client } from "pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://edutech:edutech_local@localhost:5432/edutech?schema=public";
let database: Client;
const email = "admin.minhkhai@edutech.local";
const password = "EduTech-Shell-Test-2026!";
const seededPassword = "EduTech-Demo-2026!";

test.describe.configure({ mode: "serial" });

test.beforeEach(async () => {
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
    'UPDATE "User" SET "passwordHash" = $1, "mustChangePassword" = false WHERE "normalizedEmail" = $2',
    [passwordHash, email],
  );
});

test.afterEach(async () => {
  const passwordHash = await hash(seededPassword, {
    type: argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    hashLength: 32,
  });
  await database.query(
    'DELETE FROM "Session" WHERE "userId" = (SELECT id FROM "User" WHERE "normalizedEmail" = $1)',
    [email],
  );
  await database.query(
    'UPDATE "User" SET "passwordHash" = $1, "mustChangePassword" = true WHERE "normalizedEmail" = $2',
    [passwordHash, email],
  );
  await database.end();
});

async function login(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("App shell Phase 1", () => {
  test("desktop shell exposes real navigation, breadcrumb and keyboard search", async ({ page }) => {
    await login(page);

    await expect(page.getByRole("heading", { name: "Xin chào, Nguyễn Minh Anh" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Đường dẫn trang" })).toBeVisible();
    await expect(page.getByText("Sắp có")).toHaveCount(2);
    await expect(page.locator('a[href="/dashboard/mentoring"]')).toHaveCount(1);

    const search = page.getByRole("button", { name: "Tìm kiếm trong ứng dụng" });
    await search.click();
    await expect(page.getByRole("dialog", { name: "Tìm kiếm trong EduTech" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Tìm kiếm trong EduTech" })).toHaveCount(0);
    await expect(search).toBeFocused();

    const collapse = page.getByRole("button", { name: "Thu gọn thanh bên" });
    await collapse.click();
    await expect(page.getByRole("button", { name: "Mở rộng thanh bên" })).toHaveAttribute("aria-expanded", "false");
  });

  test("mobile drawer closes with Escape and restores focus", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    const trigger = page.getByRole("button", { name: "Mở menu điều hướng" });
    await trigger.click();
    await expect(page.getByRole("complementary", { name: "Điều hướng di động" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("complementary", { name: "Điều hướng di động" })).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("dashboard has no unexpected horizontal overflow at required breakpoints", async ({ page }) => {
    await login(page);
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(dimensions.scrollWidth, `overflow at ${width}px`).toBeLessThanOrEqual(dimensions.clientWidth);
    }
  });

  test("reduced motion disables non-essential transitions", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await login(page);
    const duration = await page.getByRole("button", { name: "Thu gọn thanh bên" }).evaluate(
      (element) => getComputedStyle(element).transitionDuration,
    );
    expect(["0.01ms", "1e-05s"]).toContain(duration);
  });
});
