import { describe, expect, it } from "vitest";

import { buildDemoUserUpsertData } from "./seed-user";

describe("buildDemoUserUpsertData", () => {
  it("khôi phục credential demo khi seed lại dữ liệu đã tồn tại", () => {
    const user = {
      id: "20000000-0000-4000-8000-000000000001",
      email: "platform@edutech.local",
      displayName: "Quản trị nền tảng",
    };

    const result = buildDemoUserUpsertData(user, "new-demo-password-hash");

    expect(result.update).toMatchObject({
      email: user.email,
      displayName: user.displayName,
      passwordHash: "new-demo-password-hash",
      mustChangePassword: false,
      status: "ACTIVE",
      accountKind: "DEMO",
    });
    expect(result.create).toMatchObject({
      ...user,
      normalizedEmail: user.email,
      passwordHash: "new-demo-password-hash",
      mustChangePassword: false,
      status: "ACTIVE",
      accountKind: "DEMO",
    });
  });
});
