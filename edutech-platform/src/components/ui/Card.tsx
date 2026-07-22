import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-ink-200)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
