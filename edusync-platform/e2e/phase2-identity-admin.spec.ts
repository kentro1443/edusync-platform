import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";
import { argon2id, hash } from "argon2";
import { Client } from "pg";

import { submitServerAction } from "./helpers/server-actions";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://edusync:edusync_local@localhost:5432/edusync?schema=public";
const suffix = randomUUID().slice(0, 8);
const schoolA = {
  id: randomUUID(),
  slug: `phase2-e2e-a-${suffix}`,
  name: `Trường E2E An Bình ${suffix}`,
  shortName: "E2E A",
};
const schoolB = {
  id: randomUUID(),
  slug: `phase2-e2e-b-${suffix}`,
  name: `Trường E2E Bình Minh ${suffix}`,
  shortName: "E2E B",
};
const password = "Phase2-E2E-Initial-2026!";
const changedPassword = "Phase2-E2E-Changed-2026!";
const resetPassword = "Phase2-E2E-Reset-2026!";
const invitedPassword = "Phase2-E2E-Invited-2026!";
const invitedEmail = `invited-${suffix}@phase2-e2e.local`;
const provisionedSlug = `phase2-provisioned-${suffix}`;
const provisionedAdminEmail = `provisioned-${suffix}@phase2-e2e.local`;
const startedAt = new Date();

const schoolRoles = [
  ["SCHOOL_ADMIN", "Quản trị trường"],
  ["TEACHER_STAFF", "Giáo viên & nhân viên"],
  ["MENTOR_COUNSELOR", "Cố vấn học tập"],
  ["STUDENT", "Học sinh"],
  ["PARENT_GUARDIAN", "Phụ huynh"],
  ["CLUB_LEADER", "Ban chủ nhiệm câu lạc bộ"],
  ["APPROVER_REVIEWER", "Người phê duyệt"],
] as const;

const accounts = schoolRoles.map(([role, label]) => ({
  id: randomUUID(),
  membershipId: randomUUID(),
  email: `${role.toLocaleLowerCase("en-US")}-${suffix}@phase2-e2e.local`,
  displayName: `E2E ${label}`,
  role,
  label,
}));
const platformAccount = {
  id: randomUUID(),
  email: `platform-${suffix}@phase2-e2e.local`,
  displayName: "E2E Quản trị nền tảng",
};
const forcedAccount = {
  id: randomUUID(),
  membershipId: randomUUID(),
  email: `forced-${suffix}@phase2-e2e.local`,
  displayName: "E2E Đổi mật khẩu",
};
const resetAccount = {
  id: randomUUID(),
  membershipId: randomUUID(),
  email: `reset-${suffix}@phase2-e2e.local`,
  displayName: "E2E Khôi phục mật khẩu",
};

let database: Client;

test.describe.configure({ mode: "serial" });

async function login(page: Page, email: string, accountPassword = password) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(accountPassword);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}

