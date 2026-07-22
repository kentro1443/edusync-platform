import { expect, test } from "@playwright/test";

test.describe("Kiểm tra khói ứng dụng", () => {
  test("trang chủ hiển thị đúng tiêu đề và điều hướng", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LiênKếtHọc/);
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

  test("trang bảng điều khiển tải thành công", async ({ page }) => {
    const response = await page.goto("/dashboard");
    expect(response?.ok()).toBeTruthy();
  });

  test("các trang mô-đun tiếp thị tải thành công", async ({ page }) => {
    for (const path of [
      "/modules/mentoring",
      "/modules/resources",
      "/modules/appointments",
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