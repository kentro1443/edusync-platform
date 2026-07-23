import { NextResponse } from "next/server";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { exportCalendarIcal } from "@/lib/calendar/calendar-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = new Date(url.searchParams.get("from") ?? new Date().toISOString());
  const to = new Date(url.searchParams.get("to") ?? new Date(Date.now() + 90 * 86_400_000).toISOString());
  try {
    const { actor } = await requireSchoolContext(permissions.calendarExport);
    const content = await exportCalendarIcal(actor, {
      calendarId: url.searchParams.get("calendarId") ?? undefined,
      from,
      to,
    });
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="edutech-calendar.ics"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Không thể xuất lịch." }, { status: 403 });
  }
}
