import Link from "next/link";

import { ForbiddenState } from "@/components/ui/Feedback";

export default function ForbiddenPage() {
  return (
    <ForbiddenState
      title="Bạn không có quyền truy cập"
      description="Tài khoản đã đăng nhập nhưng vai trò hiện tại không được phép xem nội dung này."
      action={
        <Link
          href="/dashboard"
          className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-brand-700)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-brand-800)]"
        >
          Về bảng điều khiển
        </Link>
      }
    />
  );
}
