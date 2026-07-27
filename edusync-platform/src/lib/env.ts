import path from "node:path";

import { z } from "zod";

const developmentDefaults = {
  APP_URL: "http://localhost:3000",
  AUTH_SECRET: "edusync-local-development-secret-change-me",
  DATABASE_URL:
    "postgresql://edusync:edusync_local@localhost:5432/edusync?schema=public",
  REDIS_URL: "redis://localhost:6379",
  FILE_STORAGE_ROOT: "./storage",
  EMAIL_OUTBOX_ROOT: "./email-outbox",
} as const;

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_URL: z.url(),
  AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.url().refine((value) => value.startsWith("postgresql://"), {
    message: "DATABASE_URL must use the postgresql:// protocol",
  }),
  REDIS_URL: z
    .url()
    .refine(
      (value) => value.startsWith("redis://") || value.startsWith("rediss://"),
      {
        message: "REDIS_URL must use the redis:// or rediss:// protocol",
      },
    ),
  FILE_STORAGE_ROOT: z.string().min(1).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
  BLOB_STORE_ID: z.string().min(1).optional(),
  EMAIL_OUTBOX_ROOT: z.string().min(1),
}).superRefine((value, context) => {
  if (
    value.NODE_ENV === "production" &&
    !value.BLOB_READ_WRITE_TOKEN &&
    !value.BLOB_STORE_ID
  ) {
    context.addIssue({
      code: "custom",
      path: ["BLOB_READ_WRITE_TOKEN"],
      message:
        "Production requires a private Vercel Blob store (BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID).",
    });
  }
});

const nodeEnv = process.env.NODE_ENV ?? "development";
const useDevelopmentDefaults = nodeEnv !== "production";

const result = envSchema.safeParse({
  NODE_ENV: nodeEnv,
  APP_URL:
    process.env.APP_URL ??
    (useDevelopmentDefaults ? developmentDefaults.APP_URL : undefined),
  AUTH_SECRET:
    process.env.AUTH_SECRET ??
    (useDevelopmentDefaults ? developmentDefaults.AUTH_SECRET : undefined),
  DATABASE_URL:
    process.env.DATABASE_URL ??
    (useDevelopmentDefaults ? developmentDefaults.DATABASE_URL : undefined),
  REDIS_URL:
    process.env.REDIS_URL ??
    (useDevelopmentDefaults ? developmentDefaults.REDIS_URL : undefined),
  FILE_STORAGE_ROOT:
    process.env.FILE_STORAGE_ROOT ??
    (useDevelopmentDefaults
      ? developmentDefaults.FILE_STORAGE_ROOT
      : undefined),
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  BLOB_STORE_ID: process.env.BLOB_STORE_ID,
  EMAIL_OUTBOX_ROOT:
    process.env.EMAIL_OUTBOX_ROOT ??
    (useDevelopmentDefaults
      ? developmentDefaults.EMAIL_OUTBOX_ROOT
      : undefined),
});

if (!result.success) {
  throw new Error(
    `Invalid server environment:\n${z.prettifyError(result.error)}`,
  );
}

export const env = {
  ...result.data,
  FILE_STORAGE_ROOT: result.data.FILE_STORAGE_ROOT
    ? path.resolve(result.data.FILE_STORAGE_ROOT)
    : undefined,
  EMAIL_OUTBOX_ROOT: path.resolve(result.data.EMAIL_OUTBOX_ROOT),
} as const;
