import "server-only";

import { db } from "@/lib/db";
import { buildRetentionCutoffs } from "@/lib/maintenance/retention-policy";
import { logEvent } from "@/lib/observability/logger";

export type CleanupResult = Readonly<{
  mode: "dry-run" | "apply";
  sessions: number;
  passwordResetTokens: number;
  rateLimits: number;
  notifications: number;
  domainOutboxEvents: number;
  emailOutboxItems: number;
  invitations: number;
}>;

export async function runRetentionCleanup({
  now = new Date(),
  dryRun = false,
}: Readonly<{ now?: Date; dryRun?: boolean }> = {}): Promise<CleanupResult> {
  const cutoff = buildRetentionCutoffs(now);
  const filters = {
    sessions: {
      OR: [
        { expires: { lt: cutoff.staleSession } },
        { revokedAt: { lt: cutoff.staleSession } },
      ],
    },
    passwordResetTokens: {
      OR: [
        { expiresAt: { lt: cutoff.staleToken } },
        { usedAt: { lt: cutoff.staleToken } },
        { revokedAt: { lt: cutoff.staleToken } },
      ],
    },
    rateLimits: { updatedAt: { lt: cutoff.staleRateLimit } },
    notifications: { readAt: { lt: cutoff.staleNotification } },
    domainOutboxEvents: {
      status: "PROCESSED" as const,
      processedAt: { lt: cutoff.staleDelivery },
    },
    emailOutboxItems: {
      OR: [
        { status: "SENT" as const, sentAt: { lt: cutoff.staleDelivery } },
        {
          status: "FAILED" as const,
          updatedAt: { lt: cutoff.staleFailedDelivery },
        },
      ],
    },
    invitations: { expiresAt: { lt: cutoff.staleInvitation } },
  };

  const values = dryRun
    ? await Promise.all([
        db.session.count({ where: filters.sessions }),
        db.passwordResetToken.count({ where: filters.passwordResetTokens }),
        db.authRateLimit.count({ where: filters.rateLimits }),
        db.notification.count({ where: filters.notifications }),
        db.domainOutboxEvent.count({ where: filters.domainOutboxEvents }),
        db.emailOutbox.count({ where: filters.emailOutboxItems }),
        db.invitation.count({ where: filters.invitations }),
      ])
    : (
        await db.$transaction([
          db.session.deleteMany({ where: filters.sessions }),
          db.passwordResetToken.deleteMany({
            where: filters.passwordResetTokens,
          }),
          db.authRateLimit.deleteMany({ where: filters.rateLimits }),
          db.notification.deleteMany({ where: filters.notifications }),
          db.domainOutboxEvent.deleteMany({
            where: filters.domainOutboxEvents,
          }),
          db.emailOutbox.deleteMany({ where: filters.emailOutboxItems }),
          db.invitation.deleteMany({ where: filters.invitations }),
        ])
      ).map((result) => result.count);

  const result: CleanupResult = {
    mode: dryRun ? "dry-run" : "apply",
    sessions: values[0],
    passwordResetTokens: values[1],
    rateLimits: values[2],
    notifications: values[3],
    domainOutboxEvents: values[4],
    emailOutboxItems: values[5],
    invitations: values[6],
  };
  logEvent("info", "maintenance.retention.completed", result);
  return result;
}
