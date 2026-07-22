import { cn } from "@/lib/cn";

type Tone = "brand" | "success" | "warning" | "danger" | "neutral";

const toneStyles: Record<Tone, string> = {
  brand: "bg-[var(--color-brand-100)] text-[var(--color-brand-800)]",
  success: "bg-[var(--color-success-100)] text-[var(--color-success-600)]",
  warning: "bg-[var(--color-warning-100)] text-[var(--color-warning-600)]",
  danger: "bg-[var(--color-danger-100)] text-[var(--color-danger-600)]",
  neutral: "bg-[var(--color-ink-100)] text-[var(--color-ink-700)]",
};

export function Badge({
  tone = "brand",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-wide",
        toneStyles[tone],
        className
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
