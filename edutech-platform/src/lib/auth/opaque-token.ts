import { createHash, randomBytes } from "node:crypto";

export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isUsableToken(
  token: {
    expiresAt: Date;
    usedAt: Date | null;
    revokedAt: Date | null;
  },
  now = new Date(),
): boolean {
  return (
    token.usedAt === null &&
    token.revokedAt === null &&
    token.expiresAt.getTime() > now.getTime()
  );
}
