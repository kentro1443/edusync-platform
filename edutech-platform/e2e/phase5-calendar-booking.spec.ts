import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { argon2id, hash } from "argon2";
import "dotenv/config";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://edutech:edutech_local@localhost:5432/edutech?schema=public";
const password = "Phase5CalendarE2E-2026!";

test.describe("Phase 5 calendar booking, waitlist and promotion", () => {
  test("a capacity-1 event waitlists the second booker and promotes them after the first cancels", async ({ browser }) => {
    // The first request against a freshly (re)started production server pays a
    // one-time cold-start cost (Prisma engine + argon2 native binding init);
    // give this test headroom beyond the default so that cost alone can't fail it.
    test.setTimeout(75_000);
    const database = new Client({ connectionString: databaseUrl });
    await database.connect();
    const suffix = randomUUID().slice(0, 8);
    const schoolId = randomUUID();
    const calendarId = randomUUID();
    const eventId = randomUUID();
    const adminId = randomUUID();
    const adminMembershipId = randomUUID();
    const studentAId = randomUUID();
    const studentAMembershipId = randomUUID();
    const studentBId = randomUUID();
    const studentBMembershipId = randomUUID();
    const studentAEmail = `studenta-${suffix}@cal-e2e.local`;
    const studentBEmail = `studentb-${suffix}@cal-e2e.local`;
    const passwordHash = await hash(password, { type: argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1, hashLength: 32 });

    try {
      await database.query('INSERT INTO "School" (id, slug, name, "shortName", "updatedAt") VALUES ($1,$2,$3,$4,NOW())', [schoolId, `cal-e2e-${suffix}`, `Trường Calendar E2E ${suffix}`, "CALE2E"]);
      await database.query('INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1,$2,$2,$3,$4,false,NOW())', [adminId, `admin-${suffix}@cal-e2e.local`, passwordHash, "Quản trị E2E"]);
      await database.query('INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1,$2,$2,$3,$4,false,NOW())', [studentAId, studentAEmail, passwordHash, "Học sinh A E2E"]);
      await database.query('INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1,$2,$2,$3,$4,false,NOW())', [studentBId, studentBEmail, passwordHash, "Học sinh B E2E"]);
      await database.query('INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1,$2,$3,\'ACTIVE\',NOW(),NOW())', [adminMembershipId, schoolId, adminId]);
      await database.query('INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1,$2,$3,\'ACTIVE\',NOW(),NOW())', [studentAMembershipId, schoolId, studentAId]);
      await database.query('INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1,$2,$3,\'ACTIVE\',NOW(),NOW())', [studentBMembershipId, schoolId, studentBId]);
      await database.query('INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1,$2,\'SCHOOL_ADMIN\')', [randomUUID(), adminMembershipId]);
      await database.query('INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1,$2,\'STUDENT\')', [randomUUID(), studentAMembershipId]);
      await database.query('INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1,$2,\'STUDENT\')', [randomUUID(), studentBMembershipId]);
      await database.query('INSERT INTO "Calendar" (id, "schoolId", name, visibility, "updatedAt") VALUES ($1,$2,$3,\'SCHOOL\',NOW())', [calendarId, schoolId, `Lịch E2E ${suffix}`]);

      // Anchor the event to "today" so it always falls inside the agenda's default
      // week view regardless of which weekday the suite runs on.
      const start = new Date();
      start.setUTCHours(start.getUTCHours() + 2, 0, 0, 0);
      const end = new Date(start.getTime() + 3_600_000);
      await database.query(
        'INSERT INTO "CalendarEvent" (id, "schoolId", "calendarId", "createdByUserId", title, "startsAt", "endsAt", capacity, status, "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,1,\'CONFIRMED\',NOW())',
        [eventId, schoolId, calendarId, adminId, "Hội thảo sức chứa 1", start, end],
      );

      const contextA = await browser.newContext();
      const pageA = await contextA.newPage();
      await pageA.goto("/login");
      await pageA.locator("#email").fill(studentAEmail);
      await pageA.locator("#password").fill(password);
      await pageA.getByRole("button", { name: "Đăng nhập" }).click();
      await expect(pageA).toHaveURL(/\/dashboard$/);

      const contextB = await browser.newContext();
      const pageB = await contextB.newPage();
      await pageB.goto("/login");
      await pageB.locator("#email").fill(studentBEmail);
      await pageB.locator("#password").fill(password);
      await pageB.getByRole("button", { name: "Đăng nhập" }).click();
      await expect(pageB).toHaveURL(/\/dashboard$/);

      await pageA.goto(`/dashboard/calendar?calendarId=${calendarId}`);
      await expect(pageA.getByRole("heading", { name: "Hội thảo sức chứa 1" })).toBeVisible();
      await Promise.all([
        pageA.waitForURL(/result=booked/),
        pageA.getByRole("button", { name: "Giữ chỗ" }).click(),
      ]);

      await pageB.goto(`/dashboard/calendar?calendarId=${calendarId}`);
      await expect(pageB.getByRole("heading", { name: "Hội thảo sức chứa 1" })).toBeVisible();
      await Promise.all([
        pageB.waitForURL(/result=booked/),
        pageB.getByRole("button", { name: "Giữ chỗ" }).click(),
      ]);

      const beforeCancel = await database.query<{ userId: string; status: string }>(
        'SELECT "userId", status FROM "CalendarBooking" WHERE "eventId" = $1 ORDER BY position ASC NULLS FIRST',
        [eventId],
      );
      expect(beforeCancel.rows).toHaveLength(2);
      expect(beforeCancel.rows.filter((row) => row.status === "BOOKED")).toHaveLength(1);
      expect(beforeCancel.rows.filter((row) => row.status === "WAITLISTED")).toHaveLength(1);

      const bookedRow = beforeCancel.rows.find((row) => row.status === "BOOKED")!;
      const waitlistedRow = beforeCancel.rows.find((row) => row.status === "WAITLISTED")!;
      const bookedPage = bookedRow.userId === studentAId ? pageA : pageB;

      await bookedPage.goto(`/dashboard/calendar/${eventId}`);
      await Promise.all([
        bookedPage.waitForURL(/result=cancelled/),
        bookedPage.getByRole("button", { name: "Hủy giữ chỗ" }).click(),
      ]);

      const afterCancel = await database.query<{ userId: string; status: string }>(
        'SELECT "userId", status FROM "CalendarBooking" WHERE "eventId" = $1',
        [eventId],
      );
      expect(afterCancel.rows.find((row) => row.userId === waitlistedRow.userId)?.status).toBe("BOOKED");
      expect(afterCancel.rows.find((row) => row.userId === bookedRow.userId)?.status).toBe("CANCELLED");

      const notification = await database.query(
        'SELECT id FROM "Notification" WHERE "schoolId" = $1 AND "userId" = $2 AND type = \'CALENDAR_WAITLIST_PROMOTED\'',
        [schoolId, waitlistedRow.userId],
      );
      expect(notification.rows.length).toBeGreaterThan(0);

      await contextA.close();
      await contextB.close();
    } finally {
      await database.query('DELETE FROM "Notification" WHERE "schoolId" = $1', [schoolId]);
      await database.query('DELETE FROM "AuditEvent" WHERE "schoolId" = $1', [schoolId]);
      await database.query('DELETE FROM "CalendarBooking" WHERE "eventId" = $1', [eventId]);
      await database.query('DELETE FROM "CalendarEvent" WHERE id = $1', [eventId]);
      await database.query('DELETE FROM "Calendar" WHERE id = $1', [calendarId]);
      await database.query('DELETE FROM "SchoolRoleAssignment" WHERE "membershipId" IN ($1,$2,$3)', [adminMembershipId, studentAMembershipId, studentBMembershipId]);
      await database.query('DELETE FROM "SchoolMembership" WHERE "schoolId" = $1', [schoolId]);
      await database.query('DELETE FROM "Session" WHERE "userId" IN ($1,$2,$3)', [adminId, studentAId, studentBId]);
      await database.query('DELETE FROM "User" WHERE id IN ($1,$2,$3)', [adminId, studentAId, studentBId]);
      await database.query('DELETE FROM "School" WHERE id = $1', [schoolId]);
      await database.end();
    }
  });
});
