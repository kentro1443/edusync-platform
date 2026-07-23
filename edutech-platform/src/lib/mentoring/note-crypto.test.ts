import { describe, expect, it } from "vitest";

import {
  decryptMentoringNote,
  encryptMentoringNote,
} from "@/lib/mentoring/note-crypto";

describe("mentoring note encryption", () => {
  const secret = "phase-3-test-secret-with-at-least-32-characters";

  it("mã hóa nội dung và giải mã đúng bằng cùng secret", () => {
    const encrypted = encryptMentoringNote(
      "Nội dung tư vấn riêng tư",
      secret,
      Buffer.alloc(12, 7),
    );

    expect(encrypted).not.toContain("Nội dung tư vấn riêng tư");
    expect(decryptMentoringNote(encrypted, secret)).toBe(
      "Nội dung tư vấn riêng tư",
    );
  });

  it("không giải mã được khi ciphertext bị sửa", () => {
    const encrypted = encryptMentoringNote(
      "Nội dung nguyên vẹn",
      secret,
      Buffer.alloc(12, 5),
    );
    const tampered = `${encrypted.slice(0, -2)}AA`;

    expect(() => decryptMentoringNote(tampered, secret)).toThrow();
  });
});
