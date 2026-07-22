import Link from "next/link";
import {
  MentorIcon,
  BookIcon,
  CalendarIcon,
  BuildingIcon,
  ShieldIcon,
} from "@/components/ui/icons";

const navItems = [
  { href: "/dashboard", label: "Tổng quan", icon: ShieldIcon },
  { href: "/dashboard/mentoring", label: "Cố vấn & Gia sư", icon: MentorIcon },
  { href: "/dashboard/resources", label: "Kho tài liệu", icon: BookIcon },
  { href: "/dashboard/appointments", label: "Lịch hẹn & Đơn từ", icon: CalendarIcon },
  { href: "/dashboard/clubs-events", label: "CLB & Sự kiện", icon: BuildingIcon },
];

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-[var(--color-surface-muted)]">
      <aside className="hidden w-64 shrink-0 border-r border-[var(--color-ink-200)] bg-[var(--color-surface)] lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-[var(--color-ink-200)] px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-700)] text-white">
            <MentorIcon width={18} height={18} />
          </span>
          <span className="font-bold text-[var(--color-ink-900)]">LiênKếtHọc</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5">
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
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-brand-50)] px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-xs font-semibold text-white">
              BGH
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-ink-900)]">
                Ban Giám Hiệu
              </p>
              <p className="truncate text-xs text-[var(--color-ink-500)]">
                THPT Demo · Quản trị viên
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[var(--color-ink-200)] bg-[var(--color-surface)] px-6">
          <span className="font-semibold text-[var(--color-ink-900)]">
            Bảng điều khiển
          </span>
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--color-ink-500)] hover:text-[var(--color-brand-700)]"
          >
            Đăng xuất
          </Link>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}