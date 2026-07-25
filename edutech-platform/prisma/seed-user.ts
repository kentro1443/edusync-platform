export type DemoUserSeedInput = {
  id: string;
  email: string;
  displayName: string;
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
      ...credentialState,
      lastLoginAt: null,
    },
    create: {
      ...user,
      normalizedEmail: user.email,
      ...credentialState,
    },
  };
}
