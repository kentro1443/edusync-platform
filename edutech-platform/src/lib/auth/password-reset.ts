import "server-only";

import { UserStatus } from "@/generated/prisma/enums";
import { writeAuditEvent } from "@/lib/audit";
import { createOpaqueToken, hashOpaqueToken, isUsableToken } from "@/lib/auth/opaque-token";
import { minimumPasswordLength } from "@/lib/auth/change-password";
import { hashPassword, normalizeEmail } from "@/lib/auth/password";
import {
  authRateLimits,
  checkAuthRateLimit,
  recordAuthAttempt,
} from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const resetLifetimeMs = 30 * 60_000;

export function validateResetPassword(input: {
  password: unknown;
  confirmPassword: unknown;
}):
  | { success: true; password: string }
  | { success: false; error: "missing" | "weak" | "mismatch" } {
  if (
    typeof input.password !== "string" ||
    typeof input.confirmPassword !== "string" ||
    !input.password ||
    !input.confirmPassword
  ) {
    return { success: false, error: "missing" };
  }
  if (input.password.length < minimumPasswordLength) {
    return { success: false, error: "weak" };
  }
  if (input.password !== input.confirmPassword) {
    return { success: false, error: "mismatch" };
  }
  return { success: true, password: input.password };
}

export async function requestPasswordReset(
  email: string,
  rateSubject: string,
  now = new Date(),
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const rateLimit = await checkAuthRateLimit(
    "forgot-password",
    rateSubject,
    authRateLimits.forgotPassword,
    now,
  );
  if (!rateLimit.allowed) return;

  const user = await db.user.findUnique({
    where: { normalizedEmail },
    select: {
      id: true,
      displayName: true,
      status: true,
      memberships: {
        where: { status: "ACTIVE" },
        select: { schoolId: true },
        take: 1,
      },
    },
  });

  if (user?.status === UserStatus.ACTIVE) {
    const token = createOpaqueToken();
    const expiresAt = new Date(now.getTime() + resetLifetimeMs);
    await db.$transaction(async (transaction) => {
      await transaction.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null, revokedAt: null },
        data: { revokedAt: now },
      });
      await transaction.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashOpaqueToken(token),
          expiresAt,
        },
      });
      await transaction.emailOutbox.create({
        data: {
          schoolId: user.memberships[0]?.schoolId ?? null,
          recipientUserId: user.id,
          toAddress: normalizedEmail,
          templateKey: "PASSWORD_RESET",
          payloadJson: {
            displayName: user.displayName,
            resetUrl: `${env.APP_URL}/dat-lai-mat-khau?token=${token}`,
            expiresAt: expiresAt.toISOString(),
          },
        },
      });
    });
    await writeAuditEvent({
      actorType: "SYSTEM",
      action: "AUTH_PASSWORD_RESET_REQUESTED",
      entityType: "User",
      entityId: user.id,
    });
  }

  await recordAuthAttempt(
    "forgot-password",
    rateSubject,
    authRateLimits.forgotPassword,
    now,
  );
}

export async function getPasswordResetTokenState(
  token: string,
  now = new Date(),
): Promise<"valid" | "invalid"> {
  if (!token || token.length > 512) return "invalid";
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashOpaqueToken(token) },
    select: { expiresAt: true, usedAt: true, revokedAt: true },
  });
  return record && isUsableToken(record, now) ? "valid" : "invalid";
}

export async function consumePasswordReset(
  token: string,
  password: string,
  now = new Date(),
): Promise<boolean> {
  if (!token || token.length > 512) return false;
  const result = await db.$transaction(async (transaction) => {
    const reset = await transaction.passwordResetToken.findUnique({
      where: { tokenHash: hashOpaqueToken(token) },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        revokedAt: true,
        user: { select: { status: true } },
      },
    });
    if (!reset || !isUsableToken(reset, now) || reset.user.status !== UserStatus.ACTIVE) {
      return null;
    }
    const passwordHash = await hashPassword(password);
    const claimed = await transaction.passwordResetToken.updateMany({
      where: {
        id: reset.id,
        usedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return null;

    await transaction.user.update({
      where: { id: reset.userId },
      data: { passwordHash, mustChangePassword: false },
    });
    await transaction.passwordResetToken.updateMany({
      where: {
        userId: reset.userId,
        id: { not: reset.id },
        usedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: now },
    });
    await transaction.session.updateMany({
      where: { userId: reset.userId, revokedAt: null },
      data: { revokedAt: now, revokeReason: "PASSWORD_RESET" },
    });
    return reset.userId;
  });

  if (!result) return false;
  await writeAuditEvent({
    actorUserId: result,
    action: "AUTH_PASSWORD_RESET_COMPLETED",
    entityType: "User",
    entityId: result,
  });
  return true;
}
