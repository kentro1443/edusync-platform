import { NextResponse, type NextRequest } from "next/server";

import {
  checkAuthRateLimit,
  recordAuthAttempt,
} from "@/lib/auth/rate-limit";

const mutationLimit = {
  maxAttempts: 180,
  windowMs: 60_000,
  blockMs: 60_000,
} as const;

function requestSubject(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return (realIp || forwarded || "local").slice(0, 128);
}

export async function proxy(request: NextRequest) {
  if (request.method !== "POST") return NextResponse.next();
  const now = new Date();
  const subject = requestSubject(request);
  try {
    const decision = await checkAuthRateLimit(
      "global-mutation",
      subject,
      mutationLimit,
      now,
    );
    if (!decision.allowed) {
      return NextResponse.json(
        { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, decision.retryAfterSeconds ?? 60)),
            "Cache-Control": "no-store",
          },
        },
      );
    }
    await recordAuthAttempt("global-mutation", subject, mutationLimit, now);
    return NextResponse.next();
  } catch {
    return NextResponse.json(
      { error: "Dịch vụ bảo vệ yêu cầu tạm thời không khả dụng." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
