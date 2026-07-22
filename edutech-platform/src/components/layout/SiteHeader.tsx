"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Brand } from "@/components/layout/Brand";
import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ChevronDownIcon, CloseIcon, MenuIcon, moduleIcons } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { primaryNav } from "@/lib/site-data";

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setMobileOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  function closeMobileAndRestoreFocus() {
    setMobileOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-ink-200)]/80 bg-[var(--color-surface)]/94 shadow-[0_1px_0_rgb(18_24_31_/_0.02)] backdrop-blur-xl">
      <Container className="flex h-[4.75rem] items-center justify-between gap-5">
        <Brand />

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Điều hướng chính">
          {primaryNav.map((item) => {
            if ("children" in item && item.children) {
              return (
                <details key={item.href} className="group relative">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold text-[var(--color-ink-700)] transition-colors hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-800)]">
                    {item.label}
                    <ChevronDownIcon width={15} height={15} aria-hidden="true" className="transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="absolute left-1/2 top-full mt-3 w-[34rem] -translate-x-1/2 rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-3 shadow-[var(--shadow-lg)]">
                    <div className="grid grid-cols-2 gap-1">
                      {item.children.map((module) => {
                        const Icon = moduleIcons[module.icon];
                        return (
                          <Link key={module.key} href={module.href} className="group/item flex items-start gap-3 rounded-[var(--radius-md)] p-3 transition-colors hover:bg-[var(--color-brand-50)]">
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-100)] text-[var(--color-brand-700)] transition-colors group-hover/item:bg-[var(--color-brand-700)] group-hover/item:text-white">
                              <Icon width={18} height={18} aria-hidden="true" />
                            </span>
                            <span>
                              <span className="block text-sm font-bold text-[var(--color-ink-900)]">{module.name}</span>
                              <span className="mt-1 block text-xs leading-relaxed text-[var(--color-ink-500)]">{module.tagline}</span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </details>
              );
            }
            const active = pathname === item.href;
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold text-[var(--color-ink-600)] transition-colors hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-800)]",
                  active && "bg-[var(--color-brand-50)] text-[var(--color-brand-800)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          <LinkButton href="/login" variant="ghost" size="sm">Đăng nhập</LinkButton>
          <LinkButton href="/demo" variant="primary" size="sm">Đăng ký tư vấn</LinkButton>
        </div>

        <button
          ref={triggerRef}
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border bg-white text-[var(--color-ink-700)] shadow-[var(--shadow-sm)] xl:hidden"
          aria-label="Mở menu điều hướng"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileOpen(true)}
        >
          <MenuIcon width={21} height={21} aria-hidden="true" />
        </button>
      </Container>

      {mobileOpen ? (
        <div id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Điều hướng di động" className="fixed inset-0 z-[60] xl:hidden">
          <button type="button" aria-label="Đóng menu điều hướng" className="absolute inset-0 bg-[var(--color-surface-inverted)]/55 backdrop-blur-[2px]" onClick={closeMobileAndRestoreFocus} />
          <div className="absolute inset-y-0 right-0 flex w-[min(27rem,92vw)] flex-col bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <Brand />
              <button ref={closeRef} type="button" aria-label="Đóng menu điều hướng" onClick={closeMobileAndRestoreFocus} className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-ink-100)]">
                <CloseIcon width={21} height={21} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Điều hướng trên điện thoại" className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1">
                {primaryNav.map((item) => (
                  <li key={`${item.href}-${item.label}`}>
                    <Link href={item.href} onClick={() => setMobileOpen(false)} className="flex min-h-11 items-center rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-semibold text-[var(--color-ink-700)] hover:bg-[var(--color-brand-50)]">{item.label}</Link>
                    {"children" in item && item.children ? (
                      <ul className="mb-3 ml-3 border-l pl-3">
                        {item.children.map((module) => <li key={module.key}><Link href={module.href} onClick={() => setMobileOpen(false)} className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--color-ink-600)] hover:bg-[var(--color-ink-50)]">{module.name}</Link></li>)}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="grid gap-2 border-t p-5">
              <LinkButton href="/demo" size="md">Đăng ký tư vấn</LinkButton>
              <LinkButton href="/login" variant="outline" size="md">Đăng nhập</LinkButton>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
