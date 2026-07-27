import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { authenticateCredentials } from "@/lib/auth/credentials";
import { hashPassword } from "@/lib/auth/password";
import {
  createDatabaseSession,
  getDatabaseSession,
} from "@/lib/auth/session";
import {
  DevSwitchError,
  exitDevSession,
  listDevSwitchOptions,
  switchDevSession,
} from "@/lib/auth/dev-switching";
import { db } from "@/lib/db";

describe.sequential("dev account switching", () => {
  const suffix = randomUUID().slice(0, 8);
  const schoolId = randomUUID();
  const otherSchoolId = randomUUID();
  const devUserId = randomUUID();
  const demoUserId = randomUUID();
  const standardUserId = randomUUID();
  const startedAt = new Date();
  let sessionToken = "";

  async function requireTestSession() {
    const session = await getDatabaseSession(sessionToken);
    if (!session) throw new Error("Expected active test session");
    return session;
  }

  beforeAll(async () => {
    const passwordHash = await hashPassword("Dev-Switch-Test-2026!");
    await db.school.createMany({
      data: [
        {
          id: schoolId,
          slug: `dev-switch-${suffix}`,
          name: `Trường Dev Switch ${suffix}`,
          shortName: "Dev",
        },
        {
          id: otherSchoolId,
          slug: `dev-other-${suffix}`,
          name: `Trường Khác ${suffix}`,
          shortName: "Khác",
        },
      ],
    });
    await db.user.createMany({
      data: [
        {
          id: devUserId,
          email: `dev-${suffix}@test.edusync.local`,
          normalizedEmail: `dev-${suffix}@test.edusync.local`,
          displayName: "Nhà phát triển",
          passwordHash,
          mustChangePassword: false,
          accountKind: "DEV_OPERATOR",
        },
        {
          id: demoUserId,
          email: `demo-${suffix}@test.edusync.local`,
          normalizedEmail: `demo-${suffix}@test.edusync.local`,
          displayName: "Tài khoản Demo",
          passwordHash,
          mustChangePassword: false,
          accountKind: "DEMO",
        },
        {
          id: standardUserId,
          email: `standard-${suffix}@test.edusync.local`,
          normalizedEmail: `standard-${suffix}@test.edusync.local`,
          displayName: "Tài khoản Thường",
          passwordHash,
          mustChangePassword: false,
        },
      ],
    });

    const memberships = await Promise.all([
      db.schoolMembership.create({
        data: {
          schoolId,
          userId: demoUserId,
          status: "ACTIVE",
          joinedAt: startedAt,
        },
      }),
      db.schoolMembership.create({
        data: {
          schoolId,
          userId: standardUserId,
          status: "ACTIVE",
          joinedAt: startedAt,
        },
      }),
    ]);
    await db.schoolRoleAssignment.createMany({
      data: [
        { membershipId: memberships[0].id, role: "STUDENT" },
        { membershipId: memberships[1].id, role: "SCHOOL_ADMIN" },
      ],
    });

    const createdSession = await createDatabaseSession(devUserId, {
      userAgent: "Vitest Dev Switch",
    });
    sessionToken = createdSession.token;
  });

  afterAll(async () => {
    const userIds = [devUserId, demoUserId, standardUserId];
    await db.auditEvent.deleteMany({
      where: {
        OR: [
          { actorUserId: { in: userIds } },
          { schoolId: { in: [schoolId, otherSchoolId] } },
        ],
      },
    });
    await db.session.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { operatorUserId: { in: userIds } },
        ],
      },
    });
    await db.schoolRoleAssignment.deleteMany({
      where: {
        membership: {
          schoolId: { in: [schoolId, otherSchoolId] },
        },
      },
    });
    await db.schoolMembership.deleteMany({
      where: { schoolId: { in: [schoolId, otherSchoolId] } },
    });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.school.deleteMany({
      where: { id: { in: [schoolId, otherSchoolId] } },
    });
  });

  it("lists only active demo accounts grouped by their active school", async () => {
    const session = await requireTestSession();
    const options = await listDevSwitchOptions(session);
    const testSchool = options.find(({ id }) => id === schoolId);

    expect(testSchool).toMatchObject({
      id: schoolId,
      accounts: [
        {
          id: demoUserId,
          roles: ["STUDENT"],
        },
      ],
    });
    expect(
      options.flatMap(({ accounts }) => accounts).some(
        ({ id }) => id === standardUserId,
      ),
    ).toBe(false);
  });

  it("rejects standard accounts and cross-school target tampering", async () => {
    const session = await requireTestSession();

    await expect(
      switchDevSession(session, {
        targetUserId: standardUserId,
        schoolId,
      }),
    ).rejects.toBeInstanceOf(DevSwitchError);
    await expect(
      switchDevSession(session, {
        targetUserId: demoUserId,
        schoolId: otherSchoolId,
      }),
    ).rejects.toBeInstanceOf(DevSwitchError);
  });

  it("rejects switching when the active session is not owned by a dev operator", async () => {
    const standardSessionRecord = await createDatabaseSession(standardUserId);
    const standardSession = await getDatabaseSession(standardSessionRecord.token);
    if (!standardSession) throw new Error("Expected standard test session");

    await expect(
      switchDevSession(standardSession, {
        targetUserId: demoUserId,
        schoolId,
      }),
    ).rejects.toBeInstanceOf(DevSwitchError);
  });

  it("rejects inactive users, memberships, schools, and roleless targets", async () => {
    const session = await requireTestSession();
    const membership = await db.schoolMembership.findUniqueOrThrow({
      where: {
        schoolId_userId: {
          schoolId,
          userId: demoUserId,
        },
      },
      select: { id: true },
    });

    await db.user.update({
      where: { id: demoUserId },
      data: { status: "SUSPENDED" },
    });
    await expect(
      switchDevSession(session, { targetUserId: demoUserId, schoolId }),
    ).rejects.toBeInstanceOf(DevSwitchError);
    await db.user.update({
      where: { id: demoUserId },
      data: { status: "ACTIVE" },
    });

    await db.schoolMembership.update({
      where: { id: membership.id },
      data: { status: "SUSPENDED" },
    });
    await expect(
      switchDevSession(session, { targetUserId: demoUserId, schoolId }),
    ).rejects.toBeInstanceOf(DevSwitchError);
    await db.schoolMembership.update({
      where: { id: membership.id },
      data: { status: "ACTIVE" },
    });

    await db.school.update({
      where: { id: schoolId },
      data: { status: "SUSPENDED" },
    });
    await expect(
      switchDevSession(session, { targetUserId: demoUserId, schoolId }),
    ).rejects.toBeInstanceOf(DevSwitchError);
    await db.school.update({
      where: { id: schoolId },
      data: { status: "ACTIVE" },
    });

    await db.schoolRoleAssignment.deleteMany({
      where: { membershipId: membership.id },
    });
    await expect(
      switchDevSession(session, { targetUserId: demoUserId, schoolId }),
    ).rejects.toBeInstanceOf(DevSwitchError);
    await db.schoolRoleAssignment.create({
      data: { membershipId: membership.id, role: "STUDENT" },
    });
  });

  it("rejects developer credentials and invalidates their sessions in production", async () => {
    const temporarySession = await createDatabaseSession(devUserId);
    vi.stubEnv("NODE_ENV", "production");
    try {
      await expect(
        authenticateCredentials({
          email: `dev-${suffix}@test.edusync.local`,
          password: "Dev-Switch-Test-2026!",
        }),
      ).resolves.toBeNull();
      await expect(getDatabaseSession(temporarySession.token)).resolves.toBeNull();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("preserves operator, applies target permissions, and restores operator", async () => {
    const operatorSession = await requireTestSession();
    await switchDevSession(operatorSession, {
      targetUserId: demoUserId,
      schoolId,
    });

    const impersonated = await requireTestSession();
    expect(impersonated.user.id).toBe(demoUserId);
    expect(impersonated.user.accountKind).toBe("DEMO");
    expect(impersonated.operatorUser?.id).toBe(devUserId);
    expect(impersonated.schoolContexts[0]?.roles).toEqual(["STUDENT"]);

    await switchDevSession(impersonated, {
      targetUserId: demoUserId,
      schoolId,
    });
    const switchedAgain = await requireTestSession();
    await exitDevSession(switchedAgain, schoolId);
    const restored = await requireTestSession();
    expect(restored.user.id).toBe(devUserId);
    expect(restored.operatorUser).toBeNull();

    const actions = await db.auditEvent.findMany({
      where: { actorUserId: devUserId },
      select: { action: true, entityId: true, schoolId: true },
      orderBy: { createdAt: "asc" },
    });
    expect(actions).toEqual([
      {
        action: "DEV_IMPERSONATION_STARTED",
        entityId: demoUserId,
        schoolId,
      },
      {
        action: "DEV_IMPERSONATION_SWITCHED",
        entityId: demoUserId,
        schoolId,
      },
      {
        action: "DEV_IMPERSONATION_ENDED",
        entityId: demoUserId,
        schoolId,
      },
    ]);
  });
});
