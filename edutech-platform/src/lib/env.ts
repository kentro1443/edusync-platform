import path from "node:path";

import { z } from "zod";

const developmentDefaults = {
  APP_URL: "http://localhost:3000",
  AUTH_SECRET: "edutech-local-development-secret-change-me",
  DATABASE_URL:
    "postgresql://edutech:edutech_local@localhost:5432/edutech?schema=public",
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
  REDIS_URL: z.url().refine((value) => value.startsWith("redis://"), {
    message: "REDIS_URL must use the redis:// protocol",
  }),
  FILE_STORAGE_ROOT: z.string().min(1),
  EMAIL_OUTBOX_ROOT: z.string().min(1),
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
  FILE_STORAGE_ROOT: path.resolve(result.data.FILE_STORAGE_ROOT),
  EMAIL_OUTBOX_ROOT: path.resolve(result.data.EMAIL_OUTBOX_ROOT),
} as const;