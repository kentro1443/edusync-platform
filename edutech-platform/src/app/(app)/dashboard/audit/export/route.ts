import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { exportSchoolAuditCsv } from "@/lib/reporting/audit-service";
import { parseReportRange } from "@/lib/reporting/reporting-domain";

export async function GET(request: Request) {
  try {
    const { actor } = await requireSchoolContext(permissions.auditExportSchool);
    const url = new URL(request.url);
    const range = parseReportRange(
      url.searchParams.get("from") ?? undefined,
      url.searchParams.get("to") ?? undefined,
    );
    const csv = await exportSchoolAuditCsv(actor, {
      ...range,
      action: url.searchParams.get("action")?.slice(0, 80),
      entityType: url.searchParams.get("entityType")?.slice(0, 80),
      actor: url.searchParams.get("actor")?.slice(0, 80),
    });
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="edutech-audit-${range.from.toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Không thể xuất nhật ký." }, { status: 404 });
  }
}
