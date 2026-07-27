import "server-only";

import {
  UserStatus,
  type UserAccountKind,
} from "@/generated/prisma/enums";
import { isDevOperatorAccount } from "@/lib/auth/dev-mode";
import {
  hashPassword,
  normalizeEmail,
  passwordNeedsRehash,
  verifyPassword,
} from "@/lib/auth/password";
import { db } from "@/lib/db";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(1_024),
});

const dummyPasswordHash = hashPassword(
  "EduTech timing-equivalence password",
);

export type CredentialInput = Readonly<{
  email: string;
  password: string;
}>;

export type CredentialUser = Readonly<{
  id: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
  accountKind: UserAccountKind;
}>;

export async function authenticateCredentials(
  input: CredentialInput,
): Promise<CredentialUser | null> {
  const parsed = credentialsSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  const normalizedEmail = normalizeEmail(parsed.data.email);
  const user = await db.user.findUnique({
    where: { normalizedEmail },
    select: {
      id: true,
      email: true,
      displayName: true,
      passwordHash: true,
      mustChangePassword: true,
      status: true,
      accountKind: true,
    },
  });

  if (!user) {
    await verifyPassword(await dummyPasswordHash, parsed.data.password);
    return null;
  }

  const passwordIsValid = await verifyPassword(
    user.passwordHash,
    parsed.data.password,
  );

  if (
    !passwordIsValid ||
    user.status !== UserStatus.ACTIVE ||
    (user.accountKind === "DEV_OPERATOR" &&
      !isDevOperatorAccount(user.accountKind))
  ) {
    return null;
  }

  const replacementPasswordHash = passwordNeedsRehash(
    user.passwordHash,
  )
    ? await hashPassword(parsed.data.password)
    : undefined;

  await db.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      ...(replacementPasswordHash
        ? { passwordHash: replacementPasswordHash }
        : {}),
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.displayName,
    mustChangePassword: user.mustChangePassword,
    accountKind: user.accountKind,
  };
}
