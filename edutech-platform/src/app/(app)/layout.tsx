import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell, type AppNavItem } from "@/components/app/AppShell";
import { translateRole } from "@/components/app/shell-utils";
import { activeSchoolCookieName } from "@/lib/auth/cookies";
import { getCurrentSession } from "@/lib/auth/current-session";
import {
  getSchoolPermissions,
  hasPermission,
  permissions,
  type Permission,
} from "@/lib/auth/permissions";

const navItems = [
  { href: "/dashboard", label: "Tổng quan", icon: "overview" },
  {
    href: "/dashboard/mentoring",
    label: "Cố vấn & Gia sư",
    icon: "mentoring",
    permission: permissions.mentorDirectoryRead,
    available: false,
  },
  {
    href: "/dashboard/resources",
    label: "Kho tài liệu",
    icon: "resources",
    permission: permissions.resourceRead,
    available: false,
  },
  {
    href: "/dashboard/appointments",
    label: "Lịch hẹn & Đơn từ",
    icon: "appointments",
    permission: permissions.calendarEventRead,
    available: false,
  },
  {
    href: "/dashboard/clubs-events",
    label: "CLB & Sự kiện",
    icon: "clubs",
    permission: permissions.clubRead,
    available: false,
  },
] satisfies readonly (AppNavItem & { permission?: Permission })[];

function getInitials(displayName: string): string {
  return (
    displayName
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0])
      .join("")
      .toLocaleUpperCase("vi") || "ND"
  );
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

  const effectivePermissions = activeSchool
    ? getSchoolPermissions(activeSchool.roles)
    : [];
  const visibleNavItems = navItems.filter(
    (item) =>
      !item.permission ||
      hasPermission(effectivePermissions, item.permission),
  );
  const scopeDescription = activeSchool
    ? activeSchool.roles.map(translateRole).join(" · ")
    : session.platformRoles.map(translateRole).join(" · ") ||
      "Quản trị nền tảng";

  return (
    <AppShell
      displayName={session.user.displayName}
      initials={getInitials(session.user.displayName)}
      scopeDescription={scopeDescription}
      activeSchoolName={activeSchool?.schoolName}
      canSwitchSchool={session.schoolContexts.length > 1}
      navItems={visibleNavItems}
    >
      {children}
    </AppShell>
  );
}
