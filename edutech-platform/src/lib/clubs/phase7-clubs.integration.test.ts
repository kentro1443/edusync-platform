import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AuthorizationContext } from "@/lib/auth/policies";
import { db } from "@/lib/db";
import {
  ClubAuthorizationError,
  addClubExpense,
  createClubAnnouncement,
  createClubBudget,
  createClubEvent,
  createClubTask,
  updateClubTaskStatus,
} from "@/lib/clubs/club-service";
import { ClubValidationError } from "@/lib/clubs/club-domain";

describe.sequential("Phase 7 club leader workspace", () => {
  const suffix = randomUUID().slice(0, 8);
  const schoolId = randomUUID();
  const leaderId = randomUUID();
  const leaderMembershipId = randomUUID();
  const memberId = randomUUID();
  const memberMembershipId = randomUUID();
  const clubId = randomUUID();
  const passwordHash = "not-used";

  const leader: AuthorizationContext = {
    userId: leaderId,
    schoolId,
    membershipId: leaderMembershipId,
    schoolRoles: ["CLUB_LEADER"],
    platformRoles: [],
  };
  const member: AuthorizationContext = {
    userId: memberId,
    schoolId,
    membershipId: memberMembershipId,
    schoolRoles: ["STUDENT"],
    platformRoles: [],
  };

  beforeAll(async () => {
    await db.school.create({
      data: { id: schoolId, slug: `clubs-${suffix}`, name: `Trường CLB ${suffix}`, shortName: "CLB" },
    });
    await db.user.createMany({
      data: [
        { id: leaderId, email: `leader-${suffix}@clb.local`, normalizedEmail: `leader-${suffix}@clb.local`, displayName: "Trưởng CLB", passwordHash, mustChangePassword: false },
        { id: memberId, email: `member-${suffix}@clb.local`, normalizedEmail: `member-${suffix}@clb.local`, displayName: "Thành viên", passwordHash, mustChangePassword: false },
      ],
    });
    await db.schoolMembership.createMany({
      data: [
        { id: leaderMembershipId, schoolId, userId: leaderId, status: "ACTIVE", joinedAt: new Date() },
        { id: memberMembershipId, schoolId, userId: memberId, status: "ACTIVE", joinedAt: new Date() },
      ],
    });
    await db.schoolRoleAssignment.createMany({
      data: [
        { membershipId: leaderMembershipId, role: "CLUB_LEADER" },
        { membershipId: memberMembershipId, role: "STUDENT" },
      ],
    });
    await db.club.create({
      data: { id: clubId, schoolId, createdByUserId: leaderId, name: "CLB Test", slug: `clb-test-${suffix}`, status: "ACTIVE" },
    });
    await db.clubMembership.createMany({
      data: [
        { schoolId, clubId, userId: leaderId, role: "LEADER", status: "ACTIVE", joinedAt: new Date() },
        { schoolId, clubId, userId: memberId, role: "MEMBER", status: "ACTIVE", joinedAt: new Date() },
      ],
    });
  });

  afterAll(async () => {
    await db.clubExpense.deleteMany({ where: { budget: { clubId } } });
    await db.clubBudget.deleteMany({ where: { clubId } });
    await db.clubTask.deleteMany({ where: { clubId } });
    await db.clubAnnouncement.deleteMany({ where: { clubId } });
    await db.clubEvent.deleteMany({ where: { clubId } });
    await db.clubMembership.deleteMany({ where: { clubId } });
    await db.club.deleteMany({ where: { id: clubId } });
    await db.auditEvent.deleteMany({ where: { schoolId } });
    await db.schoolRoleAssignment.deleteMany({ where: { membership: { schoolId } } });
    await db.schoolMembership.deleteMany({ where: { schoolId } });
    await db.user.deleteMany({ where: { id: { in: [leaderId, memberId] } } });
    await db.school.deleteMany({ where: { id: schoolId } });
  });

  it("lets the leader post an announcement but blocks a plain member", async () => {
    await createClubAnnouncement(leader, { clubId, title: "Chào mừng", body: "Buổi sinh hoạt đầu tiên." });
    await expect(
      createClubAnnouncement(member, { clubId, title: "Giả mạo", body: "Không được phép." }),
    ).rejects.toThrow(ClubAuthorizationError);
  });

  it("enforces the budget ceiling on expenses", async () => {
    const budget = await createClubBudget(leader, { clubId, name: "Ngân sách sự kiện", amount: 1_000_000 });
    await addClubExpense(leader, { budgetId: budget.id, description: "Vật tư", amount: 600_000, spentAt: new Date() });
    await expect(
      addClubExpense(leader, { budgetId: budget.id, description: "Vượt mức", amount: 500_000, spentAt: new Date() }),
    ).rejects.toThrow(ClubValidationError);
    const refreshed = await db.clubBudget.findUniqueOrThrow({ where: { id: budget.id } });
    expect(Number(refreshed.spent)).toBe(600_000);
  });

  it("blocks conflicting club events and invalid task transitions", async () => {
    const start = new Date(Date.now() + 5 * 86_400_000);
    const end = new Date(start.getTime() + 3_600_000);
    await createClubEvent(leader, { clubId, title: "Sự kiện A", startsAt: start, endsAt: end, submitForApproval: true });
    await expect(
      createClubEvent(leader, {
        clubId,
        title: "Sự kiện trùng",
        startsAt: new Date(start.getTime() + 600_000),
        endsAt: new Date(end.getTime() + 600_000),
        submitForApproval: true,
      }),
    ).rejects.toThrow(ClubValidationError);

    const task = await createClubTask(leader, { clubId, title: "Chuẩn bị" });
    await updateClubTaskStatus(leader, { taskId: task.id, status: "DONE" });
    await expect(
      updateClubTaskStatus(leader, { taskId: task.id, status: "CANCELLED" }),
    ).rejects.toThrow(ClubValidationError);
  });
});
