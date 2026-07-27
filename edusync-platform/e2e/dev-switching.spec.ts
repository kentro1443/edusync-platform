import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const password = "EduSync-Demo-2026!";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
}

test.describe("Dev account switching", () => {
  test("switches schools and roles without another login", async ({ page }) => {
    await login(page, "dev@edusync.local");
    await expect(page).toHaveURL(/\/dev\/switch$/);
    await expect(
      page.getByRole("heading", { name: "Một lần đăng nhập. Mọi góc nhìn." }),
    ).toBeVisible();
    const pickerAudit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(
      pickerAudit.violations.filter(
        ({ impact }) => impact === "serious" || impact === "critical",
      ),
      JSON.stringify(pickerAudit.violations, null, 2),
    ).toEqual([]);

    const search = page.getByRole("searchbox", {
      name: "Tìm tài khoản theo tên, email hoặc vai trò",
    });
    await search.fill("student.minhkhai");
    const student = page.locator("form", {
      hasText: "student.minhkhai@edusync.local",
    });
    await expect(student).toContainText("Học sinh");
    await student.getByRole("button", { name: /Dùng tài khoản/ }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Dev mode", { exact: true })).toBeVisible();
    await expect(page.getByText("Phạm Gia Huy", { exact: true }).first()).toBeVisible();
    await expect(
      page.locator('a[href="/dashboard/admin/members"]'),
    ).toHaveCount(0);

    await page.getByRole("link", { name: "Đổi tài khoản" }).click();
    await page.getByRole("button", { name: /Nguyễn Du/ }).click();
    await search.fill("teacher.nguyendu");
    const teacher = page.locator("form", {
      hasText: "teacher.nguyendu@edusync.local",
    });
    await teacher.getByRole("button", { name: /Dùng tài khoản/ }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Đỗ Mai Phương", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText("Trường Trung học Nguyễn Du", { exact: true }).first(),
    ).toBeVisible();

    await page.getByRole("button", { name: "Thoát chế độ" }).click();
    await expect(page).toHaveURL(/\/dev\/switch\?exited=1$/);
    await expect(
      page.getByRole("status").filter({ hasText: "Đã trở về tài khoản phát triển" }),
    ).toBeVisible();
  });

  test("stays polished and usable on narrow screens", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await login(page, "dev@edusync.local");

    await expect(page.getByLabel("Trường đang chọn")).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });

  test("hides switcher from normal accounts", async ({ page }) => {
    await login(page, "admin.minhkhai@edusync.local");
    await expect(page).toHaveURL(/\/dashboard$/);
    const response = await page.goto("/dev/switch");
    expect(response?.status()).toBe(404);
  });
});
