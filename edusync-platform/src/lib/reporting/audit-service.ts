import "server-only";

import { randomUUID } from "node:crypto";

import type { AuthorizationContext } from "@/lib/auth/policies";
import {
  getSchoolPermissions,
  hasPermission,
  permissions,
  type Permission,
} from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/reporting/reporting-domain";

function requireAuditActor(
  actor: AuthorizationContext,
  permission: Permission = permissions.auditReadSchool,
): asserts actor is AuthorizationContext & { schoolId: string; membershipId: string } {
  if (
    !actor.schoolId ||
    !actor.membershipId ||
    !hasPermission(getSchoolPermissions(actor.schoolRoles), permission)
  ) {
    throw new Error("Bạn không có quyền xem nhật ký kiểm toán.");
  }
}

export type AuditFilters = Readonly<{
  action?: string;
  entityType?: string;
  actor?: string;
  from: Date;
  to: Date;
}>;

export async function listSchoolAuditEvents(
  actor: AuthorizationContext,
  filters: AuditFilters,
) {
  requireAuditActor(actor);
  return db.auditEvent.findMany({
    where: {
      schoolId: actor.schoolId,
      createdAt: { gte: filters.from, lt: filters.to },
      action: filters.action
        ? { contains: filters.action, mode: "insensitive" }
        : undefined,
      entityType: filters.entityType
        ? { contains: filters.entityType, mode: "insensitive" }
        : undefined,
      actor: filters.actor
        ? {
            OR: [
              { displayName: { contains: filters.actor, mode: "insensitive" } },
              { email: { contains: filters.actor, mode: "insensitive" } },
            ],
          }
        : undefined,
    },
    select: {
      id: true,
      actorType: true,
      action: true,
      entityType: true,
      entityId: true,
      beforeJson: true,
      afterJson: true,
      requestId: true,
      createdAt: true,
      actor: { select: { displayName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function exportSchoolAuditCsv(
  actor: AuthorizationContext,
  filters: AuditFilters,
) {
  requireAuditActor(actor, permissions.auditExportSchool);
  const events = await listSchoolAuditEvents(actor, filters);
  const csv = toCsv([
    ["Thời gian", "Tác nhân", "Hành động", "Loại đối tượng", "Mã đối tượng", "Request ID"],
    ...events.map((event) => [
      event.createdAt,
      event.actor?.displayName ?? event.actorType,
      event.action,
      event.entityType,
      event.entityId,
      event.requestId,
    ]),
  ]);
  await db.auditEvent.create({
    data: {
      schoolId: actor.schoolId,
      actorUserId: actor.userId,
      actorType: "USER",
      action: "AUDIT_EXPORTED",
      entityType: "AuditEvent",
      afterJson: { rowCount: events.length },
      requestId: randomUUID(),
    },
  });
  return csv;
}
