export type DemoUserSeedInput = {
  id: string;
  email: string;
  displayName: string;
  accountKind?: "DEMO" | "DEV_OPERATOR";
};

export function buildDemoUserUpsertData(
  user: DemoUserSeedInput,
  passwordHash: string,
) {
  const credentialState = {
    passwordHash,
    mustChangePassword: false,
    status: "ACTIVE" as const,
  };

  return {
    update: {
      email: user.email,
      normalizedEmail: user.email,
      displayName: user.displayName,
      accountKind: user.accountKind ?? "DEMO",
      ...credentialState,
      lastLoginAt: null,
    },
    create: {
      ...user,
      normalizedEmail: user.email,
      accountKind: user.accountKind ?? "DEMO",
      ...credentialState,
    },
  };
}
