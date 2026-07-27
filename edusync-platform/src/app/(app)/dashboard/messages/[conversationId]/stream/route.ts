import { NextResponse } from "next/server";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { getConversationRevision } from "@/lib/collaboration/collaboration-service";

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function event(name: string, data: object) {
  return encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
}

function cursor(revision: {
  updatedAt: Date;
  messages: readonly { id: string }[];
}) {
  return `${revision.updatedAt.toISOString()}:${revision.messages[0]?.id ?? "empty"}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const [{ conversationId }, { actor }] = await Promise.all([
      params,
      requireSchoolContext(permissions.messageConversationRead),
    ]);
    const initial = await getConversationRevision(actor, conversationId);
    if (!initial) {
      return NextResponse.json({ error: "Không tìm thấy cuộc trò chuyện." }, { status: 404 });
    }

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let revision = cursor(initial);
        let closed = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const close = () => {
          if (closed) return;
          closed = true;
          if (timer) clearTimeout(timer);
          try {
            controller.close();
          } catch {
            // The client may already have closed the stream.
          }
        };
        request.signal.addEventListener("abort", close, { once: true });
        controller.enqueue(event("ready", { revision }));

        const poll = async () => {
          if (closed || request.signal.aborted) return close();
          try {
            const current = await getConversationRevision(actor, conversationId);
            if (!current) return close();
            const nextRevision = cursor(current);
            if (nextRevision !== revision) {
              revision = nextRevision;
              controller.enqueue(event("update", { revision }));
            } else {
              controller.enqueue(event("heartbeat", { revision }));
            }
          } catch {
            return close();
          }
          timer = setTimeout(() => void poll(), 2_000);
        };
        timer = setTimeout(() => void poll(), 2_000);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "private, no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Không thể mở kênh cập nhật." }, { status: 401 });
  }
}
