import { expect, test } from "@playwright/test";
import { Client } from "pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://edutech:edutech_local@localhost:5432/edutech?schema=public";

test.describe("Phase 1 — thương hiệu và marketing shell", () => {
  test("chuẩn hóa thương hiệu EduTech và cung cấp đầy đủ điều hướng", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/EduTech/);
    await expect(page.getByRole("banner").getByRole("link", { name: "EduTech - Trang chủ" })).toBeVisible();
    await expect(page.getByText("LiênKếtHọc")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Quy trình số", exact: true })).toHaveCount(1);
  });

  test("menu di động quản lý focus và đóng bằng Escape", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const trigger = page.getByRole("button", { name: "Mở menu điều hướng" });
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Điều hướng di động" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Điều hướng di động" })).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("trang quy trình, sitemap và robots sẵn sàng", async ({ page }) => {
    await expect((await page.goto("/modules/workflows"))?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Quy trình");
    await expect((await page.goto("/sitemap.xml"))?.ok()).toBeTruthy();
    await expect((await page.goto("/robots.txt"))?.ok()).toBeTruthy();
  });

  test("form tư vấn xác thực dữ liệu và lưu yêu cầu thật", async ({ page }) => {
    const email = `phase1-${Date.now()}@truong.edu.vn`;
    const database = new Client({ connectionString: databaseUrl });
    await database.connect();
    try {
      await page.goto("/demo");

      await page.getByRole("button", { name: "Gửi yêu cầu tư vấn" }).click();
      await expect(page.getByText("Vui lòng nhập đầy đủ họ tên.")).toBeVisible();
      await expect(page.getByText("Email công vụ chưa đúng định dạng.")).toBeVisible();

      await page.locator("#fullName").fill("Nguyễn Hoài An");
      await page.locator("#role").selectOption("principal");
      await page.locator("#school").fill("THPT Kiểm thử Phase 1");
      await page.locator("#email").fill(email);
      await page.locator("#studentCount").fill("1200");
      await page.locator("#modules").selectOption("all");
      await page.getByRole("button", { name: "Gửi yêu cầu tư vấn" }).click();

      await expect(page.getByRole("heading", { name: "Yêu cầu đã được ghi nhận" })).toBeVisible();
      const persisted = await database.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM "DemoRequest" WHERE email = $1',
        [email],
      );
      expect(persisted.rows[0]?.count).toBe("1");
    } finally {
      await database.query('DELETE FROM "DemoRequest" WHERE email = $1', [email]);
      await database.end();
    }
  });

  for (const width of [320, 375, 768, 1024, 1440]) {
    test(`không tràn ngang ở viewport ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
