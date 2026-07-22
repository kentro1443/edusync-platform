import Link from "next/link";

import { ErrorState } from "@/components/ui/Feedback";

export default function NotFoundPage() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-[var(--color-surface-muted)] px-4">
      <ErrorState
        title="Không tìm thấy trang"
        description="Địa chỉ có thể đã thay đổi hoặc nội dung không còn tồn tại."
        action={
          <Link
            href="/"
            className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-brand-700)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-brand-800)]"
          >
            Về trang chủ
          </Link>
        }
      />
    </main>
  );
}
