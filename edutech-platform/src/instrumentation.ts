import { logEvent } from "@/lib/observability/logger";

/**
 * App-wide structured error capture for Server Components, Route Handlers, and
 * Server Actions. Runs automatically; see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation.
 */
export async function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routeType: string },
) {
  logEvent("error", "request.unhandled_error", {
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routeType: context.routeType,
    message: error instanceof Error ? error.message : String(error),
  });
}
