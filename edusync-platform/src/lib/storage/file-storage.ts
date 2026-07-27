import "server-only";

import { createHash, randomBytes } from "node:crypto";
import {
  createReadStream,
  type ReadStream,
} from "node:fs";
import {
  access,
  mkdir,
  open,
  rename,
  rm,
  type FileHandle,
} from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import {
  BlobNotFoundError,
  del as deleteBlob,
  get as getBlob,
  head as headBlob,
  put as putBlob,
} from "@vercel/blob";

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
  openReadStream(storageKey: string): Promise<Readable>;
  remove(storageKey: string): Promise<void>;
  exists(storageKey: string): Promise<boolean>;
}

type BlobReadResult = Readonly<{
  statusCode: number;
  stream: ReadableStream<Uint8Array> | null;
}>;

type BlobPrivateOptions = Readonly<
  { access: "private" } & Record<string, unknown>
>;

export type BlobStorageClient = Readonly<{
  put: (
    pathname: string,
    body: Uint8Array,
    options: BlobPrivateOptions,
  ) => Promise<unknown>;
  get: (
    pathname: string,
    options: BlobPrivateOptions,
  ) => Promise<BlobReadResult | null>;
  del: (
    pathname: string,
    options?: Record<string, unknown>,
  ) => Promise<unknown>;
  head: (
    pathname: string,
    options?: Record<string, unknown>,
  ) => Promise<unknown>;
}>;

const defaultBlobClient: BlobStorageClient = {
  put: (pathname, body, options) =>
    putBlob(
      pathname,
      Buffer.from(body),
      options as Parameters<typeof putBlob>[2],
    ),
  get: (pathname, options) =>
    getBlob(pathname, options as Parameters<typeof getBlob>[1]),
  del: (pathname, options) =>
    deleteBlob(pathname, options as Parameters<typeof deleteBlob>[1]),
  head: (pathname, options) =>
    headBlob(pathname, options as Parameters<typeof headBlob>[1]),
};

export class FileSizeLimitError extends Error {
  constructor(readonly maxBytes: number) {
    super(`File exceeds the ${maxBytes}-byte storage limit.`);
    this.name = "FileSizeLimitError";
  }
}

export function contentDisposition(
  disposition: "inline" | "attachment",
  originalName: string,
): string {
  const safeName =
    originalName
      .replace(/[\r\n"\\/]/g, "_")
      .trim()
      .slice(0, 180) || "download";
  const asciiName =
    safeName
      .normalize("NFKD")
      .replace(/[^\x20-\x7e]/g, "")
      .trim() || "download";
  const encodedName = encodeURIComponent(safeName).replace(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`;
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

async function collectContent(
  content: FileContent,
  maxBytes: number,
): Promise<{ bytes: Uint8Array; sizeBytes: number; sha256: string }> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
    throw new RangeError("maxBytes must be a non-negative safe integer.");
  }

  const chunks: Buffer[] = [];
  const hash = createHash("sha256");
  let sizeBytes = 0;

  for await (const chunk of toReadable(content)) {
    const bytes = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk as Uint8Array);
    sizeBytes += bytes.byteLength;
    if (sizeBytes > maxBytes) throw new FileSizeLimitError(maxBytes);
    hash.update(bytes);
    chunks.push(bytes);
  }

  return {
    bytes: new Uint8Array(Buffer.concat(chunks, sizeBytes)),
    sizeBytes,
    sha256: hash.digest("hex"),
  };
}

export class LocalFileStorage implements FileStorage {
  readonly root: string;

  constructor(root = env.FILE_STORAGE_ROOT) {
    if (!root) {
      throw new Error("FILE_STORAGE_ROOT is required for local file storage.");
    }
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

    let temporaryFile: FileHandle | undefined;
    try {
      temporaryFile = await open(temporaryPath, "wx", 0o600);
      await pipeline(
        source,
        limiter,
        temporaryFile.createWriteStream({ autoClose: true }),
      );
      temporaryFile = undefined;
      await rename(temporaryPath, target);
    } catch (error) {
      source.destroy();
      await temporaryFile?.close().catch(() => undefined);
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

function blobPath(storageKey: string): string {
  assertStorageKey(storageKey);
  return `files/${storageKey}`;
}

export class VercelBlobFileStorage implements FileStorage {
  private readonly authOptions: Readonly<{
    token?: string;
    storeId?: string;
  }>;

  constructor(
    options: Readonly<{
      token?: string;
      storeId?: string;
      client?: BlobStorageClient;
    }> = {},
  ) {
    this.authOptions = {
      ...(options.token ? { token: options.token } : {}),
      ...(options.storeId ? { storeId: options.storeId } : {}),
    };
    this.client = options.client ?? defaultBlobClient;
  }

  private readonly client: BlobStorageClient;

  async put({ content, maxBytes }: PutFileInput): Promise<StoredObject> {
    const { bytes, sizeBytes, sha256 } = await collectContent(content, maxBytes);
    const storageKey = randomBytes(32).toString("hex");

    await this.client.put(blobPath(storageKey), bytes, {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/octet-stream",
      ...this.authOptions,
    });

    return { storageKey, sizeBytes, sha256 };
  }

  async openReadStream(storageKey: string): Promise<Readable> {
    const result = await this.client.get(blobPath(storageKey), {
      access: "private",
      ...this.authOptions,
    });
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error("Stored file not found.");
    }
    return Readable.fromWeb(result.stream as never);
  }

  async remove(storageKey: string): Promise<void> {
    await this.client.del(blobPath(storageKey), this.authOptions);
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      await this.client.head(blobPath(storageKey), this.authOptions);
      return true;
    } catch (error) {
      if (error instanceof BlobNotFoundError) return false;
      throw error;
    }
  }
}

export function createFileStorage(
  options: Readonly<{
    blobToken?: string;
    blobStoreId?: string;
    localRoot?: string;
    blobClient?: BlobStorageClient;
  }> = {},
): FileStorage {
  const blobToken = options.blobToken ?? env.BLOB_READ_WRITE_TOKEN;
  const blobStoreId = options.blobStoreId ?? env.BLOB_STORE_ID;

  if (blobToken || blobStoreId) {
    return new VercelBlobFileStorage({
      token: blobToken,
      storeId: blobStoreId,
      client: options.blobClient,
    });
  }

  return new LocalFileStorage(options.localRoot ?? env.FILE_STORAGE_ROOT);
}

export const fileStorage: FileStorage = createFileStorage();
