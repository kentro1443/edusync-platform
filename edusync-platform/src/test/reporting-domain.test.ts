import { describe, expect, it } from "vitest";

import {
  parseReportRange,
  safeCsvCell,
  toCsv,
} from "@/lib/reporting/reporting-domain";

describe("reporting domain", () => {
  it("neutralizes spreadsheet formulas in every exported text cell", () => {
    expect(safeCsvCell("=HYPERLINK(\"https://evil.test\")")).toBe(
      "'=HYPERLINK(\"https://evil.test\")",
    );
    expect(safeCsvCell(" +SUM(1,2)")).toBe("' +SUM(1,2)");
    expect(safeCsvCell("Bình thường")).toBe("Bình thường");
  });

  it("quotes CSV fields and emits a UTF-8 BOM for Vietnamese Excel files", () => {
    const csv = toCsv([
      ["Mô-đun", "Ghi chú"],
      ["Lịch học", "Có dấu phẩy, và \"ngoặc kép\""],
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Có dấu phẩy, và ""ngoặc kép"""');
  });

  it("bounds date ranges to 366 days and falls back safely", () => {
    const now = new Date("2026-07-23T12:00:00.000Z");
    expect(parseReportRange("2026-07-01", "2026-07-23", now)).toMatchObject({
      from: new Date("2026-07-01T00:00:00.000Z"),
      to: new Date("2026-07-24T00:00:00.000Z"),
    });
    const fallback = parseReportRange("2020-01-01", "2026-07-23", now);
    expect(fallback.to.getTime() - fallback.from.getTime()).toBeLessThanOrEqual(
      31 * 86_400_000,
    );
  });
});
