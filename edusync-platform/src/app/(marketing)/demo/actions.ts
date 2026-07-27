"use server";

import { db } from "@/lib/db";
import { parseDemoRequest } from "@/lib/marketing/demo-request";

export type DemoRequestState = {
  status: "idle" | "error" | "success";
  fieldErrors?: Record<string, string>;
  formError?: string;
};

export async function submitDemoRequest(
  _previousState: DemoRequestState,
  formData: FormData,
): Promise<DemoRequestState> {
  const parsed = parseDemoRequest(formData);

  if (!parsed.ok) {
    if ("bot" in parsed) {
      return { status: "success" };
    }
    return { status: "error", fieldErrors: parsed.fieldErrors };
  }

  try {
    const duplicateWindowStart = new Date(Date.now() - 10 * 60 * 1_000);
    const recentRequest = await db.demoRequest.findFirst({
      where: {
        email: parsed.data.email,
        createdAt: { gte: duplicateWindowStart },
      },
      select: { id: true },
    });
    if (recentRequest) {
      return { status: "success" };
    }

    await db.demoRequest.create({ data: parsed.data });
    return { status: "success" };
  } catch {
    return {
      status: "error",
      formError:
        "Chưa thể ghi nhận yêu cầu lúc này. Vui lòng thử lại sau ít phút.",
    };
  }
}
