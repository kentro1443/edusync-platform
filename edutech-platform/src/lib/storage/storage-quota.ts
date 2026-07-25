import type { Prisma } from "@/generated/prisma/client";

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
