import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Field";
import { LinkButton } from "@/components/ui/Button";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { listMentorProfiles } from "@/lib/mentoring/directory-service";
import { formatVnd } from "@/lib/marketplace/ui";

export default async function MentorDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; specialty?: string }>;
}) {
  const [{ actor }, params] = await Promise.all([
    requireSchoolContext(permissions.mentorDirectoryRead),
    searchParams,
  ]);
  const mentors = await listMentorProfiles(actor, {
    query: params.query,
    specialtySlug: params.specialty,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Danh bạ cố vấn ngang hàng"
        title="Tìm anh chị khóa trên phù hợp"
        description="Lọc theo chuyên môn (SAT, IELTS, du học…), xem thành tích đã xác minh và mức phí tham khảo, rồi đăng yêu cầu để nhận đề xuất."
        actions={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/dashboard/mentoring/marketplace?tab=requests" size="sm">
              Đăng yêu cầu tìm cố vấn
            </LinkButton>
            <LinkButton href="/dashboard/mentoring" variant="outline" size="sm">
              Về tổng quan
            </LinkButton>
          </div>
        }
      />

      <Card>
        <form method="get" className="grid gap-4 md:grid-cols-[1fr_12rem_auto] md:items-end">
          <div>
            <label htmlFor="query" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-800)]">
              Tìm theo tên hoặc chuyên môn
            </label>
            <Input
              id="query"
              name="query"
              defaultValue={params.query}
              placeholder="Ví dụ: định hướng học tập"
            />
          </div>
          <div>
            <label htmlFor="specialty" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-800)]">
              Mã chuyên môn
            </label>
            <Input id="specialty" name="specialty" defaultValue={params.specialty} placeholder="tam-ly-hoc-duong" />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-700)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-brand-800)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-500)]"
          >
            Tìm cố vấn
          </button>
        </form>
      </Card>

      {mentors.length === 0 ? (
        <Card>
          <EmptyState
            title="Chưa tìm thấy cố vấn phù hợp"
            description="Thử bỏ bớt bộ lọc hoặc tìm theo một từ khóa rộng hơn."
          />
        </Card>
      ) : (
        <section aria-labelledby="mentor-results-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="mentor-results-heading" className="text-lg font-bold text-[var(--color-ink-900)]">
              {mentors.length} hồ sơ đã xác minh
            </h2>
            <Badge tone="success">Dữ liệu trong trường hiện tại</Badge>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {mentors.map((mentor) => (
              <Card key={mentor.id} className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-lg font-bold text-[var(--color-brand-800)]">
                    {mentor.user.displayName
                      .split(/\s+/)
                      .slice(-2)
                      .map((part) => part[0])
                      .join("")
                      .toLocaleUpperCase("vi")}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge tone="success">Đã xác minh</Badge>
                    {mentor.certifiedByUnion ? (
                      <Badge tone="brand">Chứng nhận Liên chi Đoàn</Badge>
                    ) : null}
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-bold text-[var(--color-ink-900)]">
                  {mentor.user.displayName}
                  {mentor.gradeLabel ? (
                    <span className="ml-2 text-sm font-medium text-[var(--color-ink-400)]">
                      {mentor.gradeLabel}
                    </span>
                  ) : null}
                </h3>
                <p className="mt-1 min-h-12 text-sm font-medium leading-6 text-[var(--color-brand-800)]">
                  {mentor.headline}
                </p>
                {mentor.achievements.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {mentor.achievements.slice(0, 3).map((achievement) => (
                      <li
                        key={achievement}
                        className="rounded-full bg-[var(--color-warning-100)] px-2.5 py-1 text-xs font-semibold text-[var(--color-warning-700)]"
                      >
                        🏅 {achievement}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-ink-500)]">
                  {mentor.bio}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {mentor.specialties.map(({ specialty }) => (
                    <span key={specialty.slug} className="rounded-full bg-[var(--color-ink-100)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-700)]">
                      {specialty.name}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--color-ink-100)] pt-5">
                  <p className="text-xs text-[var(--color-ink-500)]">
                    {mentor.hourlyRateMinVnd
                      ? `${formatVnd(mentor.hourlyRateMinVnd)}–${formatVnd(mentor.hourlyRateMaxVnd)}/buổi`
                      : `${mentor.yearsExperience} năm kinh nghiệm`}
                  </p>
                  <Link
                    href={`/dashboard/mentoring/mentors/${mentor.id}`}
                    className="text-sm font-semibold text-[var(--color-brand-700)] hover:underline"
                  >
                    Xem hồ sơ →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
