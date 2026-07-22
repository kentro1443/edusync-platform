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