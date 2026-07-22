"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType, type SVGProps } from "react";

import { logoutAction } from "@/app/(app)/actions";
import {
  BellIcon,
  BookIcon,
  BuildingIcon,
  CalendarIcon,
  CloseIcon,
  MenuIcon,
  MentorIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;
type NavIcon = "overview" | "mentoring" | "resources" | "appointments" | "clubs";

export interface AppNavItem {
  href: string;
  label: string;
  icon: NavIcon;
}

interface AppShellProps {
  children: React.ReactNode;
  displayName: string;
  initials: string;
  scopeDescription: string;
  activeSchoolName?: string;
  canSwitchSchool: boolean;
  navItems: AppNavItem[];
}

const icons: Record<NavIcon, IconComponent> = {
  overview: ShieldIcon,
  mentoring: MentorIcon,
  resources: BookIcon,
  appointments: CalendarIcon,
  clubs: BuildingIcon,
};

function isCurrentRoute(pathname: string, href: string): boolean {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function Navigation({
  items,
  pathname,
  onNavigate,
}: {
  items: AppNavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1 px-3 py-4" aria-label="Điều hướng ứng dụng">
      {items.map((item) => {
        const Icon = icons[item.icon];
        const active = isCurrentRoute(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--color-brand-100)] text-[var(--color-brand-900)]"
                : "text-[var(--color-ink-600)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-800)]",
            )}
          >
            <Icon width={19} height={19} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link
      href="/dashboard"
      className="flex h-16 items-center gap-2.5 px-5 text-[var(--color-ink-900)]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-700)] text-white">
        <MentorIcon width={19} height={19} aria-hidden="true" />
      </span>
      <span>
        <span className="block text-sm font-bold leading-tight">EduTech</span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-400)]">
          Không gian nhà trường
        </span>
      </span>
    </Link>
  );
}

export function AppShell({
  children,
  displayName,
  initials,
  scopeDescription,
  activeSchoolName,
  canSwitchSchool,
  navItems,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[var(--color-surface-muted)] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 border-r border-[var(--color-ink-200)] bg-[var(--color-surface)] lg:flex lg:flex-col">
        <div className="border-b border-[var(--color-ink-200)]">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto">
          <p className="px-6 pt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-400)]">
            Không gian làm việc
          </p>
          <Navigation items={navItems} pathname={pathname} />
        </div>
        <div className="border-t border-[var(--color-ink-200)] p-4">
          <div className="rounded-[var(--radius-md)] bg-[var(--color-brand-50)] p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-xs font-semibold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-ink-900)]">
                  {displayName}
                </p>
                <p className="truncate text-xs text-[var(--color-ink-500)]">
                  {scopeDescription}
                </p>
              </div>
            </div>
            {canSwitchSchool ? (
              <Link
                href="/chon-truong"
                className="mt-3 block border-t border-[var(--color-brand-200)] pt-2.5 text-xs font-semibold text-[var(--color-brand-700)] hover:underline"
              >
                Đổi trường đang hoạt động
              </Link>
            ) : null}
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng điều hướng"
            className="absolute inset-0 bg-[var(--color-surface-inverted)]/45"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            aria-label="Điều hướng di động"
            className="relative flex h-full w-[min(20rem,88vw)] flex-col bg-[var(--color-surface)] shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-ink-200)] pr-3">
              <Brand />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-600)] hover:bg-[var(--color-ink-100)]"
                aria-label="Đóng menu"
                autoFocus
              >
                <CloseIcon width={21} height={21} aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Navigation
                items={navItems}
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
            <div className="border-t border-[var(--color-ink-200)] p-4 text-sm">
              <p className="font-semibold text-[var(--color-ink-900)]">{displayName}</p>
              <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">
                {scopeDescription}
              </p>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-20 border-b border-[var(--color-ink-200)] bg-[var(--color-surface)]/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-700)] hover:bg-[var(--color-ink-100)] lg:hidden"
              aria-label="Mở menu điều hướng"
              aria-expanded={mobileOpen}
            >
              <MenuIcon width={22} height={22} aria-hidden="true" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--color-ink-900)]">
                {activeSchoolName ?? "Quản trị nền tảng"}
              </p>
              <p className="hidden truncate text-xs text-[var(--color-ink-500)] sm:block">
                Bảng điều khiển nhà trường
              </p>
            </div>

            <button
              type="button"
              className="hidden h-10 min-w-52 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-ink-200)] bg-[var(--color-surface)] px-3 text-left text-sm text-[var(--color-ink-500)] hover:bg-[var(--color-ink-50)] md:flex"
              aria-label="Tìm kiếm trong ứng dụng"
            >
              <SearchIcon width={17} height={17} aria-hidden="true" />
              <span className="flex-1">Tìm kiếm</span>
              <kbd className="rounded border border-[var(--color-ink-200)] px-1.5 py-0.5 text-[10px]">
                ⌘ K
              </kbd>
            </button>

            <Link
              href="/dashboard/appointments"
              className="hidden h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand-700)] px-3.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-800)] sm:flex"
            >
              <PlusIcon width={17} height={17} aria-hidden="true" />
              Tạo mới
            </Link>

            <button
              type="button"
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-600)] hover:bg-[var(--color-ink-100)]"
              aria-label="Thông báo, có 3 thông báo chưa đọc"
            >
              <BellIcon width={20} height={20} aria-hidden="true" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-danger-600)] ring-2 ring-white" />
            </button>

            <details className="relative">
              <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full bg-[var(--color-brand-700)] text-xs font-semibold text-white marker:hidden">
                <span className="sr-only">Mở menu tài khoản</span>
                {initials}
              </summary>
              <div className="absolute right-0 mt-2 w-60 rounded-[var(--radius-md)] border border-[var(--color-ink-200)] bg-[var(--color-surface)] p-2 shadow-lg">
                <div className="border-b border-[var(--color-ink-100)] px-2 py-2">
                  <p className="truncate text-sm font-semibold text-[var(--color-ink-900)]">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-[var(--color-ink-500)]">
                    {scopeDescription}
                  </p>
                </div>
                {canSwitchSchool ? (
                  <Link
                    href="/chon-truong"
                    className="mt-1 block rounded-[var(--radius-sm)] px-2 py-2 text-sm text-[var(--color-ink-700)] hover:bg-[var(--color-ink-100)]"
                  >
                    Đổi trường
                  </Link>
                ) : null}
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full rounded-[var(--radius-sm)] px-2 py-2 text-left text-sm text-[var(--color-danger-600)] hover:bg-[var(--color-danger-100)]"
                  >
                    Đăng xuất
                  </button>
                </form>
              </div>
            </details>
          </div>
        </header>

        <main id="main-content" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[90rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}