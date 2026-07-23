import { NextResponse } from "next/server";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { contentDisposition, LocalFileStorage } from "@/lib/storage/file-storage";
import { getWorkflowSubmissionAttachment } from "@/lib/workflows/workflow-service";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ submissionId: string; fileLinkId: string }>;
  },
) {
  try {
    const { submissionId, fileLinkId } = await params;
    const { actor } = await requireSchoolContext(permissions.workflowSubmissionRead);
    const file = await getWorkflowSubmissionAttachment(actor, submissionId, fileLinkId);
    const download = new URL(request.url).searchParams.get("download") === "1";
    const disposition =
      file.mimeType === "application/pdf" && !download ? "inline" : "attachment";
    const stream = await new LocalFileStorage().openReadStream(file.storageKey);
    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": file.sizeBytes.toString(),
        "Content-Disposition": contentDisposition(disposition, file.originalName),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải tệp đính kèm." }, { status: 404 });
  }
}
