import type { UserAccountKind } from "@/generated/prisma/enums";

export function isDevModeEnabled(
  nodeEnv = process.env.NODE_ENV,
  productionEnabled = process.env.ENABLE_PRODUCTION_DEV_MODE,
): boolean {
  return (
    nodeEnv === "development" ||
    nodeEnv === "test" ||
    (nodeEnv === "production" && productionEnabled === "true")
  );
}

export function isDevOperatorAccount(
  accountKind: UserAccountKind,
  nodeEnv = process.env.NODE_ENV,
  productionEnabled = process.env.ENABLE_PRODUCTION_DEV_MODE,
): boolean {
  return (
    accountKind === "DEV_OPERATOR" &&
    isDevModeEnabled(nodeEnv, productionEnabled)
  );
}
