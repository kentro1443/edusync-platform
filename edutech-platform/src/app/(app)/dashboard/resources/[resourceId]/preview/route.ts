import { NextResponse } from "next/server";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { getAuthorizedFile, recordResourceEvent } from "@/lib/resources/resource-service";
import { LocalFileStorage } from "@/lib/storage/file-storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resourceId: string }> },
) {
  try {
    const { resourceId } = await params;
    const { actor } = await requireSchoolContext(permissions.resourceDownload);
    const versionId = new URL(request.url).searchParams.get("versionId") ?? undefined;
    const file = await getAuthorizedFile(actor, resourceId, versionId);
    if (file.mimeType !== "application/pdf") {
      return NextResponse.json({ error: "Chỉ hỗ trợ preview PDF." }, { status: 415 });
    }
    await recordResourceEvent(actor, resourceId, "PREVIEW");
    const stream = await new LocalFileStorage().openReadStream(file.storageKey);
    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${file.originalName.replaceAll('"', "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Không thể xem trước file." }, { status: 404 });
  }
}
