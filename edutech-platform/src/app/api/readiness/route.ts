import { db } from "@/lib/db";
import { logEvent } from "@/lib/observability/logger";

export async function GET() {
  const startedAt = performance.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json(
      {
        status: "ready",
        checks: { database: "ok" },
        latencyMs: Math.round(performance.now() - startedAt),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logEvent("error", "readiness.failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return Response.json(
      { status: "not-ready", checks: { database: "failed" } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
