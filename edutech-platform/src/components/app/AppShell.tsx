"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";

import { logoutAction } from "@/app/(app)/actions";
import { Brand } from "@/components/layout/Brand";
import type { AppNavItem, NavIcon } from "@/components/app/shell-utils";
import { buildBreadcrumbs } from "@/components/app/shell-utils";
import {
  BellIcon,
  BookIcon,
  BuildingIcon,
  CalendarIcon,
  ChartIcon,
  ChevronLeftIcon,
  CloseIcon,
  MenuIcon,
  MessageIcon,
  MentorIcon,
  HistoryIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { Breadcrumb } from "@/components/ui/Navigation";
import { Dialog } from "@/components/ui/Overlays";
import { cn } from "@/lib/cn";

export type { AppNavItem } from "@/components/app/shell-utils";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface AppShellProps {
  children: React.ReactNode;
  displayName: string;
  initials: string;
  scopeDescription: string;
  activeSchoolName?: string;
  canSwitchSchool: boolean;
  schoolSearchEnabled: boolean;
  navItems: AppNavItem[];
  notificationSummary?: {
    unreadCount: number;
    items: readonly {
      id: string;
      title: string;
      body: string | null;
      href: string | null;
      createdAt: string;
      read: boolean;
    }[];
  };
}

const icons: Record<NavIcon, IconComponent> = {
  overview: ShieldIcon,
  mentoring: MentorIcon,
  resources: BookIcon,
  appointments: CalendarIcon,
  clubs: BuildingIcon,
  messages: MessageIcon,
  notifications: BellIcon,
  reports: ChartIcon,
  audit: HistoryIcon,
  members: MentorIcon,
  settings: ShieldIcon,
  schools: BuildingIcon,
};

function isCurrentRoute(pathname: string, href: string): boolean {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function Navigation({
  items,
  pathname,
  collapsed = false,
  onNavigate,
}: {
  items: AppNavItem[];
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1 px-3 py-4" aria-label="Điều hướng ứng dụng">
      {items.map((item, index) => {
        const Icon = icons[item.icon];
        const active = isCurrentRoute(pathname, item.href);
        const unavailable = item.available === false;
        const startsSection =
          !collapsed && item.section && item.section !== items[index - 1]?.section;
        const content = (
          <>
            <Icon width={19} height={19} aria-hidden="true" />
            <span className={cn(collapsed && "sr-only")}>{item.label}</span>
            {unavailable && !collapsed ? (
              <span className="ml-auto rounded-full bg-[var(--color-ink-100)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-ink-500)]">
                Sắp có
              </span>
            ) : null}
          </>
        );

        const entry = unavailable ? (
          <span
            title={collapsed ? `${item.label} — sắp có` : undefined}
            aria-disabled="true"
            className={cn(
              "flex min-h-11 cursor-not-allowed items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-ink-400)]",
              collapsed && "justify-center px-0",
            )}
          >
            {content}
          </span>
        ) : (
          <Link
            href={item.href}
            title={collapsed ? item.label : undefined}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-[var(--color-brand-100)] text-[var(--color-brand-900)]"
                : "text-[var(--color-ink-600)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-800)]",
            )}
          >
            {content}
          </Link>
        );

        return (
          <div key={item.href} className={cn(startsSection && index > 0 && "pt-3")}>
            {startsSection ? (
              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-400)]">
                {item.section}
              </p>
            ) : null}
            {entry}
          </div>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  displayName,
  initials,
  scopeDescription,
  activeSchoolName,
  canSwitchSchool,
  schoolSearchEnabled,
  navItems,
  notificationSummary,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const breadcrumbs = buildBreadcrumbs(pathname, navItems);
  const searchableItems = navItems.filter((item) => item.available !== false);
  const inviteRoute = navItems.find(
    (item) => item.href === "/dashboard/admin/members" && item.available !== false,
  );
  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    window.requestAnimationFrame(() => menuTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMobile();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMobile, mobileOpen]);

  useEffect(() => {
    function openSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", openSearch);
    return () => document.removeEventListener("keydown", openSearch);
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => !current);
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-[var(--color-surface-muted)] lg:grid",
        collapsed
          ? "lg:grid-cols-[5rem_minmax(0,1fr)]"
          : "lg:grid-cols-[17rem_minmax(0,1fr)]",
      )}
    >
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-[var(--color-ink-200)] bg-[var(--color-surface)] transition-[width] lg:flex lg:flex-col",
          collapsed ? "w-20" : "w-68",
        )}
      >
        <div className="flex h-16 items-center justify-center border-b border-[var(--color-ink-200)] px-4">
          <Brand href="/dashboard" compact={collapsed} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Navigation items={navItems} pathname={pathname} collapsed={collapsed} />
        </div>
        <div className="border-t border-[var(--color-ink-200)] p-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
            aria-expanded={!collapsed}
            className="mb-3 flex h-10 w-full items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-500)] hover:bg-[var(--color-ink-100)] hover:text-[var(--color-ink-800)]"
          >
            <ChevronLeftIcon
              width={19}
              height={19}
              aria-hidden="true"
              className={cn("transition-transform", collapsed && "rotate-180")}
            />
          </button>
          <div
            className={cn(
              "rounded-[var(--radius-md)] bg-[var(--color-brand-50)]",
              collapsed ? "p-2" : "p-3",
            )}
          >
            <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-xs font-semibold text-white">
                {initials}
              </span>
              {collapsed ? null : (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-ink-900)]">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-[var(--color-ink-500)]">
                    {scopeDescription}
                  </p>
                </div>
              )}
            </div>
            {canSwitchSchool && !collapsed ? (
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
            className="absolute inset-0 bg-[var(--color-surface-inverted)]/50 backdrop-blur-[2px]"
            onClick={closeMobile}
          />
          <aside
            aria-label="Điều hướng di động"
            className="relative flex h-full w-[min(20rem,88vw)] flex-col bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"
          >
            <div className="flex h-16 items-center justify-between border-b border-[var(--color-ink-200)] px-4">
              <Brand href="/dashboard" />
              <button
                type="button"
                onClick={closeMobile}
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
                onNavigate={closeMobile}
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
          <div className="flex min-h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
            <button
              ref={menuTriggerRef}
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
              <Breadcrumb items={breadcrumbs} className="hidden sm:block" />
            </div>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-10 min-w-52 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-ink-200)] bg-[var(--color-surface)] px-3 text-left text-sm text-[var(--color-ink-500)] hover:bg-[var(--color-ink-50)] md:flex"
              aria-label="Tìm kiếm trong ứng dụng"
            >
              <SearchIcon width={17} height={17} aria-hidden="true" />
              <span className="flex-1">Tìm kiếm</span>
              <kbd className="rounded border border-[var(--color-ink-200)] px-1.5 py-0.5 text-[10px]">
                ⌘ K
              </kbd>
            </button>

            {inviteRoute ? (
              <Link
                href={`${inviteRoute.href}?action=invite`}
                className="hidden h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand-700)] px-3.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-800)] sm:flex"
              >
                <PlusIcon width={17} height={17} aria-hidden="true" />
                Mời thành viên
              </Link>
            ) : null}

            {notificationSummary ? (
              <details className="group relative">
                <summary className="relative flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-600)] hover:bg-[var(--color-ink-100)] marker:hidden">
                  <span className="sr-only">
                    Mở thông báo, {notificationSummary.unreadCount} chưa đọc
                  </span>
                  <BellIcon width={20} height={20} aria-hidden="true" />
                  {notificationSummary.unreadCount ? (
                    <span
                      aria-hidden="true"
                      className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-danger-600)] px-1 text-[9px] font-bold text-white"
                    >
                      {Math.min(notificationSummary.unreadCount, 99)}
                    </span>
                  ) : null}
                </summary>
                <div className="absolute right-0 mt-2 w-[min(23rem,calc(100vw-2rem))] rounded-[var(--radius-md)] border border-[var(--color-ink-200)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-lg)]">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <p className="text-sm font-semibold text-[var(--color-ink-900)]">
                      Thông báo
                    </p>
                    <span className="text-xs text-[var(--color-ink-500)]">
                      {notificationSummary.unreadCount} chưa đọc
                    </span>
                  </div>
                  {notificationSummary.items.length ? (
                    <ol className="mt-2 divide-y divide-[var(--color-ink-100)]">
                      {notificationSummary.items.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.href ?? "/dashboard/notifications"}
                            className="relative block rounded-[var(--radius-sm)] px-3 py-3 hover:bg-[var(--color-ink-50)]"
                          >
                            {!item.read ? (
                              <span
                                aria-hidden="true"
                                className="absolute left-0 top-5 h-2 w-2 rounded-full bg-[var(--color-brand-600)]"
                              />
                            ) : null}
                            <p className="line-clamp-1 text-sm font-semibold text-[var(--color-ink-800)]">
                              {item.title}
                            </p>
                            {item.body ? (
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-ink-500)]">
                                {item.body}
                              </p>
                            ) : null}
                            <time
                              dateTime={item.createdAt}
                              className="mt-1 block text-[10px] text-[var(--color-ink-400)]"
                            >
                              {new Intl.DateTimeFormat("vi-VN", {
                                dateStyle: "short",
                                timeStyle: "short",
                                timeZone: "Asia/Ho_Chi_Minh",
                              }).format(new Date(item.createdAt))}
                            </time>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-ink-50)] px-4 py-5 text-center">
                      <p className="text-sm font-medium text-[var(--color-ink-700)]">
                        Chưa có thông báo
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                        Tin nhắn và việc cần chú ý sẽ xuất hiện tại đây.
                      </p>
                    </div>
                  )}
                  <Link
                    href="/dashboard/notifications"
                    className="mt-2 block rounded-[var(--radius-sm)] px-3 py-2 text-center text-sm font-semibold text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)]"
                  >
                    Xem tất cả và cấu hình
                  </Link>
                </div>
              </details>
            ) : null}

            <details className="relative">
              <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full bg-[var(--color-brand-700)] text-xs font-semibold text-white marker:hidden">
                <span className="sr-only">Mở menu tài khoản</span>
                {initials}
              </summary>
              <div className="absolute right-0 mt-2 w-60 rounded-[var(--radius-md)] border border-[var(--color-ink-200)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-lg)]">
                <div className="border-b border-[var(--color-ink-100)] px-2 py-2">
                  <p className="truncate text-sm font-semibold text-[var(--color-ink-900)]">{displayName}</p>
                  <p className="truncate text-xs text-[var(--color-ink-500)]">{scopeDescription}</p>
                </div>
                {canSwitchSchool ? (
                  <Link href="/chon-truong" className="mt-1 block rounded-[var(--radius-sm)] px-2 py-2 text-sm text-[var(--color-ink-700)] hover:bg-[var(--color-ink-100)]">
                    Đổi trường
                  </Link>
                ) : null}
                <Link href="/dashboard/profile" className="mt-1 block rounded-[var(--radius-sm)] px-2 py-2 text-sm text-[var(--color-ink-700)] hover:bg-[var(--color-ink-100)]">
                  Hồ sơ cá nhân
                </Link>
                <Link href="/dashboard/security" className="block rounded-[var(--radius-sm)] px-2 py-2 text-sm text-[var(--color-ink-700)] hover:bg-[var(--color-ink-100)]">
                  Bảo mật & phiên đăng nhập
                </Link>
                <form action={logoutAction}>
                  <button type="submit" className="w-full rounded-[var(--radius-sm)] px-2 py-2 text-left text-sm text-[var(--color-danger-600)] hover:bg-[var(--color-danger-100)]">
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

      <Dialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Tìm kiếm trong EduTech"
        description="Đi nhanh đến khu vực bạn được phép truy cập."
      >
        {schoolSearchEnabled ? (
        <form action="/dashboard/search" method="get">
          <label htmlFor="app-search" className="sr-only">Từ khóa tìm kiếm</label>
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-ink-300)] px-3 focus-within:border-[var(--color-brand-600)] focus-within:ring-2 focus-within:ring-[var(--color-brand-200)]">
            <SearchIcon width={19} height={19} aria-hidden="true" className="text-[var(--color-ink-400)]" />
            <input
              id="app-search"
              name="q"
              type="search"
              minLength={2}
              maxLength={80}
              placeholder="Tài liệu, sự kiện, CLB, thành viên…"
              className="h-12 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
            />
            <button
              type="submit"
              className="rounded-[var(--radius-sm)] bg-[var(--color-brand-700)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Tìm
            </button>
          </div>
        </form>
        ) : (
          <p className="rounded-[var(--radius-md)] bg-[var(--color-warning-50)] px-4 py-3 text-sm text-[var(--color-warning-900)]">
            Tìm kiếm dữ liệu chỉ khả dụng sau khi chọn đúng phạm vi trường.
          </p>
        )}
        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-400)]">Lối tắt</p>
        <nav aria-label="Kết quả tìm kiếm nhanh" className="grid gap-2 sm:grid-cols-2">
          {searchableItems.map((item) => {
            const Icon = icons[item.icon];
            return (
              <Link key={item.href} href={item.href} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-ink-200)] px-3 py-3 text-sm font-medium text-[var(--color-ink-700)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)]">
                <Icon width={18} height={18} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </Dialog>
    </div>
  );
}
