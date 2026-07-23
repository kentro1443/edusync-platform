import { NextResponse } from "next/server";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { getAuthorizedFile, recordResourceEvent } from "@/lib/resources/resource-service";
import { contentDisposition, LocalFileStorage } from "@/lib/storage/file-storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resourceId: string }> },
) {
  try {
    const { resourceId } = await params;
    const { actor } = await requireSchoolContext(permissions.resourceDownload);
    const versionId = new URL(request.url).searchParams.get("versionId") ?? undefined;
    const file = await getAuthorizedFile(actor, resourceId, versionId);
    await recordResourceEvent(actor, resourceId, "DOWNLOAD");
    const stream = await new LocalFileStorage().openReadStream(file.storageKey);
    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": contentDisposition("attachment", file.originalName),
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải file." }, { status: 404 });
  }
}
