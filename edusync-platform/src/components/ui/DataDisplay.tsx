import Link from "next/link";

import { cn } from "@/lib/cn";

export function Tabs({
  label,
  items,
  className,
}: {
  label: string;
  items: ReadonlyArray<{ label: string; href: string; active?: boolean; count?: number }>;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("overflow-x-auto border-b", className)}>
      <div role="tablist" className="flex min-w-max gap-6">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            role="tab"
            aria-selected={item.active ? true : false}
            className={cn(
              "border-b-2 px-0.5 py-3 text-sm font-semibold transition-colors",
              item.active
                ? "border-[var(--color-brand-700)] text-[var(--color-brand-800)]"
                : "border-transparent text-[var(--color-ink-500)] hover:border-[var(--color-ink-300)] hover:text-[var(--color-ink-800)]",
            )}
          >
            {item.label}
            {typeof item.count === "number" ? <span className="ml-2 rounded-full bg-[var(--color-ink-100)] px-2 py-0.5 text-xs">{item.count}</span> : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function initialsFor(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toLocaleUpperCase("vi"))
    .join("");
}

export function Avatar({
  name,
  imageUrl,
  size = "md",
  className,
}: {
  name: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-base" }[size];
  return imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- user avatars may come from authorized storage URLs.
    <img src={imageUrl} alt={name} className={cn("rounded-full object-cover ring-2 ring-white", sizeClass, className)} />
  ) : (
    <span
      role="img"
      aria-label={name}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] font-bold text-[var(--color-brand-800)] ring-2 ring-white", sizeClass, className)}
    >
      {initialsFor(name)}
    </span>
  );
}

export function DateTime({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  return <time dateTime={value} className={className}>{children}</time>;
}
