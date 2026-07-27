import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell, type AppNavItem } from "@/components/app/AppShell";
import { translateRole } from "@/components/app/shell-utils";
import { activeSchoolCookieName } from "@/lib/auth/cookies";
import { getCurrentSession } from "@/lib/auth/current-session";
import { isDevOperatorAccount } from "@/lib/auth/dev-mode";
import {
  getSchoolPermissions,
  getPlatformPermissions,
  hasPermission,
  permissions,
  type Permission,
} from "@/lib/auth/permissions";
import { selectSchoolAuthorizationContext } from "@/lib/auth/session";
import { getNotificationSummary } from "@/lib/collaboration/collaboration-service";

const navItems = [
  {
    href: "/dashboard",
    label: "Tổng quan",
    icon: "overview",
    section: "Không gian làm việc",
  },
  {
    href: "/dashboard/manual",
    label: "Hướng dẫn sử dụng",
    icon: "resources",
    section: "Không gian làm việc",
  },
  {
    href: "/dashboard/admin/members",
    label: "Thành viên",
    icon: "members",
    section: "Quản trị",
    schoolPermission: permissions.schoolUserRead,
  },
  {
    href: "/dashboard/admin/settings",
    label: "Cài đặt trường",
    icon: "settings",
    section: "Quản trị",
    schoolPermission: permissions.schoolSettingsRead,
  },
  {
    href: "/dashboard/platform/schools",
    label: "Danh mục trường",
    icon: "schools",
    section: "Quản trị",
    platformPermission: permissions.platformSchoolRead,
  },
  {
    href: "/dashboard/mentoring",
    label: "Cố vấn & Gia sư",
    icon: "mentoring",
    section: "Học tập & hỗ trợ",
    schoolPermission: permissions.mentorDirectoryRead,
  },
  {
    href: "/dashboard/mentoring/marketplace",
    label: "Chợ cố vấn",
    icon: "mentoring",
    section: "Học tập & hỗ trợ",
    schoolPermission: permissions.marketplaceRead,
  },
  {
    href: "/dashboard/resources",
    label: "Kho tài liệu",
    icon: "resources",
    section: "Học tập & hỗ trợ",
    schoolPermission: permissions.resourceRead,
  },
  {
    href: "/dashboard/calendar",
    label: "Lịch trường",
    icon: "appointments",
    section: "Vận hành",
    schoolPermission: permissions.calendarEventRead,
  },
  {
    href: "/dashboard/workflows",
    label: "Quy trình",
    icon: "settings",
    section: "Vận hành",
    schoolPermission: permissions.workflowTemplateRead,
  },
  {
    href: "/dashboard/appointments",
    label: "Lịch hẹn & Đơn từ",
    icon: "appointments",
    section: "Vận hành",
    schoolPermission: permissions.calendarEventRead,
  },
  {
    href: "/dashboard/clubs-events",
    label: "CLB & Sự kiện",
    icon: "clubs",
    section: "Vận hành",
    schoolPermission: permissions.clubRead,
  },
  {
    href: "/dashboard/messages",
    label: "Tin nhắn",
    icon: "messages",
    section: "Cộng tác",
    schoolPermission: permissions.messageConversationRead,
  },
  {
    href: "/dashboard/notifications",
    label: "Thông báo",
    icon: "notifications",
    section: "Cộng tác",
    schoolPermission: permissions.notificationReadOwn,
  },
  {
    href: "/dashboard/reports",
    label: "Báo cáo",
    icon: "reports",
    section: "Giám sát",
    schoolPermission: permissions.schoolReportRead,
  },
  {
    href: "/dashboard/audit",
    label: "Nhật ký kiểm toán",
    icon: "audit",
    section: "Giám sát",
    schoolPermission: permissions.auditReadSchool,
  },
  {
    href: "/dashboard/profile",
    label: "Hồ sơ cá nhân",
    icon: "settings",
    section: "Tài khoản",
  },
  {
    href: "/dashboard/security",
    label: "Bảo mật",
    icon: "settings",
    section: "Tài khoản",
  },
] satisfies readonly (AppNavItem & {
  schoolPermission?: Permission;
  platformPermission?: Permission;
})[];

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

  if (isDevOperatorAccount(session.user.accountKind)) {
    redirect("/dev/switch");
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
  const effectivePlatformPermissions = getPlatformPermissions(
    session.platformRoles,
  );
  const visibleNavItems = navItems.filter((item) => {
    const schoolPermission =
      "schoolPermission" in item ? item.schoolPermission : undefined;
    const platformPermission =
      "platformPermission" in item ? item.platformPermission : undefined;
    return (
      (!schoolPermission ||
        hasPermission(effectivePermissions, schoolPermission)) &&
      (!platformPermission ||
        hasPermission(effectivePlatformPermissions, platformPermission))
    );
  });
  const scopeDescription = activeSchool
    ? activeSchool.roles.map(translateRole).join(" · ")
    : session.platformRoles.map(translateRole).join(" · ") ||
      "Không có tư cách thành viên hoạt động";
  const schoolActor = activeSchool
    ? selectSchoolAuthorizationContext(session, activeSchool.schoolSlug)
    : null;
  const notificationSummary =
    schoolActor &&
    hasPermission(effectivePermissions, permissions.notificationReadOwn)
      ? await getNotificationSummary(schoolActor)
      : null;

  return (
    <AppShell
      displayName={session.user.displayName}
      initials={getInitials(session.user.displayName)}
      scopeDescription={scopeDescription}
      activeSchoolName={
        activeSchool?.schoolName ??
        (session.platformRoles.length > 0 ? undefined : "Tài khoản")
      }
      canSwitchSchool={session.schoolContexts.length > 1}
      schoolSearchEnabled={Boolean(activeSchool)}
      devMode={
        session.operatorUser
          ? {
              operatorName: session.operatorUser.displayName,
              targetName: session.user.displayName,
              schoolName: activeSchool?.schoolName ?? "Chưa chọn trường",
            }
          : undefined
      }
      navItems={visibleNavItems}
      notificationSummary={
        notificationSummary
          ? {
              unreadCount: notificationSummary.unreadCount,
              items: notificationSummary.items.map((item) => ({
                id: item.id,
                title: item.title,
                body: item.body,
                href: item.href,
                createdAt: item.createdAt.toISOString(),
                read: item.readAt !== null,
              })),
            }
          : undefined
      }
    >
      {children}
    </AppShell>
  );
}
