import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Button, LinkButton } from "@/components/ui/Button";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { createBookingAction } from "@/app/(app)/dashboard/mentoring/actions";
import { formatMentoringDate } from "@/lib/mentoring/ui";
import { getMentorProfile } from "@/lib/mentoring/directory-service";

export default async function MentorProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ mentorProfileId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ mentorProfileId }, query] = await Promise.all([params, searchParams]);
  const { actor } = await requireSchoolContext(permissions.mentorDirectoryRead);
  if (!actor.schoolId) notFound();
  const schoolId = actor.schoolId;
  const from = new Date();
  const to = new Date(from.getTime() + 14 * 24 * 60 * 60_000);
  const [profile, candidates] = await Promise.all([
    getMentorProfile(actor, mentorProfileId, { from, to }),
    actor.schoolRoles.includes("STUDENT")
      ? db.user.findMany({
          where: { id: actor.userId },
          select: { id: true, displayName: true },
        })
      : actor.schoolRoles.includes("PARENT_GUARDIAN")
        ? db.parentStudentLink
            .findMany({
              where: {
                schoolId,
                parentUserId: actor.userId,
                status: "ACTIVE",
              },
              select: { student: { select: { id: true, displayName: true } } },
            })
            .then((links) => links.map(({ student }) => student))
        : db.schoolMembership
            .findMany({
              where: {
                schoolId,
                status: "ACTIVE",
                roleAssignments: { some: { role: "STUDENT" } },
              },
              orderBy: { user: { displayName: "asc" } },
              take: 100,
              select: { user: { select: { id: true, displayName: true } } },
            })
            .then((memberships) => memberships.map(({ user }) => user)),
  ]);
  if (!profile) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Hồ sơ cố vấn"
        title={profile.user.displayName}
        description={profile.headline}
        actions={
          <LinkButton href="/dashboard/mentoring/mentors" variant="outline" size="sm">
            Quay lại danh bạ
          </LinkButton>
        }
      />

      {query.error === "conflict" ? (
        <Alert tone="warning" title="Khung giờ vừa có người đặt">
          Chọn một giờ khác hoặc đánh dấu tham gia danh sách chờ để được ưu tiên khi có chỗ trống.
        </Alert>
      ) : query.error === "invalid" ? (
        <Alert tone="danger" title="Thông tin đặt lịch chưa hợp lệ">
          Kiểm tra cố vấn, học sinh và khung giờ rồi thử lại.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-xl font-bold text-[var(--color-brand-800)]">
              {profile.user.displayName
                .split(/\s+/)
                .slice(-2)
                .map((part) => part[0])
                .join("")
                .toLocaleUpperCase("vi")}
            </div>
            <div>
              <Badge tone="success">Đã xác minh</Badge>
              <p className="mt-3 text-sm text-[var(--color-ink-500)]">
                {profile.yearsExperience} năm kinh nghiệm đồng hành
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm leading-7 text-[var(--color-ink-600)]">{profile.bio}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {profile.specialties.map(({ specialty }) => (
              <span key={specialty.slug} className="rounded-full bg-[var(--color-brand-50)] px-3 py-1.5 text-xs font-semibold text-[var(--color-brand-800)]">
                {specialty.name}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Chọn khung giờ</h2>
              <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                Slot hiển thị theo múi giờ Asia/Ho_Chi_Minh trong 14 ngày tới.
              </p>
            </div>
            <Badge tone="brand">{profile.slots.length} slot còn trống</Badge>
          </div>
          {profile.slots.length === 0 ? (
            <EmptyState
              title="Chưa có slot phù hợp"
              description="Cố vấn chưa mở thêm lịch trong khoảng thời gian này. Bạn có thể quay lại sau."
            />
          ) : candidates.length === 0 ? (
            <Alert tone="info" className="mt-5" title="Cần chọn học sinh">
              Tài khoản hiện tại chưa có học sinh phù hợp để đặt lịch.
            </Alert>
          ) : (
            <form action={createBookingAction} className="mt-5 space-y-5">
              <input type="hidden" name="mentorProfileId" value={profile.id} />
              <input
                type="hidden"
                name="appointmentTypeId"
                value={profile.appointmentTypes[0]?.id}
              />
              <input type="hidden" name="timezone" value="Asia/Ho_Chi_Minh" />
              <Field id="studentUserId" label="Học sinh" required>
                <Select id="studentUserId" name="studentUserId" required>
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.displayName}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id="startsAt" label="Khung giờ" required>
                <Select id="startsAt" name="startsAt" required>
                  {profile.slots.map((slot) => (
                    <option key={slot.startsAt.toISOString()} value={slot.startsAt.toISOString()}>
                      {formatMentoringDate(slot.startsAt)} — còn {slot.remainingCapacity} chỗ
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                id="studentMessage"
                label="Điều muốn trao đổi"
                description="Không ghi thông tin nhạy cảm; nội dung này sẽ hiển thị trong yêu cầu đặt lịch."
              >
                <Textarea id="studentMessage" name="studentMessage" maxLength={1000} />
              </Field>
              <label className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-warning-200)] bg-[var(--color-warning-50)] p-3 text-sm text-[var(--color-warning-900)]">
                <input
                  type="checkbox"
                  name="joinWaitlistOnConflict"
                  className="mt-0.5 h-4 w-4 accent-[var(--color-brand-700)]"
                />
                <span>
                  Nếu slot vừa đầy, cho tôi vào danh sách chờ theo thứ tự đăng ký.
                </span>
              </label>
              <Button type="submit">Gửi yêu cầu đặt lịch</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
