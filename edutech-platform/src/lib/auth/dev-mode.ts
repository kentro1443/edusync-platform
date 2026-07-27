import type { UserAccountKind } from "@/generated/prisma/enums";

export function isDevModeEnabled(
  nodeEnv = process.env.NODE_ENV,
): boolean {
  return nodeEnv === "development" || nodeEnv === "test";
}

export function isDevOperatorAccount(
  accountKind: UserAccountKind,
  nodeEnv = process.env.NODE_ENV,
): boolean {
  return accountKind === "DEV_OPERATOR" && isDevModeEnabled(nodeEnv);
}
