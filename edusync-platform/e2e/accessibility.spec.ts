import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const demoPassword = "EduSync-Demo-2026!";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(demoPassword);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/**
 * Automated WCAG 2.2 A/AA scan across representative public and authenticated
 * pages. Fails on any serious/critical violation; moderate/minor issues are
 * reported but do not fail the run (they require manual triage).
 */
test.describe("Accessibility automated audit", () => {
  test("marketing homepage has no serious accessibility violations", async ({
    page,
  }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test("login page has no serious accessibility violations", async ({
    page,
  }) => {
    await page.goto("/login");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test("dashboard overview has no serious accessibility violations", async ({
    page,
  }) => {
    await login(page, "admin.minhkhai@edusync.local");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test("peer-mentor marketplace has no serious accessibility violations", async ({
    page,
  }) => {
    await login(page, "student.minhkhai@edusync.local");
    await page.goto("/dashboard/mentoring/marketplace?tab=requests");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test("peer-mentor marketplace explains read-only access", async ({
    page,
  }) => {
    await login(page, "admin.minhkhai@edusync.local");
    await page.goto("/dashboard/mentoring/marketplace");
    await expect(
      page.getByRole("heading", { name: "Không gian quan sát" }),
    ).toBeVisible();
    await expect(
      page.getByText("Vai trò hiện tại không tham gia giao dịch"),
    ).toBeVisible();
  });

  test("in-app manual covers roles and core workflows", async ({ page }) => {
    await login(page, "student.minhkhai@edusync.local");
    await page.goto("/dashboard/manual");
    await expect(
      page.getByRole("heading", { name: "Hướng dẫn sử dụng EduSync" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Vai trò và phạm vi" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Cố vấn & chợ cố vấn" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Kho tài liệu" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Lịch, đặt chỗ & lịch hẹn" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Quy trình số" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "CLB & sự kiện" }),
    ).toBeVisible();
  });

  test("workflow builder has no serious accessibility violations", async ({
    page,
  }) => {
    await login(page, "admin.minhkhai@edusync.local");
    await page.goto("/dashboard/workflows");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});
