import { cn } from "@/lib/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-[var(--color-ink-200)] pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-700)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink-950)] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-ink-600)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div
          aria-label="Tác vụ trang"
          className="flex shrink-0 flex-wrap items-center gap-2"
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}
