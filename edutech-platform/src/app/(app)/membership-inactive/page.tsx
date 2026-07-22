import Link from "next/link";

import { ForbiddenState } from "@/components/ui/Feedback";

export default function MembershipInactivePage() {
  return (
    <ForbiddenState
      title="Tư cách thành viên không hoạt động"
      description="Bạn không còn quyền truy cập trường đang chọn. Hãy chọn một trường khác hoặc liên hệ quản trị viên."
      action={<Link href="/chon-truong" className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-brand-700)] px-4 text-sm font-semibold text-white">Chọn trường khác</Link>}
    />
  );
}
