import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { parseReportRange } from "@/lib/reporting/reporting-domain";
import { exportSchoolOperationsCsv } from "@/lib/reporting/reporting-service";

export async function GET(request: Request) {
  try {
    const { actor } = await requireSchoolContext(permissions.reportExport);
    const url = new URL(request.url);
    const range = parseReportRange(
      url.searchParams.get("from") ?? undefined,
      url.searchParams.get("to") ?? undefined,
    );
    const csv = await exportSchoolOperationsCsv(actor, range);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="edutech-operations-${range.from.toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Không thể xuất báo cáo." }, { status: 404 });
  }
}
