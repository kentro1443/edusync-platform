import { expect, test } from "@playwright/test";

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

  for (const width of [320, 375, 768, 1024, 1440]) {
    test(`không tràn ngang ở viewport ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
