import "server-only";

import type { SchoolStatus } from "@/generated/prisma/enums";
import { parseSchoolProvisioning } from "@/lib/admin/validation";
import { writeAuditEvent } from "@/lib/audit";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/auth/opaque-token";
import { getPlatformPermissions, hasPermission, permissions, type Permission } from "@/lib/auth/permissions";
import type { AuthorizationContext } from "@/lib/auth/policies";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

function requirePlatformPermission(actor: AuthorizationContext, permission: Permission) {
  if (!hasPermission(getPlatformPermissions(actor.platformRoles), permission)) {
    throw new Error("Forbidden platform administration action.");
  }
}

export async function listPlatformSchools(
  actor: AuthorizationContext,
  input: { page?: unknown; query?: unknown; status?: unknown },
) {
  requirePlatformPermission(actor, permissions.platformSchoolRead);
  const pageValue = Number(input.page);
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const query = typeof input.query === "string" ? input.query.trim().slice(0, 120) : "";
  const status = ["ACTIVE", "SUSPENDED", "ARCHIVED"].includes(String(input.status))
    ? (String(input.status) as SchoolStatus)
    : undefined;
  const where = {
    ...(status ? { status } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { slug: { contains: query.toLowerCase(), mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [total, schools] = await db.$transaction([
    db.school.count({ where }),
    db.school.findMany({
      where,
      select: {
        id: true,
        name: true,
        shortName: true,
        slug: true,
        status: true,
        planCode: true,
        createdAt: true,
        _count: { select: { memberships: { where: { status: "ACTIVE" } } } },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: (page - 1) * 20,
      take: 20,
    }),
  ]);
  return { schools, total, page, totalPages: Math.max(1, Math.ceil(total / 20)) };
}

export async function getPlatformSchool(actor: AuthorizationContext, schoolId: string) {
  requirePlatformPermission(actor, permissions.platformSchoolRead);
  return db.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      shortName: true,
      slug: true,
      status: true,
      planCode: true,
      storageQuotaBytes: true,
      settingsJson: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { memberships: true, invitations: true, storedFiles: true } },
    },
  });
}

export async function provisionSchool(
  actor: AuthorizationContext,
  input: unknown,
  now = new Date(),
): Promise<{ success: true; schoolId: string } | { success: false; error: "invalid" | "duplicate" }> {
  requirePlatformPermission(actor, permissions.platformSchoolCreate);
  const parsed = parseSchoolProvisioning(input);
  if (!parsed.success) return { success: false, error: "invalid" };
  const duplicate = await db.school.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (duplicate) return { success: false, error: "duplicate" };
  const token = createOpaqueToken();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60_000);
  const school = await db.$transaction(async (transaction) => {
    const created = await transaction.school.create({
      data: {
        name: parsed.data.name,
        shortName: parsed.data.shortName,
        slug: parsed.data.slug,
        planCode: "STANDARD",
      },
      select: { id: true, name: true },
    });
    const invitation = await transaction.invitation.create({
      data: {
        schoolId: created.id,
        email: parsed.data.adminEmail,
        normalizedEmail: parsed.data.adminEmail,
        tokenHash: hashOpaqueToken(token),
        roleHintsJson: ["SCHOOL_ADMIN"],
        expiresAt,
        createdByUserId: actor.userId,
      },
      select: { id: true },
    });
    await transaction.emailOutbox.create({
      data: {
        schoolId: created.id,
        toAddress: parsed.data.adminEmail,
        templateKey: "SCHOOL_INVITATION",
        payloadJson: {
          schoolName: created.name,
          invitationUrl: `${env.APP_URL}/chap-nhan-loi-moi?token=${token}`,
          expiresAt: expiresAt.toISOString(),
          invitationId: invitation.id,
        },
      },
    });
    return created;
  });
  await writeAuditEvent({
    schoolId: school.id,
    actorUserId: actor.userId,
    action: "PLATFORM_SCHOOL_PROVISIONED",
    entityType: "School",
    entityId: school.id,
    after: parsed.data,
  });
  return { success: true, schoolId: school.id };
}

export async function setPlatformSchoolStatus(
  actor: AuthorizationContext,
  schoolId: string,
  status: Extract<SchoolStatus, "ACTIVE" | "SUSPENDED">,
  now = new Date(),
): Promise<boolean> {
  requirePlatformPermission(
    actor,
    status === "ACTIVE" ? permissions.platformSchoolRestore : permissions.platformSchoolSuspend,
  );
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { status: true } });
  if (!school) return false;
  await db.$transaction(async (transaction) => {
    await transaction.school.update({ where: { id: schoolId }, data: { status } });
    if (status === "SUSPENDED") {
      const users = await transaction.schoolMembership.findMany({
        where: { schoolId, status: "ACTIVE" },
        select: { userId: true },
      });
      await transaction.session.updateMany({
        where: { userId: { in: users.map(({ userId }) => userId) }, revokedAt: null },
        data: { revokedAt: now, revokeReason: "SCHOOL_SUSPENDED" },
      });
    }
  });
  await writeAuditEvent({
    schoolId,
    actorUserId: actor.userId,
    action: status === "ACTIVE" ? "PLATFORM_SCHOOL_RESTORED" : "PLATFORM_SCHOOL_SUSPENDED",
    entityType: "School",
    entityId: schoolId,
    before: { status: school.status },
    after: { status },
  });
  return true;
}
