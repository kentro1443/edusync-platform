import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const version = "v1";

function deriveKey(secret: string): Buffer {
  if (secret.length < 32) {
    throw new Error("Mentoring note encryption secret must be at least 32 characters.");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptMentoringNote(
  body: string,
  secret: string,
  initializationVector = randomBytes(12),
): string {
  if (!body.trim()) throw new Error("Mentoring note body cannot be empty.");
  if (initializationVector.byteLength !== 12) {
    throw new Error("Mentoring note IV must contain 12 bytes.");
  }
  const cipher = createCipheriv(
    "aes-256-gcm",
    deriveKey(secret),
    initializationVector,
  );
  const ciphertext = Buffer.concat([
    cipher.update(body, "utf8"),
    cipher.final(),
  ]);
  const authenticationTag = cipher.getAuthTag();
  return [
    version,
    initializationVector.toString("base64url"),
    authenticationTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptMentoringNote(
  encryptedBody: string,
  secret: string,
): string {
  const [storedVersion, encodedIv, encodedTag, encodedCiphertext, extra] =
    encryptedBody.split(".");
  if (
    storedVersion !== version ||
    !encodedIv ||
    !encodedTag ||
    !encodedCiphertext ||
    extra
  ) {
    throw new Error("Mentoring note ciphertext has an invalid format.");
  }
  const initializationVector = Buffer.from(encodedIv, "base64url");
  const authenticationTag = Buffer.from(encodedTag, "base64url");
  const ciphertext = Buffer.from(encodedCiphertext, "base64url");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    deriveKey(secret),
    initializationVector,
  );
  decipher.setAuthTag(authenticationTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
