import Link from "next/link";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium " +
  "transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-500)]";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[var(--color-brand-700)] text-white hover:bg-[var(--color-brand-800)] active:bg-[var(--color-brand-900)]",
  secondary:
    "bg-[var(--color-accent-500)] text-[var(--color-ink-900)] hover:bg-[var(--color-accent-600)] active:bg-[var(--color-accent-700)]",
  outline:
    "border border-[var(--color-ink-300)] text-[var(--color-ink-800)] bg-transparent hover:bg-[var(--color-ink-50)]",
  ghost:
    "text-[var(--color-ink-700)] bg-transparent hover:bg-[var(--color-ink-100)]",
  danger:
    "bg-[var(--color-danger-600)] text-white hover:bg-[var(--color-danger-700)] active:bg-[var(--color-danger-800)]",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

interface ButtonAsButtonProps
  extends BaseProps,
    ButtonHTMLAttributes<HTMLButtonElement> {
  href?: undefined;
  loading?: boolean;
  loadingLabel?: string;
}

interface ButtonAsLinkProps extends BaseProps {
  href: string;
  target?: string;
  rel?: string;
  prefetch?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonAsButtonProps>(
  function ButtonInner(
    {
      variant = "primary",
      size = "md",
      className,
      loading = false,
      loadingLabel = "Đang xử lý",
      disabled,
      children,
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
            />
            <span>{loadingLabel}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

export const IconButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonAsButtonProps, "children"> & {
    label: string;
    children: React.ReactNode;
  }
>(function IconButton(
  {
    label,
    children,
    variant = "ghost",
    size = "md",
    className,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <Button
      ref={ref}
      type={type}
      variant={variant}
      size={size}
      aria-label={label}
      className={cn("aspect-square px-0", className)}
      {...props}
    >
      {children}
    </Button>
  );
});

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...props
}: ButtonAsLinkProps) {
  const classNames = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className,
  );

  if (props.prefetch === false) {
    return (
      <a
        href={href}
        className={classNames}
        target={props.target}
        rel={props.rel}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={classNames}
      {...props}
    >
      {children}
    </Link>
  );
}
