import Link from "next/link";
import { Fragment } from "react";

import { cn } from "@/lib/cn";

export function Breadcrumb({
  items,
  className,
}: {
  items: ReadonlyArray<{ label: string; href?: string }>;
  className?: string;
}) {
  return (
    <nav aria-label="Đường dẫn trang" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-ink-500)]">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 ? <li aria-hidden="true">/</li> : null}
              <li>
                {item.href && !current ? (
                  <Link className="hover:text-[var(--color-brand-700)]" href={item.href}>
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={current ? "page" : undefined} className={current ? "font-medium text-[var(--color-ink-800)]" : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  hrefForPage,
  className,
}: {
  currentPage: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return (
    <nav aria-label="Phân trang" className={cn("flex items-center justify-between gap-3", className)}>
      <Link
        href={hrefForPage(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={cn("rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-medium", currentPage === 1 && "pointer-events-none opacity-45")}
      >
        Trang trước
      </Link>
      <ol className="hidden items-center gap-1 sm:flex">
        {pages.map((page) => (
          <li key={page}>
            <Link
              href={hrefForPage(page)}
              aria-current={page === currentPage ? "page" : undefined}
              aria-label={`Trang ${page}`}
              className={cn(
                "flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-sm)] px-2 text-sm font-medium",
                page === currentPage ? "bg-[var(--color-brand-700)] text-white" : "hover:bg-[var(--color-ink-100)]",
              )}
            >
              {page}
            </Link>
          </li>
        ))}
      </ol>
      <span className="text-sm text-[var(--color-ink-500)] sm:hidden">Trang {currentPage}/{totalPages}</span>
      <Link
        href={hrefForPage(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={cn("rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-medium", currentPage === totalPages && "pointer-events-none opacity-45")}
      >
        Trang sau
      </Link>
    </nav>
  );
}

export function Timeline({
  items,
  className,
}: {
  items: ReadonlyArray<{
    id: string;
    title: string;
    description?: string;
    datetime: string;
    displayTime: string;
  }>;
  className?: string;
}) {
  return (
    <ol className={cn("space-y-0", className)}>
      {items.map((item, index) => (
        <li key={item.id} className="relative grid grid-cols-[1.25rem_1fr] gap-3 pb-6 last:pb-0">
          {index < items.length - 1 ? <span aria-hidden="true" className="absolute left-[0.59375rem] top-5 h-[calc(100%-0.75rem)] w-px bg-[var(--color-ink-200)]" /> : null}
          <span aria-hidden="true" className="relative mt-1 h-5 w-5 rounded-full border-4 border-[var(--color-surface)] bg-[var(--color-brand-600)] ring-1 ring-[var(--color-brand-200)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink-800)]">{item.title}</p>
            {item.description ? <p className="mt-1 text-sm text-[var(--color-ink-500)]">{item.description}</p> : null}
            <time dateTime={item.datetime} className="mt-1.5 block text-xs text-[var(--color-ink-400)]">
              {item.displayTime}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
