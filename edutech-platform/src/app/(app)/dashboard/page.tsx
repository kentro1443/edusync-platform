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
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Mô-đun của bạn</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-ink-500)]">Các mô-đun nghiệp vụ sẽ xuất hiện khi được nhà trường kích hoạt. Không có liên kết giả hoặc dữ liệu minh họa trong không gian vận hành.</p>
          <div className="mt-5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-ink-300)] bg-[var(--color-ink-50)] px-5 py-8 text-center">
            <p className="font-semibold text-[var(--color-ink-800)]">Chưa có mô-đun nghiệp vụ được kích hoạt</p>
            <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-[var(--color-ink-500)]">Quản trị viên có thể hoàn thiện danh tính, thành viên và phân quyền trước khi bật các mô-đun chuyên môn.</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Vai trò được cấp</h2>
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
