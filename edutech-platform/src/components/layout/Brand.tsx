import Link from "next/link";

import { cn } from "@/lib/cn";

export function Brand({
  compact = false,
  inverse = false,
  className,
}: {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="EduTech - Trang chủ"
      className={cn("group inline-flex items-center gap-3", inverse ? "text-white" : "text-[var(--color-ink-900)]", className)}
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[0.8rem] bg-[var(--color-brand-800)] shadow-[var(--shadow-sm)] ring-1 ring-white/15">
        <span aria-hidden="true" className="absolute -right-2 -top-3 h-7 w-7 rounded-full bg-[var(--color-accent-500)]/90" />
        <span aria-hidden="true" className="relative text-sm font-extrabold tracking-[-0.08em] text-white">ET</span>
      </span>
      {!compact ? (
        <span>
          <span className="block text-[1.05rem] font-extrabold leading-none tracking-[-0.035em]">EduTech</span>
          <span className={cn("mt-1 block text-[0.62rem] font-semibold uppercase tracking-[0.17em]", inverse ? "text-white/60" : "text-[var(--color-ink-400)]")}>Trường học kết nối</span>
        </span>
      ) : null}
    </Link>
  );
}
