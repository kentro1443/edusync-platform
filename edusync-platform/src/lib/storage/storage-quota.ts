import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export class StorageQuotaExceededError extends Error {}

export function assertWithinStorageQuota(
  usedBytes: bigint,
  incomingBytes: bigint,
  quotaBytes: bigint,
) {
  if (usedBytes + incomingBytes > quotaBytes) {
    throw new StorageQuotaExceededError(
      "Dung lượng trường đã đạt giới hạn. Hãy xóa tệp không còn dùng hoặc tăng hạn mức.",
    );
  }
}

export async function assertSchoolStorageQuota(
  transaction: Prisma.TransactionClient,
  schoolId: string,
  incomingBytes: bigint,
) {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"storage-quota:" + schoolId}))`;
  const [school, usage] = await Promise.all([
    transaction.school.findUniqueOrThrow({
      where: { id: schoolId },
      select: { storageQuotaBytes: true },
    }),
    transaction.storedFile.aggregate({
      where: { schoolId, status: "AVAILABLE" },
      _sum: { sizeBytes: true },
    }),
  ]);
  assertWithinStorageQuota(
    usage._sum.sizeBytes ?? BigInt(0),
    incomingBytes,
    school.storageQuotaBytes,
  );
}

export type StorageQuotaSummary = Readonly<{
  usedBytes: bigint;
  quotaBytes: bigint;
  usedRatio: number;
}>;

/** Ratio of used to quota bytes, clamped to [0, 1] for progress-bar rendering. */
export function computeUsedRatio(usedBytes: bigint, quotaBytes: bigint): number {
  if (quotaBytes <= BigInt(0)) return 0;
  const ratio = Number(usedBytes) / Number(quotaBytes);
  return Math.max(0, Math.min(1, ratio));
}

/** Current storage usage vs quota for a school, for admin display. */
export async function getSchoolStorageQuotaUsage(schoolId: string): Promise<StorageQuotaSummary> {
  const [school, usage] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { storageQuotaBytes: true } }),
    db.storedFile.aggregate({ where: { schoolId, status: "AVAILABLE" }, _sum: { sizeBytes: true } }),
  ]);
  const usedBytes = usage._sum.sizeBytes ?? BigInt(0);
  return {
    usedBytes,
    quotaBytes: school.storageQuotaBytes,
    usedRatio: computeUsedRatio(usedBytes, school.storageQuotaBytes),
  };
}
