export type NavIcon =
  | "overview"
  | "mentoring"
  | "resources"
  | "appointments"
  | "clubs"
  | "messages"
  | "notifications"
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

const membershipStatusLabels: Record<string, string> = {
  ACTIVE: "Hoạt động",
  INVITED: "Đã mời",
  SUSPENDED: "Tạm dừng",
  LEFT: "Đã rời trường",
};

const planCodeLabels: Record<string, string> = {
  STANDARD: "Tiêu chuẩn",
  LOCAL: "Cục bộ",
};

const auditActionLabels: Record<string, string> = {
  AUTH_LOGIN_SUCCEEDED: "Đăng nhập thành công",
  AUTH_LOGIN_FAILED: "Đăng nhập không thành công",
  AUTH_LOGOUT: "Đăng xuất",
  AUTH_PASSWORD_CHANGED: "Đổi mật khẩu thành công",
  AUTH_PASSWORD_RESET_REQUESTED: "Yêu cầu đặt lại mật khẩu",
  AUTH_PASSWORD_RESET_COMPLETED: "Đặt lại mật khẩu thành công",
  AUTH_SESSION_REVOKED: "Thu hồi phiên đăng nhập",
  AUTH_SESSIONS_OTHER_REVOKED: "Đăng xuất các thiết bị khác",
  AUTH_SESSIONS_ALL_REVOKED: "Đăng xuất khỏi mọi thiết bị",
  SCHOOL_CONTEXT_SELECTED: "Chuyển trường làm việc",
  SCHOOL_INVITATION_CREATED: "Tạo lời mời thành viên",
  SCHOOL_INVITATION_RESENT: "Gửi lại lời mời thành viên",
  SCHOOL_INVITATION_REVOKED: "Thu hồi lời mời thành viên",
  SCHOOL_INVITATION_ACCEPTED: "Chấp nhận lời mời thành viên",
  SCHOOL_MEMBERSHIP_ROLES_UPDATED: "Cập nhật vai trò thành viên",
  SCHOOL_MEMBERSHIP_SUSPENDED: "Tạm dừng thành viên",
  SCHOOL_MEMBERSHIP_REACTIVATED: "Kích hoạt lại thành viên",
  PARENT_STUDENT_LINK_CREATED: "Liên kết phụ huynh với học sinh",
  PARENT_STUDENT_LINK_REVOKED: "Gỡ liên kết phụ huynh với học sinh",
  SCHOOL_SETTINGS_UPDATED: "Cập nhật cấu hình trường",
  PLATFORM_SCHOOL_PROVISIONED: "Khởi tạo trường mới",
  PLATFORM_SCHOOL_SUSPENDED: "Tạm dừng trường",
  PLATFORM_SCHOOL_RESTORED: "Khôi phục trường",
  USER_PROFILE_UPDATED: "Cập nhật hồ sơ cá nhân",
};

export function translateMembershipStatus(status: string): string {
  return membershipStatusLabels[status] ?? "Không xác định";
}

export function translatePlanCode(planCode: string): string {
  return planCodeLabels[planCode] ?? "Theo cấu hình";
}

export function translateAuditAction(action: string): string {
  return auditActionLabels[action] ?? "Hoạt động hệ thống";
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
