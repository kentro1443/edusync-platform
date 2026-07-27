import { NextResponse } from "next/server";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { exportWorkflowSubmissionsCsv } from "@/lib/workflows/workflow-service";

export async function GET() {
  try {
    const { actor } = await requireSchoolContext(permissions.workflowAnalyticsRead);
    const csv = await exportWorkflowSubmissionsCsv(actor);
    return new NextResponse(`\ufeff${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="edusync-workflows.csv"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Không thể xuất dữ liệu quy trình." }, { status: 403 });
  }
}
