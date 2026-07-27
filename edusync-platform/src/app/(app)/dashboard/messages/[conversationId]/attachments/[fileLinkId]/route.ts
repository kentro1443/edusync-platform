import { NextResponse } from "next/server";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { getMessageAttachment } from "@/lib/collaboration/collaboration-service";
import { contentDisposition, fileStorage } from "@/lib/storage/file-storage";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ conversationId: string; fileLinkId: string }>;
  },
) {
  try {
    const { conversationId, fileLinkId } = await params;
    const { actor } = await requireSchoolContext(permissions.messageConversationRead);
    const file = await getMessageAttachment(actor, conversationId, fileLinkId);
    const download = new URL(request.url).searchParams.get("download") === "1";
    const inline =
      file.mimeType === "application/pdf" || file.mimeType.startsWith("image/");
    const stream = await fileStorage.openReadStream(file.storageKey);
    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": file.sizeBytes.toString(),
        "Content-Disposition": contentDisposition(
          inline && !download ? "inline" : "attachment",
          file.originalName,
        ),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải tệp đính kèm." }, { status: 404 });
  }
}
