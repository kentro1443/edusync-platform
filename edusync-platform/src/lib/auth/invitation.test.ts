import { describe, expect, it } from "vitest";

import {
  getInvitationLifecycle,
  parseInvitationInput,
} from "@/lib/auth/invitation";

describe("invitation lifecycle", () => {
  it("normalizes email and removes duplicate valid roles", () => {
    expect(
      parseInvitationInput({
        email: " GIAOVIEN@TRUONG.EDU.VN ",
        roles: ["TEACHER_STAFF", "TEACHER_STAFF", "APPROVER_REVIEWER"],
      }),
    ).toEqual({
      success: true,
      data: {
        email: "giaovien@truong.edu.vn",
        roles: ["TEACHER_STAFF", "APPROVER_REVIEWER"],
      },
    });
  });

  it("rejects empty or invalid role hints", () => {
    expect(parseInvitationInput({ email: "sai", roles: ["ROOT"] })).toEqual({
      success: false,
      error: "invalid",
    });
  });

  it("distinguishes pending, expired, revoked and accepted invitations", () => {
    const now = new Date("2026-07-23T02:00:00.000Z");
    expect(getInvitationLifecycle({ expiresAt: new Date("2026-07-24T00:00:00.000Z"), acceptedAt: null, revokedAt: null }, now)).toBe("pending");
    expect(getInvitationLifecycle({ expiresAt: now, acceptedAt: null, revokedAt: null }, now)).toBe("expired");
    expect(getInvitationLifecycle({ expiresAt: new Date("2026-07-24T00:00:00.000Z"), acceptedAt: null, revokedAt: now }, now)).toBe("revoked");
    expect(getInvitationLifecycle({ expiresAt: new Date("2026-07-24T00:00:00.000Z"), acceptedAt: now, revokedAt: null }, now)).toBe("accepted");
  });
});
