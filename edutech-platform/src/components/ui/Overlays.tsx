"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";

import { IconButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

function useModalFocus(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeydown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [onClose, open]);
  return panelRef;
}

function ModalFrame({
  open,
  title,
  description,
  onClose,
  children,
  panelClassName,
  label,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName: string;
  label: string;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useModalFocus(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex" role="presentation">
      <button type="button" aria-label={`Đóng ${label}`} className="absolute inset-0 bg-[var(--color-surface-inverted)]/55 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn("relative z-10 bg-[var(--color-surface)] shadow-[var(--shadow-lg)]", panelClassName)}
      >
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-[var(--color-ink-900)]">{title}</h2>
            {description ? <p id={descriptionId} className="mt-1 text-sm text-[var(--color-ink-500)]">{description}</p> : null}
          </div>
          <IconButton label={`Đóng ${label}`} size="sm" onClick={onClose}><span aria-hidden="true">×</span></IconButton>
        </div>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export function Dialog(props: Omit<React.ComponentProps<typeof ModalFrame>, "panelClassName" | "label">) {
  return <ModalFrame {...props} label="hộp thoại" panelClassName="m-auto w-[min(42rem,calc(100%-2rem))] rounded-[var(--radius-lg)]" />;
}

export function Drawer(props: Omit<React.ComponentProps<typeof ModalFrame>, "panelClassName" | "label">) {
  return <ModalFrame {...props} label="ngăn bên" panelClassName="ml-auto h-full w-[min(32rem,92vw)]" />;
}

type MenuItem = { label: string; href?: string; onSelect?: () => void; danger?: boolean };

export function Menu({ label, items, className }: { label: string; items: ReadonlyArray<MenuItem>; className?: string }) {
  return (
    <details className={cn("group relative inline-block", className)}>
      <summary className="list-none rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-semibold text-[var(--color-ink-700)] hover:bg-[var(--color-ink-50)]">{label}</summary>
      <div role="menu" className="absolute right-0 z-30 mt-2 min-w-48 rounded-[var(--radius-md)] border bg-white p-1.5 shadow-[var(--shadow-md)]">
        {items.map((item) => item.href ? (
          <Link key={item.label} href={item.href} role="menuitem" className={cn("block rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-[var(--color-ink-50)]", item.danger && "text-[var(--color-danger-700)]")}>{item.label}</Link>
        ) : (
          <button key={item.label} type="button" role="menuitem" onClick={item.onSelect} className={cn("block w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm hover:bg-[var(--color-ink-50)]", item.danger && "text-[var(--color-danger-700)]")}>{item.label}</button>
        ))}
      </div>
    </details>
  );
}

export function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <span className="group relative inline-flex" tabIndex={0} aria-describedby={id}>
      {children}
      <span id={id} role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-64 -translate-x-1/2 rounded-[var(--radius-sm)] bg-[var(--color-ink-900)] px-2.5 py-1.5 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus:opacity-100">{content}</span>
    </span>
  );
}

export function ToastRegion({ messages }: { messages: ReadonlyArray<{ id: string; tone: "success" | "danger" | "info"; text: string }> }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="fixed bottom-4 right-4 z-[80] flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2">
      {messages.map((message) => (
        <div key={message.id} className={cn("rounded-[var(--radius-md)] border bg-white px-4 py-3 text-sm font-medium shadow-[var(--shadow-md)]", message.tone === "success" && "border-[var(--color-success-200)] text-[var(--color-success-700)]", message.tone === "danger" && "border-[var(--color-danger-200)] text-[var(--color-danger-700)]", message.tone === "info" && "border-[var(--color-brand-200)] text-[var(--color-brand-800)]")}>{message.text}</div>
      ))}
    </div>
  );
}
