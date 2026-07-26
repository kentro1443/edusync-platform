import { expect, test } from "@playwright/test";
import "dotenv/config";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://edutech:edutech_local@localhost:5432/edutech?schema=public";
const demoPassword = "EduTech-Demo-2026!";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(demoPassword);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("Phase 6 seeded no-code workflows", () => {
  test("school catalog lists the seeded sample templates, all published", async ({ page }) => {
    await login(page, "admin.minhkhai@edutech.local");
    await page.goto("/dashboard/workflows");
    await expect(page.getByRole("link", { name: "Đơn xin tổ chức sự kiện CLB" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Đơn xin mượn cơ sở vật chất" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Đơn xin nghỉ học" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Đơn xin đổi môn học" })).toBeVisible();
    const publishedBadges = page.getByText("Đã xuất bản");
    await expect(publishedBadges).toHaveCount(4);
  });

  test("request-changes returns the submission to the owner, who edits and resubmits for review", async ({ page, browser }) => {
    const database = new Client({ connectionString: databaseUrl });
    await database.connect();
    try {
      await login(page, "student.minhkhai@edutech.local");
      await page.goto("/dashboard/workflows");
      await page
        .locator("li", { has: page.getByRole("link", { name: "Đơn xin nghỉ học" }) })
        .getByRole("button", { name: "Nộp hồ sơ" })
        .click();
      await expect(page).toHaveURL(/\/dashboard\/workflows\/submissions\/[0-9a-f-]+$/);
      const submissionUrl = page.url();

      await page.getByLabel("Ngày nghỉ").fill("2026-09-01");
      await page.getByLabel("Lý do").fill("Xin nghỉ để tham dự kỳ thi HSG cấp thành phố.");
      await page.getByRole("button", { name: "Gửi hồ sơ" }).click();
      await expect(page.getByText("IN_REVIEW", { exact: true })).toBeVisible();

      const reviewerContext = await browser.newContext();
      const reviewerPage = await reviewerContext.newPage();
      await login(reviewerPage, "teacher.minhkhai@edutech.local");
      await reviewerPage.goto(submissionUrl);
      await reviewerPage.locator("#reason").fill("Cần bổ sung xác nhận từ ban tổ chức kỳ thi.");
      await reviewerPage.getByRole("button", { name: "Yêu cầu chỉnh sửa" }).click();
      await expect(reviewerPage.getByText("CHANGES_REQUESTED", { exact: true })).toBeVisible();
      await reviewerContext.close();

      await page.goto(submissionUrl);
      await expect(page.getByText("CHANGES_REQUESTED", { exact: true })).toBeVisible();
      await page.getByLabel("Lý do").fill("Đã bổ sung xác nhận từ ban tổ chức kỳ thi HSG.");
      await page.getByRole("button", { name: "Gửi hồ sơ" }).click();
      await expect(page.getByText("IN_REVIEW", { exact: true })).toBeVisible();

      const historyRows = await database.query<{ action: string; to_status: string }>(
        'SELECT action, "toStatus" AS to_status FROM "WorkflowSubmissionHistory" WHERE "submissionId" = $1 ORDER BY "createdAt" ASC',
        [submissionUrl.split("/").pop()],
      );
      expect(historyRows.rows.map((row) => row.action)).toEqual(
        expect.arrayContaining(["SUBMIT", "REQUEST_CHANGES"]),
      );
    } finally {
      await database.end();
    }
  });
});
