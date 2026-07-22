import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AdminValidationError, createParentStudentLink, listSchoolMembers, setMembershipRoles } from "@/lib/admin/school-admin";
import { authenticateCredentials } from "@/lib/auth/credentials";
import { acceptSchoolInvitation, createSchoolInvitation } from "@/lib/auth/invitation";
import { consumePasswordReset, requestPasswordReset } from "@/lib/auth/password-reset";
import { hashPassword } from "@/lib/auth/password";
import {
  checkAuthRateLimit,
  recordAuthAttempt,
} from "@/lib/auth/rate-limit";
import {
  createDatabaseSession,
  getDatabaseSession,
  revokeDatabaseSession,
} from "@/lib/auth/session";
import type { AuthorizationContext } from "@/lib/auth/policies";
import { db } from "@/lib/db";

describe.sequential("Phase 2 identity and tenant integration", () => {
  const suffix = randomUUID().slice(0, 8);
  const schoolAId = randomUUID();
  const schoolBId = randomUUID();
  const adminId = randomUUID();
  const otherUserId = randomUUID();
  const parentId = randomUUID();
  const studentAId = randomUUID();
  const studentBId = randomUUID();
  const adminMembershipId = randomUUID();
  const startedAt = new Date();
  const adminEmail = `phase2-admin-${suffix}@test.edutech.local`;
  const invitationEmail = `phase2-invite-${suffix}@test.edutech.local`;
  const password = "Phase2-Integration-2026!";
  const actor: AuthorizationContext = {
    userId: adminId,
    schoolId: schoolAId,
    membershipId: adminMembershipId,
    schoolRoles: ["SCHOOL_ADMIN"],
    platformRoles: [],
  };

  beforeAll(async () => {
    const passwordHash = await hashPassword(password);
    await db.school.createMany({
      data: [
        { id: schoolAId, slug: `phase2-a-${suffix}`, name: `Phase 2 A ${suffix}`, shortName: "P2A" },
        { id: schoolBId, slug: `phase2-b-${suffix}`, name: `Phase 2 B ${suffix}`, shortName: "P2B" },
      ],
    });
    await db.user.createMany({
      data: [
        { id: adminId, email: adminEmail, normalizedEmail: adminEmail, displayName: "Quản trị Phase 2", passwordHash, mustChangePassword: false },
        { id: otherUserId, email: `other-${suffix}@test.local`, normalizedEmail: `other-${suffix}@test.local`, displayName: "Thành viên trường B", passwordHash, mustChangePassword: false },
        { id: parentId, email: `parent-${suffix}@test.local`, normalizedEmail: `parent-${suffix}@test.local`, displayName: "Phụ huynh A", passwordHash, mustChangePassword: false },
        { id: studentAId, email: `student-a-${suffix}@test.local`, normalizedEmail: `student-a-${suffix}@test.local`, displayName: "Học sinh A", passwordHash, mustChangePassword: false },
        { id: studentBId, email: `student-b-${suffix}@test.local`, normalizedEmail: `student-b-${suffix}@test.local`, displayName: "Học sinh B", passwordHash, mustChangePassword: false },
      ],
    });
    const memberships = await Promise.all([
      db.schoolMembership.create({ data: { id: adminMembershipId, schoolId: schoolAId, userId: adminId, status: "ACTIVE", joinedAt: startedAt }, select: { id: true } }),
      db.schoolMembership.create({ data: { schoolId: schoolBId, userId: otherUserId, status: "ACTIVE", joinedAt: startedAt }, select: { id: true } }),
      db.schoolMembership.create({ data: { schoolId: schoolAId, userId: parentId, status: "ACTIVE", joinedAt: startedAt }, select: { id: true } }),
      db.schoolMembership.create({ data: { schoolId: schoolAId, userId: studentAId, status: "ACTIVE", joinedAt: startedAt }, select: { id: true } }),
      db.schoolMembership.create({ data: { schoolId: schoolBId, userId: studentBId, status: "ACTIVE", joinedAt: startedAt }, select: { id: true } }),
    ]);
    await db.schoolRoleAssignment.createMany({
      data: [
        { membershipId: memberships[0].id, role: "SCHOOL_ADMIN", assignedByUserId: adminId },
        { membershipId: memberships[1].id, role: "TEACHER_STAFF" },
        { membershipId: memberships[2].id, role: "PARENT_GUARDIAN", assignedByUserId: adminId },
        { membershipId: memberships[3].id, role: "STUDENT", assignedByUserId: adminId },
        { membershipId: memberships[4].id, role: "STUDENT" },
      ],
    });
  });

  afterAll(async () => {
    const testUserIds: string[] = [adminId, otherUserId, parentId, studentAId, studentBId];
    const invitedUsers = await db.user.findMany({ where: { normalizedEmail: invitationEmail }, select: { id: true } });
    testUserIds.push(...invitedUsers.map(({ id }) => id));
    await db.auditEvent.deleteMany({ where: { OR: [{ schoolId: { in: [schoolAId, schoolBId] } }, { actorUserId: { in: testUserIds } }] } });
    await db.emailOutbox.deleteMany({ where: { OR: [{ schoolId: { in: [schoolAId, schoolBId] } }, { recipientUserId: { in: testUserIds } }] } });
    await db.passwordResetToken.deleteMany({ where: { userId: { in: testUserIds } } });
    await db.session.deleteMany({ where: { userId: { in: testUserIds } } });
    await db.parentStudentLink.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } });
    await db.invitation.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } });
    await db.schoolRoleAssignment.deleteMany({ where: { membership: { schoolId: { in: [schoolAId, schoolBId] } } } });
    await db.schoolMembership.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } });
    await db.user.deleteMany({ where: { id: { in: testUserIds } } });
    await db.school.deleteMany({ where: { id: { in: [schoolAId, schoolBId] } } });
    await db.authRateLimit.deleteMany({ where: { action: { in: ["invitation", "forgot-password", "phase2-integration"] }, updatedAt: { gte: startedAt } } });
  });

  it("authenticates credentials and revokes a session without deleting its history", async () => {
    const credentialUser = await authenticateCredentials({ email: adminEmail, password });
    expect(credentialUser?.id).toBe(adminId);
    const created = await createDatabaseSession(adminId, { userAgent: "Vitest Phase 2" });
    expect((await getDatabaseSession(created.token))?.sessionId).toBe(created.id);
    await revokeDatabaseSession(created.token, "TEST_REVOKE");
    expect(await getDatabaseSession(created.token)).toBeNull();
    expect(await db.session.findUnique({ where: { id: created.id }, select: { revokedAt: true } })).toEqual({ revokedAt: expect.any(Date) });
  });

  it("never returns School B members from a School A repository", async () => {
    const result = await listSchoolMembers(actor, { query: "" });
    expect(result.members.some(({ user }) => user.id === otherUserId)).toBe(false);
    expect(result.members.every((membership) => membership.id !== "")).toBe(true);
  });

  it("rejects a cross-tenant parent/student link", async () => {
    await expect(
      createParentStudentLink(actor, {
        parentUserId: parentId,
        studentUserId: studentBId,
        relationshipType: "Phụ huynh",
      }),
    ).rejects.toBeInstanceOf(AdminValidationError);
    await expect(
      createParentStudentLink(actor, {
        parentUserId: parentId,
        studentUserId: studentAId,
        relationshipType: "Phụ huynh",
      }),
    ).resolves.toEqual(expect.any(String));
  });

  it("prevents the active administrator from removing their own admin role", async () => {
    await expect(
      setMembershipRoles(actor, adminMembershipId, ["TEACHER_STAFF"]),
    ).rejects.toBeInstanceOf(AdminValidationError);
    expect(
      await db.schoolRoleAssignment.findUnique({
        where: {
          membershipId_role: {
            membershipId: adminMembershipId,
            role: "SCHOOL_ADMIN",
          },
        },
      }),
    ).not.toBeNull();
  });

  it("creates, sends and consumes a school invitation exactly once", async () => {
    const created = await createSchoolInvitation(actor, { email: invitationEmail, roles: ["TEACHER_STAFF"] });
    expect(created.success).toBe(true);
    const message = await db.emailOutbox.findFirstOrThrow({
      where: { schoolId: schoolAId, toAddress: invitationEmail, templateKey: "SCHOOL_INVITATION" },
      orderBy: { createdAt: "desc" },
      select: { payloadJson: true },
    });
    const payload = message.payloadJson as { invitationUrl: string };
    const token = new URL(payload.invitationUrl).searchParams.get("token")!;
    expect(
      await acceptSchoolInvitation(token, {
        displayName: "Giáo viên được mời",
        password: "Invitation-Phase2-2026!",
        confirmPassword: "Invitation-Phase2-2026!",
      }),
    ).toEqual({ success: true });
    expect(await acceptSchoolInvitation(token, {})).toEqual({ success: false, error: "invalid" });
    const membership = await db.schoolMembership.findFirst({
      where: { schoolId: schoolAId, user: { normalizedEmail: invitationEmail } },
      select: { roleAssignments: { select: { role: true } } },
    });
    expect(membership?.roleAssignments).toContainEqual({ role: "TEACHER_STAFF" });
  });

  it("consumes a password reset once and revokes active sessions", async () => {
    const activeSession = await createDatabaseSession(adminId);
    await requestPasswordReset(adminEmail, `integration-${suffix}`);
    const message = await db.emailOutbox.findFirstOrThrow({
      where: { recipientUserId: adminId, templateKey: "PASSWORD_RESET" },
      orderBy: { createdAt: "desc" },
      select: { payloadJson: true },
    });
    const token = new URL((message.payloadJson as { resetUrl: string }).resetUrl).searchParams.get("token")!;
    expect(await consumePasswordReset(token, "Reset-Phase2-2026!")).toBe(true);
    expect(await consumePasswordReset(token, "Reset-Phase2-Again-2026!")).toBe(false);
    expect(await getDatabaseSession(activeSession.token)).toBeNull();
  });

  it("removes suspended memberships from resolved school contexts", async () => {
    await db.schoolMembership.update({ where: { id: adminMembershipId }, data: { status: "SUSPENDED" } });
    const created = await createDatabaseSession(adminId);
    expect((await getDatabaseSession(created.token))?.schoolContexts).toEqual([]);
    await db.schoolMembership.update({ where: { id: adminMembershipId }, data: { status: "ACTIVE", leftAt: null } });
  });

  it("persists authentication throttling across requests", async () => {
    const subject = `rate-limit-${suffix}`;
    const rule = { maxAttempts: 2, windowMs: 60_000, blockMs: 120_000 };
    expect(await checkAuthRateLimit("phase2-integration", subject, rule)).toMatchObject({ allowed: true });
    await Promise.all([
      recordAuthAttempt("phase2-integration", subject, rule),
      recordAuthAttempt("phase2-integration", subject, rule),
    ]);
    expect(await checkAuthRateLimit("phase2-integration", subject, rule)).toMatchObject({ allowed: false });
  });
});
