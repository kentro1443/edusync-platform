import { expect, test } from "@playwright/test";

test.describe("Kiểm tra khói ứng dụng", () => {
  test("trang chủ hiển thị đúng tiêu đề và điều hướng", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/EduTech/);
    await expect(
      page.getByRole("link", { name: "Chuyển đến nội dung chính" }),
    ).toBeAttached();
  });

  test("trang đăng nhập tải thành công", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.ok()).toBeTruthy();
  });

  test("tài khoản mới được chuyển đến trang đổi mật khẩu", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("student.minhkhai@edutech.local");
    await page.locator("#password").fill("EduTech-Demo-2026!");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await expect(page).toHaveURL(/\/doi-mat-khau$/);
    await expect(
      page.getByRole("heading", { name: "Thiết lập mật khẩu mới" }),
    ).toBeVisible();
    await expect(page.locator("#currentPassword")).toBeVisible();
    await expect(page.locator("#newPassword")).toBeVisible();
    await expect(page.locator("#confirmPassword")).toBeVisible();
  });

  test("credential demo của quản trị nền tảng đăng nhập được", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("platform@edutech.local");
    await page.locator("#password").fill("EduTech-Demo-2026!");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await expect(page).toHaveURL(/\/doi-mat-khau$/);
    await expect(
      page.getByRole("heading", { name: "Thiết lập mật khẩu mới" }),
    ).toBeVisible();
  });

  test("hero dùng font và line-height an toàn cho dấu tiếng Việt", async ({ page }) => {
    await page.goto("/");
    const typography = await page
      .getByRole("heading", {
        level: 1,
        name: "Mọi kết nối trong trường, vận hành trên một nền tảng đáng tin cậy.",
      })
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          fontFamily: style.fontFamily,
          lineHeight: Number.parseFloat(style.lineHeight),
          fontSize: Number.parseFloat(style.fontSize),
        };
      });

    expect(typography.fontFamily).not.toContain("Avenir Next");
    expect(typography.fontFamily).toContain("system-ui");
    expect(typography.lineHeight / typography.fontSize).toBeGreaterThanOrEqual(1.1);
  });

  test("trang bảng điều khiển tải thành công", async ({ page }) => {
    const response = await page.goto("/dashboard");
    expect(response?.ok()).toBeTruthy();
  });

  test("các trang mô-đun tiếp thị tải thành công", async ({ page }) => {
    for (const path of [
      "/modules/mentoring",
      "/modules/resources",
      "/modules/appointments",
      "/modules/workflows",
      "/modules/clubs-events",
      "/pricing",
      "/case-studies",
      "/security",
      "/help",
      "/demo",
    ]) {
      const response = await page.goto(path);
      expect(response?.ok(), `${path} phải trả về trạng thái OK`).toBeTruthy();
    }
  });
});
