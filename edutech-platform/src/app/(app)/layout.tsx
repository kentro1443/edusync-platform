import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/(app)/actions";
import {
  BookIcon,
  BuildingIcon,
  CalendarIcon,
  MentorIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { activeSchoolCookieName } from "@/lib/auth/cookies";
import { getCurrentSession } from "@/lib/auth/current-session";

const navItems = [
  { href: "/dashboard", label: "Tổng quan", icon: ShieldIcon },
  { href: "/dashboard/mentoring", label: "Cố vấn & Gia sư", icon: MentorIcon },
  { href: "/dashboard/resources", label: "Kho tài liệu", icon: BookIcon },
  {
    href: "/dashboard/appointments",
    label: "Lịch hẹn & Đơn từ",
    icon: CalendarIcon,
  },
  {
    href: "/dashboard/clubs-events",
    label: "CLB & Sự kiện",
    icon: BuildingIcon,
  },
];

function getInitials(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi");
}

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?returnTo=/dashboard");
  }

  if (session.user.mustChangePassword) {
    redirect("/doi-mat-khau");
  }

  const cookieStore = await cookies();
  const requestedSchoolSlug = cookieStore.get(activeSchoolCookieName)?.value;
  const activeSchool =
    session.schoolContexts.find(
      (context) => context.schoolSlug === requestedSchoolSlug,
    ) ??
    (session.schoolContexts.length === 1
      ? session.schoolContexts[0]
      : undefined);

  if (session.schoolContexts.length > 1 && !activeSchool) {
    redirect("/chon-truong");
  }

  const scopeDescription = activeSchool
    ? `${activeSchool.schoolName} · ${activeSchool.roles.join(", ")}`
    : "Quản trị nền tảng";

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-muted)]">
      <aside className="hidden w-64 shrink-0 border-r border-[var(--color-ink-200)] bg-[var(--color-surface)] lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-[var(--color-ink-200)] px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-700)] text-white">
            <MentorIcon width={18} height={18} />
          </span>
          <span className="font-bold text-[var(--color-ink-900)]">EduTech</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Điều hướng ứng dụng">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-ink-600)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-800)]"
            >
              <item.icon width={18} height={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[var(--color-ink-200)] p-4">
          <div className="rounded-[var(--radius-md)] bg-[var(--color-brand-50)] px-3 py-2.5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-xs font-semibold text-white">
                {getInitials(session.user.displayName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--color-ink-900)]">
                  {session.user.displayName}
                </p>
                <p className="truncate text-xs text-[var(--color-ink-500)]">
                  {scopeDescription}
                </p>
              </div>
            </div>
            {session.schoolContexts.length > 1 ? (
              <Link
                href="/chon-truong"
                className="mt-2 block text-xs font-medium text-[var(--color-brand-700)] hover:underline"
              >
                Đổi trường
              </Link>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[var(--color-ink-200)] bg-[var(--color-surface)] px-6">
          <div>
            <p className="font-semibold text-[var(--color-ink-900)]">
              Bảng điều khiển
            </p>
            {activeSchool ? (
              <p className="text-xs text-[var(--color-ink-500)]">
                {activeSchool.schoolName}
              </p>
            ) : null}
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm font-medium text-[var(--color-ink-500)] hover:text-[var(--color-brand-700)]"
            >
              Đăng xuất
            </button>
          </form>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}