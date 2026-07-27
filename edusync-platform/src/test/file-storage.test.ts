import { Readable } from "node:stream";

import { describe, expect, it, vi } from "vitest";

import {
  contentDisposition,
  createFileStorage,
  VercelBlobFileStorage,
} from "@/lib/storage/file-storage";

describe("file response headers", () => {
  it("keeps Vietnamese filenames valid and strips header injection characters", () => {
    const header = contentDisposition("inline", 'Hồ sơ "tháng 7"\r\n.pdf');

    expect(header).toContain('inline; filename="Ho so _thang 7___');
    expect(header).toContain("filename*=UTF-8''H%E1%BB%93%20s%C6%A1");
    expect(header).not.toContain("\r");
    expect(header).not.toContain("\n");
  });
});

describe("production file storage", () => {
  it("uses private Vercel Blob and can stream an uploaded PDF", async () => {
    const objects = new Map<string, Uint8Array>();
    const blobClient = {
      put: vi.fn(async (pathname: string, body: Uint8Array) => {
        objects.set(pathname, body);
      }),
      get: vi.fn(async (pathname: string) => {
        const body = objects.get(pathname);
        if (!body) return null;
        return {
          statusCode: 200,
          stream: new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(body);
              controller.close();
            },
          }),
        };
      }),
      del: vi.fn(async (pathname: string) => {
        objects.delete(pathname);
      }),
      head: vi.fn(async (pathname: string) => {
        if (!objects.has(pathname)) throw new Error("not found");
        return { pathname };
      }),
    };
    const storage = createFileStorage({
      blobToken: "test-blob-token",
      localRoot: "/tmp/unused-edusync-storage",
      blobClient,
    });
    const pdf = new Uint8Array(Buffer.from("%PDF-1.7\nEduSync"));

    expect(storage).toBeInstanceOf(VercelBlobFileStorage);
    const stored = await storage.put({ content: pdf, maxBytes: pdf.byteLength });
    const stream = await storage.openReadStream(stored.storageKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream as Readable) chunks.push(Buffer.from(chunk));

    expect(Buffer.concat(chunks)).toEqual(Buffer.from(pdf));
    expect(blobClient.put).toHaveBeenCalledWith(
      `files/${stored.storageKey}`,
      pdf,
      expect.objectContaining({
        access: "private",
        token: "test-blob-token",
      }),
    );
  });
});
