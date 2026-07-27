import "dotenv/config";

import { randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";

const devOperatorEmail = "dev@edusync.local";
const keychainService = "edusync-platform-production-dev";

function generatePassword(): string {
  return `EdT!${randomBytes(24).toString("base64url")}9a`;
}

function savePasswordToKeychain(password: string): void {
  if (process.platform !== "darwin") {
    throw new Error(
      "Automatic credential storage requires macOS Keychain.",
    );
  }

  const result = spawnSync(
    "security",
    [
      "add-generic-password",
      "-U",
      "-a",
      devOperatorEmail,
      "-s",
      keychainService,
      "-w",
      password,
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "ignore", "pipe"],
    },
  );

  if (result.status !== 0) {
    throw new Error(
      result.stderr.trim() || "Could not save the password to Keychain.",
    );
  }
}

async function main(): Promise<void> {
  const user = await db.user.findUnique({
    where: { normalizedEmail: devOperatorEmail },
    select: { id: true, accountKind: true },
  });

  if (!user || user.accountKind !== "DEV_OPERATOR") {
    throw new Error("The production developer account was not found.");
  }

  const password = generatePassword();
  const passwordHash = await hashPassword(password);

  savePasswordToKeychain(password);

  const now = new Date();
  const [, sessions] = await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        lastLoginAt: null,
      },
    }),
    db.session.updateMany({
      where: {
        OR: [{ userId: user.id }, { operatorUserId: user.id }],
        revokedAt: null,
      },
      data: {
        revokedAt: now,
        revokeReason: "DEV_PASSWORD_ROTATED",
      },
    }),
    db.passwordResetToken.updateMany({
      where: { userId: user.id, revokedAt: null, usedAt: null },
      data: { revokedAt: now },
    }),
    db.auditEvent.create({
      data: {
        actorType: "SYSTEM",
        action: "DEV_OPERATOR_PASSWORD_ROTATED",
        entityType: "User",
        entityId: user.id,
        requestId: randomUUID(),
      },
    }),
  ]);

  console.log(
    `Production developer password rotated; ${sessions.count} session(s) revoked.`,
  );
  console.log(
    `Credential saved in macOS Keychain service "${keychainService}" for "${devOperatorEmail}".`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error
        ? error.message
        : "Production developer password rotation failed.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
