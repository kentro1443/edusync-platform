import "server-only";

import { randomBytes } from "node:crypto";
import { constants } from "node:fs";
import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/env";

const outboxIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;

export type RenderedEmail = Readonly<{
  outboxId: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}>;

export type DeliveredEmail = RenderedEmail &
  Readonly<{
    deliveredAt: string;
  }>;

export interface EmailDelivery {
  deliver(email: RenderedEmail): Promise<void>;
  get(outboxId: string): Promise<DeliveredEmail | null>;
}

function assertOutboxId(outboxId: string): void {
  if (!outboxIdPattern.test(outboxId)) {
    throw new Error("Invalid opaque email outbox ID.");
  }
}

function getDeliveryPath(root: string, outboxId: string): string {
  assertOutboxId(outboxId);

  const target = path.resolve(
    root,
    outboxId.slice(0, 2).padEnd(2, "_"),
    `${outboxId}.json`,
  );
  const relative = path.relative(root, target);

  if (
    relative === "" ||
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new Error("Email outbox path escapes the configured root.");
  }

  return target;
}

function validateEmail(email: RenderedEmail): void {
  assertOutboxId(email.outboxId);

  if (
    email.to.length === 0 ||
    email.to.length > 320 ||
    email.to.includes("\r") ||
    email.to.includes("\n")
  ) {
    throw new Error("Invalid email recipient.");
  }

  if (
    email.subject.length === 0 ||
    email.subject.length > 998 ||
    email.subject.includes("\r") ||
    email.subject.includes("\n")
  ) {
    throw new Error("Invalid email subject.");
  }
}

export class LocalEmailDelivery implements EmailDelivery {
  readonly root: string;

  constructor(root = env.EMAIL_OUTBOX_ROOT) {
    this.root = path.resolve(root);
  }

  async deliver(email: RenderedEmail): Promise<void> {
    validateEmail(email);

    const target = getDeliveryPath(this.root, email.outboxId);
    const directory = path.dirname(target);
    const temporaryPath = path.join(
      directory,
      `.${email.outboxId}.${randomBytes(8).toString("hex")}.tmp`,
    );

    await mkdir(directory, {
      recursive: true,
      mode: 0o700,
    });

    try {
      await access(target, constants.F_OK);
      return;
    } catch {
      // The outbox ID has not been delivered yet.
    }

    const payload: DeliveredEmail = {
      ...email,
      deliveredAt: new Date().toISOString(),
    };

    try {
      await writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600,
      });

      try {
        await access(target, constants.F_OK);
      } catch {
        await rename(temporaryPath, target);
        return;
      }

      await rm(temporaryPath, { force: true });
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw error;
    }
  }

  async get(outboxId: string): Promise<DeliveredEmail | null> {
    const target = getDeliveryPath(this.root, outboxId);

    try {
      const payload = await readFile(target, "utf8");
      return JSON.parse(payload) as DeliveredEmail;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return null;
      }

      throw error;
    }
  }
}

export const emailDelivery: EmailDelivery = new LocalEmailDelivery();