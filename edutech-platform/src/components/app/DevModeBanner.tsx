import Link from "next/link";

import { exitDevImpersonationAction } from "@/app/dev/switch/actions";

export function DevModeBanner({
  operatorName,
  targetName,
  schoolName,
}: {
  operatorName: string;
  targetName: string;
  schoolName: string;
}) {
  return (
    <div
      role="status"
      className="border-b border-[var(--color-warning-200)] bg-[var(--color-warning-50)] text-[var(--color-warning-700)]"
    >
      <div className="flex min-h-12 flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 sm:text-sm">
            <span className="rounded-full bg-[var(--color-warning-100)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em]">
              Dev mode
            </span>
            <span>
              <strong>{operatorName}</strong> đang dùng{" "}
              <strong>{targetName}</strong> tại <strong>{schoolName}</strong>
            </span>
          </p>
          <p className="mt-1 text-[11px] leading-4 opacity-80">
            Cảnh báo: thao tác hiện tại thay đổi dữ liệu demo bằng quyền thực tế
            của tài khoản.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs font-semibold">
          <Link
            href="/dev/switch"
            className="inline-flex min-h-11 items-center hover:underline"
          >
            Đổi tài khoản
          </Link>
          <form action={exitDevImpersonationAction}>
            <button
              type="submit"
              className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-warning-200)] bg-white px-3 hover:bg-[var(--color-warning-100)]"
            >
              Thoát chế độ
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
