import "server-only";

import {
  argon2id,
  hash as argon2Hash,
  needsRehash,
  verify as argon2Verify,
} from "argon2";

export const passwordHashOptions = {
  type: argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
} as const;

export function normalizeEmail(email: string): string {
  return email.trim().toLocaleLowerCase("en-US");
}

export async function hashPassword(password: string): Promise<string> {
  return argon2Hash(password, passwordHashOptions);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2Verify(passwordHash, password);
  } catch {
    return false;
  }
}

export function passwordNeedsRehash(passwordHash: string): boolean {
  try {
    return needsRehash(passwordHash, passwordHashOptions);
  } catch {
    return true;
  }
}