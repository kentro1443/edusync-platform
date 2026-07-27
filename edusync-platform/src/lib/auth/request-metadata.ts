import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";

import { env } from "@/lib/env";

function hashIpAddress(value: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(value, "utf8").digest("hex");
}

export async function getRequestMetadata(): Promise<{
  userAgent: string | null;
  ipHash: string | null;
}> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwarded || requestHeaders.get("x-real-ip")?.trim() || null;
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 512) || null;
  return {
    userAgent,
    ipHash: ipAddress ? hashIpAddress(ipAddress) : null,
  };
}
