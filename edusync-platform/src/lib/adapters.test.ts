import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  FileSizeLimitError,
  LocalFileStorage,
} from "@/lib/storage/file-storage";
import { LocalEmailDelivery } from "@/lib/notifications/email-delivery";

const temporaryRoots: string[] = [];

async function createTemporaryRoot(prefix: string): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), prefix));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) =>
      rm(root, { recursive: true, force: true }),
    ),
  );
});

describe("LocalFileStorage", () => {
  it("stores bytes under an opaque key and reports content metadata", async () => {
    const root = await createTemporaryRoot("edusync-files-");
    const storage = new LocalFileStorage(root);
    const content = Buffer.from("student submission");

    const stored = await storage.put({
      content,
      maxBytes: content.byteLength,
    });

    expect(stored.storageKey).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.sizeBytes).toBe(content.byteLength);
    expect(stored.sha256).toBe(
      createHash("sha256").update(content).digest("hex"),
    );
    expect(await storage.exists(stored.storageKey)).toBe(true);

    const stream = await storage.openReadStream(stored.storageKey);
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    expect(Buffer.concat(chunks)).toEqual(content);
  });

  it("rejects content over the limit without retaining an object", async () => {
    const root = await createTemporaryRoot("edusync-files-");
    const storage = new LocalFileStorage(root);

    await expect(
      storage.put({
        content: Buffer.from("too large"),
        maxBytes: 3,
      }),
    ).rejects.toBeInstanceOf(FileSizeLimitError);

    const entries = await import("node:fs/promises").then(({ readdir }) =>
      readdir(root, { recursive: true }),
    );
    expect(entries.some((entry) => entry.endsWith(".tmp"))).toBe(false);
  });

  it("rejects path-like storage keys", async () => {
    const root = await createTemporaryRoot("edusync-files-");
    const storage = new LocalFileStorage(root);

    await expect(storage.exists("../../etc/passwd")).rejects.toThrow(
      "Invalid opaque storage key.",
    );
  });

  it("removes stored content idempotently", async () => {
    const root = await createTemporaryRoot("edusync-files-");
    const storage = new LocalFileStorage(root);
    const stored = await storage.put({
      content: Buffer.from("temporary"),
      maxBytes: 100,
    });

    await storage.remove(stored.storageKey);
    await storage.remove(stored.storageKey);

    expect(await storage.exists(stored.storageKey)).toBe(false);
  });
});

describe("LocalEmailDelivery", () => {
  it("persists and reads a rendered email by opaque outbox ID", async () => {
    const root = await createTemporaryRoot("edusync-email-");
    const delivery = new LocalEmailDelivery(root);

    await delivery.deliver({
      outboxId: "outbox_123",
      to: "student@example.test",
      subject: "Appointment confirmed",
      text: "Your appointment is confirmed.",
      html: "<p>Your appointment is confirmed.</p>",
    });

    const delivered = await delivery.get("outbox_123");

    expect(delivered).toMatchObject({
      outboxId: "outbox_123",
      to: "student@example.test",
      subject: "Appointment confirmed",
      text: "Your appointment is confirmed.",
    });
    expect(new Date(delivered!.deliveredAt).toISOString()).toBe(
      delivered!.deliveredAt,
    );
  });

  it("keeps the first delivery when an outbox ID is retried", async () => {
    const root = await createTemporaryRoot("edusync-email-");
    const delivery = new LocalEmailDelivery(root);

    await delivery.deliver({
      outboxId: "retry-safe",
      to: "first@example.test",
      subject: "Original",
      text: "Original body",
    });
    const first = await delivery.get("retry-safe");

    await delivery.deliver({
      outboxId: "retry-safe",
      to: "second@example.test",
      subject: "Replacement",
      text: "Replacement body",
    });

    expect(await delivery.get("retry-safe")).toEqual(first);
  });

  it("rejects path traversal and header injection inputs", async () => {
    const root = await createTemporaryRoot("edusync-email-");
    const delivery = new LocalEmailDelivery(root);

    await expect(delivery.get("../message")).rejects.toThrow(
      "Invalid opaque email outbox ID.",
    );
    await expect(
      delivery.deliver({
        outboxId: "safe-id",
        to: "student@example.test\r\nBcc: attacker@example.test",
        subject: "Notice",
        text: "Body",
      }),
    ).rejects.toThrow("Invalid email recipient.");
  });

  it("writes private JSON files rather than recipient-derived paths", async () => {
    const root = await createTemporaryRoot("edusync-email-");
    const delivery = new LocalEmailDelivery(root);

    await delivery.deliver({
      outboxId: "private-file",
      to: "student+private@example.test",
      subject: "Private",
      text: "Sensitive content",
    });

    const target = path.join(root, "pr", "private-file.json");
    const serialized = await readFile(target, "utf8");

    expect(JSON.parse(serialized)).toMatchObject({
      outboxId: "private-file",
      to: "student+private@example.test",
    });
    expect(target).not.toContain("student+private@example.test");
  });
});