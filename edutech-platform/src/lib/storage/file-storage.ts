import "server-only";

import { createHash, randomBytes } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  type ReadStream,
} from "node:fs";
import {
  access,
  mkdir,
  rename,
  rm,
} from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { env } from "@/lib/env";

const storageKeyPattern = /^[a-f0-9]{64}$/;

export type FileContent =
  | Uint8Array
  | Readable
  | AsyncIterable<Uint8Array>;

export type PutFileInput = Readonly<{
  content: FileContent;
  maxBytes: number;
}>;

export type StoredObject = Readonly<{
  storageKey: string;
  sizeBytes: number;
  sha256: string;
}>;

export interface FileStorage {
  put(input: PutFileInput): Promise<StoredObject>;
  openReadStream(storageKey: string): Promise<ReadStream>;
  remove(storageKey: string): Promise<void>;
  exists(storageKey: string): Promise<boolean>;
}

export class FileSizeLimitError extends Error {
  constructor(readonly maxBytes: number) {
    super(`File exceeds the ${maxBytes}-byte storage limit.`);
    this.name = "FileSizeLimitError";
  }
}

function assertStorageKey(storageKey: string): void {
  if (!storageKeyPattern.test(storageKey)) {
    throw new Error("Invalid opaque storage key.");
  }
}

function getStoragePath(root: string, storageKey: string): string {
  assertStorageKey(storageKey);

  const target = path.resolve(
    root,
    storageKey.slice(0, 2),
    storageKey.slice(2, 4),
    storageKey,
  );
  const relative = path.relative(root, target);

  if (
    relative === "" ||
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new Error("Storage path escapes the configured root.");
  }

  return target;
}

function toReadable(content: FileContent): Readable {
  if (content instanceof Uint8Array) {
    return Readable.from([content]);
  }

  if (content instanceof Readable) {
    return content;
  }

  return Readable.from(content);
}

export class LocalFileStorage implements FileStorage {
  readonly root: string;

  constructor(root = env.FILE_STORAGE_ROOT) {
    this.root = path.resolve(root);
  }

  async put({
    content,
    maxBytes,
  }: PutFileInput): Promise<StoredObject> {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
      throw new RangeError("maxBytes must be a non-negative safe integer.");
    }

    const storageKey = randomBytes(32).toString("hex");
    const target = getStoragePath(this.root, storageKey);
    const directory = path.dirname(target);
    const temporaryPath = path.join(
      directory,
      `.${storageKey}.${randomBytes(8).toString("hex")}.tmp`,
    );
    const hash = createHash("sha256");
    let sizeBytes = 0;

    await mkdir(directory, {
      recursive: true,
      mode: 0o700,
    });

    const source = toReadable(content);
    const limiter = async function* (
      chunks: AsyncIterable<unknown>,
    ): AsyncGenerator<Buffer> {
      for await (const chunk of chunks) {
        const bytes = Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(chunk as Uint8Array);
        sizeBytes += bytes.byteLength;

        if (sizeBytes > maxBytes) {
          throw new FileSizeLimitError(maxBytes);
        }

        hash.update(bytes);
        yield bytes;
      }
    };

    try {
      await pipeline(
        source,
        limiter,
        createWriteStream(temporaryPath, {
          flags: "wx",
          mode: 0o600,
        }),
      );
      await rename(temporaryPath, target);
    } catch (error) {
      source.destroy();
      await rm(temporaryPath, { force: true });
      throw error;
    }

    return {
      storageKey,
      sizeBytes,
      sha256: hash.digest("hex"),
    };
  }

  async openReadStream(storageKey: string): Promise<ReadStream> {
    const target = getStoragePath(this.root, storageKey);
    await access(target);
    return createReadStream(target);
  }

  async remove(storageKey: string): Promise<void> {
    const target = getStoragePath(this.root, storageKey);
    await rm(target, { force: true });
  }

  async exists(storageKey: string): Promise<boolean> {
    const target = getStoragePath(this.root, storageKey);

    try {
      await access(target);
      return true;
    } catch {
      return false;
    }
  }
}

export const fileStorage: FileStorage = new LocalFileStorage();