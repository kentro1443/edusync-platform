"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { primaryNav } from "@/lib/site-data";
import { moduleIcons } from "@/components/ui/icons";
import { ChevronDownIcon, MenuIcon, CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [renderedPathname, setRenderedPathname] = useState(pathname);

  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setMobileOpen(false);
    setProductsOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-ink-200)] bg-[var(--color-surface)]/95 backdrop-blur">
      <Container className="flex h-18 items-center justify-between py-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[var(--color-brand-900)]"
          aria-label="LienKetHoc - Trang chủ"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-800)] text-sm font-bold text-white">
            LK
          </span>
          <span className="text-lg font-semibold tracking-tight">LiênKếtHọc</span>
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Điều hướng chính"
        >
          {primaryNav.map((item) => {
            if ("children" in item && item.children) {
              return (
                <div key={item.href} className="relative">
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1 rounded-[var(--radius-sm)] px-3.5 py-2 text-sm font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-ink-50)]",
                      productsOpen && "bg-[var(--color-ink-50)]"
                    )}
                    aria-expanded={productsOpen}
                    aria-haspopup="true"
                    onClick={() => setProductsOpen((v) => !v)}
                    onBlur={(e) => {
                      if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                        setProductsOpen(false);
                      }
                    }}
                  >
                    {item.label}
                    <ChevronDownIcon
                      width={16}
                      height={16}
                      className={cn("transition-transform", productsOpen && "rotate-180")}
                    />
                  </button>
                  {productsOpen && (
                    <div
                      role="menu"
                      className="absolute left-0 top-full mt-2 w-80 rounded-[var(--radius-lg)] border border-[var(--color-ink-200)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-lg)]"
                    >
                      {item.children.map((mod) => {
                        const Icon = moduleIcons[mod.icon];
                        return (
                          <Link
                            key={mod.key}
                            href={mod.href}
                            role="menuitem"
                            className="flex items-start gap-3 rounded-[var(--radius-md)] p-3 hover:bg-[var(--color-brand-50)]"
                          >
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
                              <Icon width={18} height={18} />
                            </span>
                            <span>
                              <span className="block text-sm font-medium text-[var(--color-ink-900)]">
                                {mod.name}
                              </span>
                              <span className="mt-0.5 block text-xs text-[var(--color-ink-500)]">
                                {mod.tagline}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-[var(--radius-sm)] px-3.5 py-2 text-sm font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-ink-50)]",
                  pathname === item.href && "text-[var(--color-brand-700)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LinkButton href="/login" variant="ghost" size="sm">
            Đăng nhập
          </LinkButton>
          <LinkButton href="/demo" variant="primary" size="sm">
            Yêu cầu demo
          </LinkButton>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-700)] hover:bg-[var(--color-ink-100)] lg:hidden"
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </Container>

      {mobileOpen && (
        <div className="border-t border-[var(--color-ink-200)] bg-[var(--color-surface)] lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-ink-50)]"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-[var(--color-ink-200)] pt-3">
              <LinkButton href="/login" variant="outline" size="sm">
                Đăng nhập
              </LinkButton>
              <LinkButton href="/demo" variant="primary" size="sm">
                Yêu cầu demo
              </LinkButton>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}