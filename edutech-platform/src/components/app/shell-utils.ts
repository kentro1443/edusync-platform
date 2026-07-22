export type NavIcon =
  | "overview"
  | "mentoring"
  | "resources"
  | "appointments"
  | "clubs"
  | "members"
  | "settings"
  | "schools";

export interface AppNavItem {
  href: string;
  label: string;
  icon: NavIcon;
  available?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

const roleLabels: Record<string, string> = {
  PLATFORM_SUPER_ADMIN: "Quản trị nền tảng",
  SCHOOL_ADMIN: "Quản trị trường",
  TEACHER_STAFF: "Giáo viên & nhân viên",
  MENTOR_COUNSELOR: "Cố vấn học tập",
  STUDENT: "Học sinh",
  PARENT_GUARDIAN: "Phụ huynh",
  CLUB_LEADER: "Ban chủ nhiệm câu lạc bộ",
  APPROVER_REVIEWER: "Người phê duyệt",
};

const rolePriority = [
  "PLATFORM_SUPER_ADMIN",
  "SCHOOL_ADMIN",
  "TEACHER_STAFF",
  "MENTOR_COUNSELOR",
  "APPROVER_REVIEWER",
  "CLUB_LEADER",
  "PARENT_GUARDIAN",
  "STUDENT",
];

export function translateRole(role: string): string {
  return roleLabels[role] ?? "Thành viên nhà trường";
}

export function getPrimaryRoleLabel(roles: readonly string[]): string {
  const primary = rolePriority.find((role) => roles.includes(role));
  return primary ? translateRole(primary) : "Quản trị nền tảng";
}

export function buildBreadcrumbs(
  pathname: string,
  items: readonly AppNavItem[],
): BreadcrumbItem[] {
  const dashboard = items.find((item) => item.href === "/dashboard") ?? {
    href: "/dashboard",
    label: "Tổng quan",
  };

  if (pathname === "/dashboard") {
    return [{ label: dashboard.label }];
  }

  const matches = items
    .filter(
      (item) =>
        item.href !== "/dashboard" &&
        (pathname === item.href || pathname.startsWith(`${item.href}/`)),
    )
    .sort((a, b) => b.href.length - a.href.length);
  const closest = matches[0];
  const crumbs: BreadcrumbItem[] = [
    { href: dashboard.href, label: dashboard.label },
  ];

  if (!closest) {
    return [...crumbs, { label: "Trang hiện tại" }];
  }

  crumbs.push(
    pathname === closest.href
      ? { label: closest.label }
      : { href: closest.href, label: closest.label },
  );

  if (pathname !== closest.href) {
    crumbs.push({ label: "Chi tiết" });
  }

  return crumbs;
}
