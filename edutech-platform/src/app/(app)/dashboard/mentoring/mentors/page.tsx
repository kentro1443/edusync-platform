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
        eyebrow="Danh bạ cố vấn"
        title="Tìm người đồng hành phù hợp"
        description="Lọc theo chuyên môn, đọc hồ sơ đã xác minh và chọn một khung giờ đang rảnh."
        actions={
          <LinkButton href="/dashboard/mentoring" variant="outline" size="sm">
            Về tổng quan
          </LinkButton>
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
                  <Badge tone="success">Đã xác minh</Badge>
                </div>
                <h3 className="mt-5 text-lg font-bold text-[var(--color-ink-900)]">
                  {mentor.user.displayName}
                </h3>
                <p className="mt-1 min-h-12 text-sm font-medium leading-6 text-[var(--color-brand-800)]">
                  {mentor.headline}
                </p>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-ink-500)]">
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
                    {mentor.yearsExperience} năm kinh nghiệm
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
