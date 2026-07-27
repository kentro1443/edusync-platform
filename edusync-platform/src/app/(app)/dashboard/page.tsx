import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { getPrimaryRoleLabel, translateRole } from "@/components/app/shell-utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  BuildingIcon,
  CheckIcon,
  MentorIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { activeSchoolCookieName } from "@/lib/auth/cookies";
import { getCurrentSession } from "@/lib/auth/current-session";
import { getSchoolPermissions } from "@/lib/auth/permissions";
import { selectSchoolAuthorizationContext } from "@/lib/auth/session";
import {
  getPlatformDashboard,
  getSchoolDashboard,
} from "@/lib/reporting/dashboard-service";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?returnTo=/dashboard");

  const cookieStore = await cookies();
  const requestedSchoolSlug = cookieStore.get(activeSchoolCookieName)?.value;
  const activeSchool =
    session.schoolContexts.find(
      (context) => context.schoolSlug === requestedSchoolSlug,
    ) ??
    (session.schoolContexts.length === 1 ? session.schoolContexts[0] : undefined);
  if (!activeSchool && session.platformRoles.length === 0) {
    redirect("/membership-inactive");
  }
  const roles = activeSchool?.roles ?? session.platformRoles;
  const permissionCount = activeSchool
    ? getSchoolPermissions(activeSchool.roles).length
    : 0;
  const primaryRole = getPrimaryRoleLabel(roles);
  const actor = activeSchool
    ? selectSchoolAuthorizationContext(session, activeSchool.schoolSlug)
    : null;
  const schoolDashboard = actor ? await getSchoolDashboard(actor) : null;
  const platformDashboard = !activeSchool ? await getPlatformDashboard() : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={activeSchool ? "Không gian nhà trường" : "Phạm vi nền tảng"}
        title={`Xin chào, ${session.user.displayName}`}
        description={
          activeSchool
            ? `Bạn đang làm việc tại ${activeSchool.schoolName} với vai trò ${primaryRole.toLocaleLowerCase("vi")}.`
            : "Bạn đang ở phạm vi quản trị toàn nền tảng. Mọi thay đổi cần được kiểm tra kỹ trước khi xác nhận."
        }
        actions={
          session.schoolContexts.length > 1 ? (
            <Link
              href="/chon-truong"
              className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-ink-300)] bg-white px-4 text-sm font-semibold text-[var(--color-ink-700)] hover:bg-[var(--color-ink-50)]"
            >
              Đổi trường
            </Link>
          ) : undefined
        }
      />

      {!activeSchool ? (
        <div role="alert" className="flex gap-3 rounded-[var(--radius-lg)] border border-[var(--color-warning-300)] bg-[var(--color-warning-50)] p-4 text-sm text-[var(--color-warning-900)]">
          <ShieldIcon className="mt-0.5 shrink-0" width={20} height={20} aria-hidden="true" />
          <div>
            <p className="font-semibold">Bạn đang thao tác ở phạm vi nền tảng</p>
            <p className="mt-1 leading-6">Chỉ dùng phạm vi này cho cấu hình liên trường. Dữ liệu của từng trường phải được xử lý trong đúng ngữ cảnh trường.</p>
          </div>
        </div>
      ) : null}

      <section aria-labelledby="context-heading">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="context-heading" className="text-lg font-bold text-[var(--color-ink-900)]">Ngữ cảnh truy cập</h2>
          <Badge tone="success">Đang hoạt động</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <BuildingIcon width={22} height={22} className="text-[var(--color-brand-700)]" aria-hidden="true" />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-400)]">Phạm vi hiện tại</p>
            <p className="mt-1 text-lg font-bold text-[var(--color-ink-900)]">{activeSchool?.schoolName ?? "Toàn nền tảng"}</p>
          </Card>
          <Card>
            <MentorIcon width={22} height={22} className="text-[var(--color-brand-700)]" aria-hidden="true" />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-400)]">Vai trò chính</p>
            <p className="mt-1 text-lg font-bold text-[var(--color-ink-900)]">{primaryRole}</p>
          </Card>
          <Card>
            <ShieldIcon width={22} height={22} className="text-[var(--color-brand-700)]" aria-hidden="true" />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-400)]">Quyền hiệu lực</p>
            <p className="mt-1 text-lg font-bold text-[var(--color-ink-900)]">{activeSchool ? `${permissionCount} quyền` : "Quyền nền tảng"}</p>
          </Card>
          <Card>
            <CheckIcon width={22} height={22} className="text-[var(--color-success-600)]" aria-hidden="true" />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-400)]">Tài khoản</p>
            <p className="mt-1 text-lg font-bold text-[var(--color-ink-900)]">Đã xác thực</p>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">
            Việc cần ưu tiên
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-ink-500)]">
            Sắp xếp theo số lượng việc thật đang chờ trong phạm vi hiện tại.
          </p>
          {schoolDashboard ? (
            <ol className="mt-5 divide-y divide-[var(--color-ink-100)]">
              {schoolDashboard.actions.map((action) => (
                <li key={action.key}>
                  <Link
                    href={action.href}
                    className="group flex items-center gap-4 px-2 py-4 hover:bg-[var(--color-ink-50)]"
                  >
                    <span className="flex h-11 min-w-11 items-center justify-center rounded-full bg-[var(--color-brand-100)] px-2 text-sm font-black text-[var(--color-brand-900)]">
                      {action.count}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold group-hover:text-[var(--color-brand-800)]">
                        {action.label}
                      </span>
                      <span className="mt-0.5 block text-sm text-[var(--color-ink-500)]">
                        {action.description}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : platformDashboard ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Trường hoạt động", platformDashboard.activeSchools],
                ["Thành viên hoạt động", platformDashboard.activeMembers],
                ["Domain event lỗi", platformDashboard.failedDomainEvents],
                ["Email outbox lỗi", platformDashboard.failedEmails],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-[var(--radius-md)] bg-[var(--color-ink-50)] p-4"
                >
                  <p className="text-sm text-[var(--color-ink-500)]">{label}</p>
                  <p className="mt-1 text-2xl font-black">{String(value)}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">
            {schoolDashboard ? "Ngữ cảnh nghiệp vụ" : "Vai trò được cấp"}
          </h2>
          {schoolDashboard ? (
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex justify-between gap-3 border-b border-[var(--color-ink-100)] pb-3">
                <span>Cuộc trò chuyện</span>
                <strong>{schoolDashboard.context.conversations}</strong>
              </li>
              <li className="flex justify-between gap-3 border-b border-[var(--color-ink-100)] pb-3">
                <span>Tài liệu đã xuất bản</span>
                <strong>{schoolDashboard.context.publishedResources}</strong>
              </li>
              <li className="flex justify-between gap-3">
                <span>CLB đang tham gia</span>
                <strong>{schoolDashboard.context.clubMemberships}</strong>
              </li>
            </ul>
          ) : null}
          <ul className="mt-4 space-y-2">
            {roles.map((role) => (
              <li key={role} className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand-50)] px-3 py-2.5 text-sm font-medium text-[var(--color-brand-900)]">
                <CheckIcon width={16} height={16} aria-hidden="true" />
                {translateRole(role)}
              </li>
            ))}
          </ul>
          <Link href="/help" className="mt-5 inline-flex text-sm font-semibold text-[var(--color-brand-700)] hover:underline">Tìm hiểu về quyền truy cập</Link>
        </Card>
      </div>
    </div>
  );
}