async function selectSchool(page: Page, schoolName: string) {
  const schoolForm = page.locator("form").filter({ hasText: schoolName });
  await expect(schoolForm).toHaveCount(1);
  await schoolForm.getByRole("button", { name: "Tiếp tục với trường này" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function logout(page: Page) {
  await page
    .locator("summary")
    .filter({ hasText: "Mở menu tài khoản" })
    .click();
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/login$/);
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

  for (const school of [schoolA, schoolB]) {
    await database.query(
      'INSERT INTO "School" (id, slug, name, "shortName", "updatedAt") VALUES ($1, $2, $3, $4, NOW())',
      [school.id, school.slug, school.name, school.shortName],
    );
  }

  const users = [
    ...accounts.map((account) => ({ ...account, mustChangePassword: false })),
    { ...platformAccount, mustChangePassword: false },
    { ...forcedAccount, mustChangePassword: true },
    { ...resetAccount, mustChangePassword: false },
  ];
  for (const user of users) {
    await database.query(
      'INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1, $2, $2, $3, $4, $5, NOW())',
      [user.id, user.email, passwordHash, user.displayName, user.mustChangePassword],
    );
  }

  for (const account of accounts) {
    await database.query(
      'INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1, $2, $3, \'ACTIVE\', NOW(), NOW())',
      [account.membershipId, schoolA.id, account.id],
    );
    await database.query(
      'INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1, $2, $3)',
      [randomUUID(), account.membershipId, account.role],
    );
  }

  const schoolAdmin = accounts[0];
  const secondAdminMembershipId = randomUUID();
  await database.query(
    'INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1, $2, $3, \'ACTIVE\', NOW(), NOW())',
    [secondAdminMembershipId, schoolB.id, schoolAdmin.id],
  );
  await database.query(
    'INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1, $2, \'SCHOOL_ADMIN\')',
    [randomUUID(), secondAdminMembershipId],
  );

  for (const account of [forcedAccount, resetAccount]) {
    await database.query(
      'INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1, $2, $3, \'ACTIVE\', NOW(), NOW())',
      [account.membershipId, schoolA.id, account.id],
    );
    await database.query(
      'INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1, $2, \'STUDENT\')',
      [randomUUID(), account.membershipId],
    );
  }
  await database.query(
    'INSERT INTO "PlatformRoleAssignment" (id, "userId", role) VALUES ($1, $2, \'PLATFORM_SUPER_ADMIN\')',
    [randomUUID(), platformAccount.id],
  );
});

test.afterAll(async () => {
  const schoolRows = await database.query<{ id: string }>(
    'SELECT id FROM "School" WHERE id IN ($1, $2) OR slug = $3',
    [schoolA.id, schoolB.id, provisionedSlug],
  );
  const schoolIds = schoolRows.rows.map(({ id }) => id);
  const userRows = await database.query<{ id: string }>(
    'SELECT id FROM "User" WHERE "normalizedEmail" LIKE $1',
    [`%-${suffix}@phase2-e2e.local`],
  );
  const userIds = userRows.rows.map(({ id }) => id);

  await database.query('DELETE FROM "AuditEvent" WHERE "schoolId" = ANY($1::uuid[]) OR "actorUserId" = ANY($2::uuid[])', [schoolIds, userIds]);
  await database.query('DELETE FROM "EmailOutbox" WHERE "schoolId" = ANY($1::uuid[]) OR "recipientUserId" = ANY($2::uuid[]) OR "toAddress" LIKE $3', [schoolIds, userIds, `%-${suffix}@phase2-e2e.local`]);
  await database.query('DELETE FROM "PasswordResetToken" WHERE "userId" = ANY($1::uuid[])', [userIds]);
  await database.query('DELETE FROM "Session" WHERE "userId" = ANY($1::uuid[])', [userIds]);
  await database.query('DELETE FROM "ParentStudentLink" WHERE "schoolId" = ANY($1::uuid[])', [schoolIds]);
  await database.query('DELETE FROM "Invitation" WHERE "schoolId" = ANY($1::uuid[])', [schoolIds]);
  await database.query('DELETE FROM "SchoolRoleAssignment" WHERE "membershipId" IN (SELECT id FROM "SchoolMembership" WHERE "schoolId" = ANY($1::uuid[]))', [schoolIds]);
  await database.query('DELETE FROM "SchoolMembership" WHERE "schoolId" = ANY($1::uuid[])', [schoolIds]);
  await database.query('DELETE FROM "PlatformRoleAssignment" WHERE "userId" = ANY($1::uuid[])', [userIds]);
  await database.query('DELETE FROM "User" WHERE id = ANY($1::uuid[])', [userIds]);
  await database.query('DELETE FROM "School" WHERE id = ANY($1::uuid[])', [schoolIds]);
  await database.query('DELETE FROM "AuthRateLimit" WHERE action IN (\'forgot-password\', \'invitation\') AND "updatedAt" >= $1', [startedAt]);
  await database.end();
});

test("mọi vai trò trường và vai trò nền tảng đều đăng nhập, phân quyền và đăng xuất đúng", async ({ page }) => {
  for (const account of accounts) {
    await page.context().clearCookies();
    await login(page, account.email);
    if (account.role === "SCHOOL_ADMIN") {
      await expect(page).toHaveURL(/\/chon-truong$/);
      await selectSchool(page, schoolA.name);
      await expect(page.getByRole("link", { name: "Thành viên", exact: true }).first()).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole("link", { name: "Thành viên", exact: true })).toHaveCount(0);
    }
    await expect(page.getByText(account.label, { exact: true }).first()).toBeVisible();
    await logout(page);
  }

  await login(page, platformAccount.email);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("link", { name: "Danh mục trường", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Thành viên", exact: true })).toHaveCount(0);
  await logout(page);
});

test("bắt buộc đổi mật khẩu ở lần đăng nhập đầu và chỉ dùng được liên kết reset một lần", async ({ page }) => {
  await login(page, forcedAccount.email);
  await expect(page).toHaveURL(/\/doi-mat-khau$/);
  await page.locator("#currentPassword").fill(password);
  await page.locator("#newPassword").fill(changedPassword);
  await page.locator("#confirmPassword").fill(changedPassword);
  await page.getByRole("button", { name: "Đổi mật khẩu và tiếp tục" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.context().clearCookies();
  await page.goto("/quen-mat-khau");
  await page.locator("#email").fill(resetAccount.email);
  await page.getByRole("button", { name: "Gửi hướng dẫn đặt lại" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã tiếp nhận yêu cầu" })).toBeVisible();
  const resetMessage = await database.query<{ payloadJson: { resetUrl: string } }>(
    'SELECT "payloadJson" FROM "EmailOutbox" WHERE "toAddress" = $1 AND "templateKey" = \'PASSWORD_RESET\' ORDER BY "createdAt" DESC LIMIT 1',
    [resetAccount.email],
  );
  const resetToken = new URL(resetMessage.rows[0].payloadJson.resetUrl).searchParams.get("token");
  expect(resetToken).toBeTruthy();
  const resetPath = `/dat-lai-mat-khau?token=${encodeURIComponent(resetToken!)}`;
  await page.goto(resetPath);
  await page.locator("#password").fill(resetPassword);
  await page.locator("#confirmPassword").fill(resetPassword);
  await page.getByRole("button", { name: "Lưu mật khẩu mới" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Mật khẩu đã được cập nhật" })).toBeVisible();
  await page.goto(resetPath);
  await expect(page.getByRole("alert").filter({ hasText: "Liên kết không còn hiệu lực" })).toBeVisible();
  await login(page, resetAccount.email, resetPassword);
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("quản trị trường chuyển tenant, phân quyền, tạm dừng và mời thành viên", async ({ page }) => {
  const admin = accounts[0];
  const teacher = accounts[1];
  await page.context().clearCookies();
  await login(page, admin.email);
  await selectSchool(page, schoolA.name);
  await expect(page.getByText(schoolA.name, { exact: true }).first()).toBeVisible();
  await page.goto("/chon-truong");
  await selectSchool(page, schoolB.name);
  await expect(page.getByText(schoolB.name, { exact: true }).first()).toBeVisible();
  await page.goto("/chon-truong");
  await selectSchool(page, schoolA.name);

  await page.goto("/dashboard/admin/members");
  await expect(page.getByRole("heading", { name: "Thành viên & phân quyền" })).toBeVisible();
  const ownRow = page.getByRole("row").filter({ hasText: admin.displayName });
  await ownRow.getByRole("button", { name: "Phân quyền" }).click();
  const ownRoleDialog = page.getByRole("dialog", { name: `Phân quyền cho ${admin.displayName}` });
  await expect(ownRoleDialog.getByRole("checkbox", { name: "Quản trị trường Không thể tự gỡ vai trò này" })).toBeDisabled();
  await ownRoleDialog.getByRole("button", { name: "Hủy" }).click();

  const teacherRow = page.getByRole("row").filter({ hasText: teacher.displayName });
  await teacherRow.getByRole("button", { name: "Phân quyền" }).click();
  const roleDialog = page.getByRole("dialog", { name: `Phân quyền cho ${teacher.displayName}` });
  await roleDialog.getByLabel("Cố vấn học tập").check();
  await roleDialog.getByRole("button", { name: "Lưu vai trò" }).click();
  await expect.poll(async () => {
    const result = await database.query<{ role: string }>('SELECT role::text FROM "SchoolRoleAssignment" WHERE "membershipId" = $1 ORDER BY role::text', [teacher.membershipId]);
    return result.rows.map(({ role }) => role);
  }).toContain("MENTOR_COUNSELOR");

  await teacherRow.getByRole("button", { name: "Tạm dừng" }).click();
  await expect.poll(async () => {
    const result = await database.query<{ status: string }>('SELECT status::text FROM "SchoolMembership" WHERE id = $1', [teacher.membershipId]);
    return result.rows[0]?.status;
  }).toBe("SUSPENDED");

  await page.getByRole("button", { name: "Mời thành viên", exact: true }).first().click();
  const inviteDialog = page.getByRole("dialog", { name: "Mời thành viên" });
  await inviteDialog.locator("#invite-email").fill(invitedEmail);
  await inviteDialog.getByLabel("Giáo viên & nhân viên").check();
  await submitServerAction(page, "Gửi lời mời", /result=invited/);
  await expect(page.getByRole("status").filter({ hasText: "Đã tạo và gửi lời mời" })).toBeVisible();

  const invitationMessage = await database.query<{ payloadJson: { invitationUrl: string } }>(
    'SELECT "payloadJson" FROM "EmailOutbox" WHERE "toAddress" = $1 AND "templateKey" = \'SCHOOL_INVITATION\' ORDER BY "createdAt" DESC LIMIT 1',
    [invitedEmail],
  );
  const invitationToken = new URL(invitationMessage.rows[0].payloadJson.invitationUrl).searchParams.get("token");
  expect(invitationToken).toBeTruthy();
  await page.context().clearCookies();
  await page.goto(`/chap-nhan-loi-moi?token=${encodeURIComponent(invitationToken!)}`);
  await expect(page.getByText(schoolA.name, { exact: true })).toBeVisible();
  await page.locator("#displayName").fill("E2E Thành viên được mời");
  await page.locator("#password").fill(invitedPassword);
  await page.locator("#confirmPassword").fill(invitedPassword);
  await page.getByRole("button", { name: "Chấp nhận và tham gia trường" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã tham gia trường" })).toBeVisible();
  await login(page, invitedEmail, invitedPassword);
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("quản trị nền tảng khởi tạo, tạm dừng và khôi phục tenant", async ({ page }) => {
  await page.context().clearCookies();
  await login(page, platformAccount.email);
  await page.goto("/dashboard/platform/schools");
  await expect(page.getByRole("heading", { name: "Danh mục trường" })).toBeVisible();
  await page.getByRole("button", { name: "Tạo trường mới" }).click();
  const dialog = page.getByRole("dialog", { name: "Khởi tạo trường" });
  await dialog.locator("#school-name").fill(`Trường được khởi tạo ${suffix}`);
  await dialog.locator("#school-short-name").fill("E2E New");
  await dialog.locator("#school-slug").fill(provisionedSlug);
  await dialog.locator("#admin-email").fill(provisionedAdminEmail);
  await dialog.getByRole("button", { name: "Khởi tạo và gửi lời mời" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã khởi tạo trường và gửi lời mời quản trị viên" })).toBeVisible();
  await page.getByRole("button", { name: "Tạm dừng trường" }).click();
  await expect(page.getByRole("button", { name: "Khôi phục trường" })).toBeVisible();
  await page.getByRole("button", { name: "Khôi phục trường" }).click();
  await expect(page.getByRole("button", { name: "Tạm dừng trường" })).toBeVisible();
});
