type LogLevel = "info" | "warn" | "error";

export function logEvent(
  level: LogLevel,
  event: string,
  context: Readonly<Record<string, unknown>> = {},
) {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  });
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.info(payload);
}
