import "server-only";

import { createHmac } from "node:crypto";

import { db } from "@/lib/db";
import { env } from "@/lib/env";

export type RateLimitConfig = Readonly<{
  maxAttempts: number;
  windowMs: number;
  blockMs: number;
}>;

type RateLimitRecord = Readonly<{
  attempts: number;
  windowStart: Date;
  blockedUntil: Date | null;
}>;

export type RateLimitDecision = Readonly<{
  allowed: boolean;
  attempts: number;
  windowStart: Date;
  blockedUntil: Date | null;
  retryAfterSeconds?: number;
}>;

export const authRateLimits = {
  login: { maxAttempts: 5, windowMs: 15 * 60_000, blockMs: 15 * 60_000 },
  forgotPassword: { maxAttempts: 3, windowMs: 60 * 60_000, blockMs: 60 * 60_000 },
  invitation: { maxAttempts: 10, windowMs: 60 * 60_000, blockMs: 60 * 60_000 },
} as const satisfies Record<string, RateLimitConfig>;

export function evaluateRateLimit(
  record: RateLimitRecord | null,
  config: RateLimitConfig,
  now = new Date(),
): RateLimitDecision {
  if (!record) {
    return { allowed: true, attempts: 0, windowStart: now, blockedUntil: null };
  }

  if (record.blockedUntil && record.blockedUntil.getTime() > now.getTime()) {
    return {
      allowed: false,
      ...record,
      retryAfterSeconds: Math.ceil(
        (record.blockedUntil.getTime() - now.getTime()) / 1_000,
      ),
    };
  }

  if (
    record.blockedUntil ||
    now.getTime() - record.windowStart.getTime() >= config.windowMs
  ) {
    return { allowed: true, attempts: 0, windowStart: now, blockedUntil: null };
  }

  return { allowed: record.attempts < config.maxAttempts, ...record };
}

function getRateLimitKey(action: string, subject: string): string {
  return createHmac("sha256", env.AUTH_SECRET)
    .update(`${action}:${subject.trim().toLocaleLowerCase("en-US")}`, "utf8")
    .digest("hex");
}

export async function checkAuthRateLimit(
  action: string,
  subject: string,
  config: RateLimitConfig,
  now = new Date(),
): Promise<RateLimitDecision> {
  const record = await db.authRateLimit.findUnique({
    where: { keyHash: getRateLimitKey(action, subject) },
    select: { attempts: true, windowStart: true, blockedUntil: true },
  });
  return evaluateRateLimit(record, config, now);
}

export async function recordAuthAttempt(
  action: string,
  subject: string,
  config: RateLimitConfig,
  now = new Date(),
): Promise<RateLimitDecision> {
  const keyHash = getRateLimitKey(action, subject);
  return db.$transaction(async (transaction) => {
    await transaction.$queryRaw<Array<{ locked: string }>>`
      SELECT pg_advisory_xact_lock(hashtextextended(${keyHash}, 0))::text AS locked
    `;
    const existing = await transaction.authRateLimit.findUnique({
      where: { keyHash },
      select: { attempts: true, windowStart: true, blockedUntil: true },
    });
    const current = evaluateRateLimit(existing, config, now);
    if (!current.allowed) return current;

    const attempts = current.attempts + 1;
    const blockedUntil =
      attempts >= config.maxAttempts
        ? new Date(now.getTime() + config.blockMs)
        : null;
    await transaction.authRateLimit.upsert({
      where: { keyHash },
      create: {
        keyHash,
        action,
        attempts,
        windowStart: current.windowStart,
        blockedUntil,
      },
      update: {
        action,
        attempts,
        windowStart: current.windowStart,
        blockedUntil,
      },
    });
    return {
      allowed: blockedUntil === null,
      attempts,
      windowStart: current.windowStart,
      blockedUntil,
      ...(blockedUntil
        ? { retryAfterSeconds: Math.ceil(config.blockMs / 1_000) }
        : {}),
    };
  });
}

export async function clearAuthRateLimit(
  action: string,
  subject: string,
): Promise<void> {
  await db.authRateLimit.deleteMany({
    where: { keyHash: getRateLimitKey(action, subject) },
  });
}
