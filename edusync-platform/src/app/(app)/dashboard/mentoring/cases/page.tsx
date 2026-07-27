import Link from "next/link";

import { createCaseAction } from "@/app/(app)/dashboard/mentoring/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import {
  listMentoringCaseCandidates,
  listMentoringCases,
} from "@/lib/mentoring/case-service";
import { translateCaseStatus } from "@/lib/mentoring/ui";

export default async function MentoringCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string; error?: string }>;
}) {
  const [{ actor }, params] = await Promise.all([
    requireSchoolContext(permissions.mentorAppointmentRead),
    searchParams,
  ]);
  const cases = await listMentoringCases(actor, {
    query: params.query,
    status: params.status,
  });
  const canCreateCase =
    actor.schoolRoles.includes("SCHOOL_ADMIN") ||
    actor.schoolRoles.includes("MENTOR_COUNSELOR") ||
    actor.schoolRoles.includes("TEACHER_STAFF");
  const candidates = canCreateCase
    ? await listMentoringCaseCandidates(actor)
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Hồ sơ tư vấn"
        title="Theo dõi hành trình học sinh"
        description="Một hồ sơ xuyên suốt mục tiêu, buổi gặp, công việc, giới thiệu và hoạt động đã được phân quyền."
        actions={<LinkButton href="/dashboard/mentoring" variant="outline" size="sm">Về tổng quan</LinkButton>}
      />

      {params.error ? <Alert tone={params.error === "forbidden" ? "danger" : "warning"} title={params.error === "forbidden" ? "Bạn không có quyền tạo hồ sơ" : "Thông tin hồ sơ chưa hợp lệ"} /> : null}

      <Card>
        <form method="get" className="grid gap-4 md:grid-cols-[1fr_12rem_auto] md:items-end">
          <div>
            <label htmlFor="query" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-800)]">Tìm hồ sơ hoặc học sinh</label>
            <Input id="query" name="query" defaultValue={params.query} placeholder="Ví dụ: thói quen học tập" />
          </div>
          <div>
            <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-800)]">Trạng thái</label>
            <Select id="status" name="status" defaultValue={params.status ?? ""}>
              <option value="">Tất cả</option>
              <option value="OPEN">Đang mở</option>
              <option value="ON_HOLD">Tạm giữ</option>
              <option value="CLOSED">Đã đóng</option>
            </Select>
          </div>
          <Button type="submit" variant="outline">Lọc hồ sơ</Button>
        </form>
      </Card>

      {canCreateCase && candidates ? (
        <Card>
          <details>
            <summary className="cursor-pointer list-none text-base font-bold text-[var(--color-ink-900)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-500)]">
              <span className="inline-flex items-center gap-2">+ Tạo hồ sơ tư vấn mới</span>
            </summary>
            <form action={createCaseAction} className="mt-6 grid gap-4 border-t border-[var(--color-ink-100)] pt-6 md:grid-cols-2">
              <Field id="studentUserId" label="Học sinh" required>
                <Select id="studentUserId" name="studentUserId" required>
                  <option value="">Chọn học sinh</option>
                  {candidates.students.map((student) => <option key={student.id} value={student.id}>{student.displayName}</option>)}
                </Select>
              </Field>
              <Field id="mentorProfileId" label="Cố vấn chính" required>
                <Select id="mentorProfileId" name="mentorProfileId" required>
                  <option value="">Chọn cố vấn</option>
                  {candidates.mentors.map((mentor) => <option key={mentor.id} value={mentor.id}>{mentor.user.displayName}</option>)}
                </Select>
              </Field>
              <Field id="title" label="Tên hồ sơ" required className="md:col-span-2">
                <Input id="title" name="title" minLength={3} maxLength={180} placeholder="Ví dụ: Kế hoạch thích nghi học kỳ mới" required />
              </Field>
              <Field id="summary" label="Tóm tắt" className="md:col-span-2">
                <Textarea id="summary" name="summary" maxLength={2000} />
              </Field>
              <Field id="priority" label="Mức ưu tiên">
                <Select id="priority" name="priority" defaultValue="NORMAL">
                  <option value="LOW">Thấp</option>
                  <option value="NORMAL">Bình thường</option>
                  <option value="HIGH">Cao</option>
                </Select>
              </Field>
              <div className="flex items-end"><Button type="submit">Tạo hồ sơ</Button></div>
            </form>
          </details>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-ink-100)] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Danh sách hồ sơ</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-500)]">{cases.length} hồ sơ trong phạm vi của bạn</p>
          </div>
          <Badge tone="brand">Tenant-scoped</Badge>
        </div>
        {cases.length === 0 ? (
          <EmptyState title="Chưa có hồ sơ phù hợp" description="Tạo hồ sơ mới hoặc đổi bộ lọc để xem các hồ sơ đang theo dõi." />
        ) : (
          <div className="mt-2 divide-y divide-[var(--color-ink-100)]">
            {cases.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div className="min-w-0">
                  <Link href={`/dashboard/mentoring/cases/${item.id}`} className="text-base font-bold text-[var(--color-ink-900)] hover:text-[var(--color-brand-700)] hover:underline">
                    {item.title}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                    {item.student.displayName} · Cố vấn {item.primaryMentor.user.displayName}
                  </p>
                  <p className="mt-2 text-xs text-[var(--color-ink-400)]">
                    {item._count.goals} mục tiêu · {item._count.sessionOutcomes} buổi gặp · {item._count.tasks} việc
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={item.status === "OPEN" ? "success" : item.status === "ON_HOLD" ? "warning" : "neutral"}>
                    {translateCaseStatus(item.status)}
                  </Badge>
                  <span className="rounded-full bg-[var(--color-ink-100)] px-2.5 py-1 text-xs font-semibold text-[var(--color-ink-600)]">{item.priority}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
