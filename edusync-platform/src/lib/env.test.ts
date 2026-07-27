import { afterEach, describe, expect, it, vi } from "vitest";

const productionEnv = {
  NODE_ENV: "production",
  APP_URL: "https://edusync.example.com",
  AUTH_SECRET: "a-secure-production-secret-with-at-least-32-characters",
  DATABASE_URL: "postgresql://user:password@example.com:5432/edusync",
  FILE_STORAGE_ROOT: "/tmp/edusync-storage",
  EMAIL_OUTBOX_ROOT: "/tmp/edusync-email-outbox",
} as const;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("server environment", () => {
  it("accepts a TLS Redis URL in production", async () => {
    vi.stubEnv("NODE_ENV", productionEnv.NODE_ENV);
    vi.stubEnv("APP_URL", productionEnv.APP_URL);
    vi.stubEnv("AUTH_SECRET", productionEnv.AUTH_SECRET);
    vi.stubEnv("DATABASE_URL", productionEnv.DATABASE_URL);
    vi.stubEnv(
      "REDIS_URL",
      "rediss://default:password@example.redis.provider:6380",
    );
    vi.stubEnv("FILE_STORAGE_ROOT", productionEnv.FILE_STORAGE_ROOT);
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "vercel_blob_rw_test_token");
    vi.stubEnv("EMAIL_OUTBOX_ROOT", productionEnv.EMAIL_OUTBOX_ROOT);

    const { env } = await import("@/lib/env");

    expect(env.REDIS_URL).toMatch(/^rediss:\/\//);
  });

  it("rejects production without durable private file storage", async () => {
    vi.stubEnv("NODE_ENV", productionEnv.NODE_ENV);
    vi.stubEnv("APP_URL", productionEnv.APP_URL);
    vi.stubEnv("AUTH_SECRET", productionEnv.AUTH_SECRET);
    vi.stubEnv("DATABASE_URL", productionEnv.DATABASE_URL);
    vi.stubEnv("REDIS_URL", "rediss://default:password@example.redis.provider:6380");
    vi.stubEnv("FILE_STORAGE_ROOT", productionEnv.FILE_STORAGE_ROOT);
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    vi.stubEnv("BLOB_STORE_ID", "");
    vi.stubEnv("EMAIL_OUTBOX_ROOT", productionEnv.EMAIL_OUTBOX_ROOT);

    await expect(import("@/lib/env")).rejects.toThrow(
      "Production requires a private Vercel Blob store",
    );
  });
});
