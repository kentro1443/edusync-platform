import { cn } from "@/lib/cn";

type FeedbackTone = "info" | "success" | "warning" | "danger";

const toneStyles: Record<FeedbackTone, string> = {
  info: "border-[var(--color-brand-200)] bg-[var(--color-brand-50)] text-[var(--color-brand-900)]",
  success: "border-[var(--color-success-200)] bg-[var(--color-success-50)] text-[var(--color-success-700)]",
  warning: "border-[var(--color-warning-200)] bg-[var(--color-warning-50)] text-[var(--color-warning-700)]",
  danger: "border-[var(--color-danger-200)] bg-[var(--color-danger-50)] text-[var(--color-danger-700)]",
};

const toneLabels: Record<FeedbackTone, string> = {
  info: "Thông tin",
  success: "Thành công",
  warning: "Cảnh báo",
  danger: "Lỗi",
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: FeedbackTone;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-[var(--radius-md)] border px-4 py-3.5", toneStyles[tone], className)}
    >
      <p className="text-sm font-semibold">
        <span className="sr-only">{toneLabels[tone]}: </span>
        {title}
      </p>
      {children ? <div className="mt-1 text-sm leading-relaxed opacity-90">{children}</div> : null}
    </div>
  );
}

export function InlineFeedback({ tone = "info", children }: { tone?: FeedbackTone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", toneStyles[tone].split(" ").at(-1))}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="status" className={cn("mx-auto max-w-lg px-6 py-14 text-center", className)}>
      {icon ? (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]">
          {icon}
        </div>
      ) : null}
      <h3 className="mt-4 text-base font-semibold text-[var(--color-ink-900)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--color-ink-500)]">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState(props: Omit<React.ComponentProps<typeof EmptyState>, "icon">) {
  return <EmptyState {...props} icon={<span aria-hidden="true">!</span>} />;
}

export function ForbiddenState(props: Omit<React.ComponentProps<typeof EmptyState>, "icon">) {
  return <EmptyState {...props} icon={<span aria-hidden="true">×</span>} />;
}

export function Skeleton({ className, label = "Đang tải nội dung" }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("block animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-ink-100)] motion-reduce:animate-none", className)}
    />
  );
}
