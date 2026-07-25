const dayMs = 86_400_000;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function parseIsoDate(value: string | undefined): Date | null {
  if (!value || !isoDatePattern.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

export function parseReportRange(
  fromValue: string | undefined,
  toValue: string | undefined,
  now = new Date(),
) {
  const from = parseIsoDate(fromValue);
  const inclusiveTo = parseIsoDate(toValue);
  const exclusiveTo = inclusiveTo
    ? new Date(inclusiveTo.getTime() + dayMs)
    : null;
  if (
    from &&
    exclusiveTo &&
    exclusiveTo > from &&
    exclusiveTo.getTime() - from.getTime() <= 366 * dayMs
  ) {
    return { from, to: exclusiveTo };
  }
  const to = new Date(startOfUtcDay(now).getTime() + dayMs);
  return { from: new Date(to.getTime() - 31 * dayMs), to };
}

export function safeCsvCell(value: unknown): string {
  const text =
    value instanceof Date
      ? value.toISOString()
      : value === null || value === undefined
        ? ""
        : String(value);
  return /^\s*[=+\-@]/.test(text) || /^[\t\r]/.test(text) ? `'${text}` : text;
}

function quoteCsvCell(value: unknown): string {
  const text = safeCsvCell(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows: readonly (readonly unknown[])[]): string {
  return `\uFEFF${rows.map((row) => row.map(quoteCsvCell).join(",")).join("\r\n")}\r\n`;
}
