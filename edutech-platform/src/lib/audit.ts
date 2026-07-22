import "server-only";

import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";

export type AuditInput = Readonly<{
  schoolId?: string | null;
  actorUserId?: string | null;
  actorType?: "USER" | "SYSTEM";
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: object | null;
  after?: object | null;
  requestId?: string;
}>;

export async function writeAuditEvent(input: AuditInput): Promise<void> {
  await db.auditEvent.create({
    data: {
      schoolId: input.schoolId ?? null,
      actorUserId: input.actorUserId ?? null,
      actorType: input.actorType ?? (input.actorUserId ? "USER" : "SYSTEM"),
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      beforeJson: input.before ?? undefined,
      afterJson: input.after ?? undefined,
      requestId: input.requestId ?? randomUUID(),
    },
  });
}
