"use client";

import { ErrorState } from "@/components/ui/Feedback";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="Không thể tải nội dung"
      description="Đã có lỗi khi tải dữ liệu. Hãy thử lại; nếu lỗi tiếp diễn, liên hệ quản trị viên nhà trường."
      action={
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-brand-700)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-brand-800)]"
        >
          Thử tải lại
        </button>
      }
    />
  );
}
