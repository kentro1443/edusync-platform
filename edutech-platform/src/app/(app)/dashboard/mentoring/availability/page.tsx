import { addAvailabilityExceptionAction, addAvailabilityRuleAction } from "@/app/(app)/dashboard/mentoring/actions";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { formatMentoringDate } from "@/lib/mentoring/ui";

const weekdays = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ mentor?: string; result?: string; error?: string }>;
}) {
  const [{ actor }, params] = await Promise.all([
    requireSchoolContext(permissions.mentorAvailabilityManage),
    searchParams,
  ]);
  if (!actor.schoolId) notFound();
  const schoolId = actor.schoolId;
  const profiles = await db.mentorProfile.findMany({
    where: {
      schoolId,
      active: true,
      ...(actor.schoolRoles.includes("MENTOR_COUNSELOR")
        ? { userId: actor.userId }
        : {}),
    },
    orderBy: { user: { displayName: "asc" } },
    select: {
      id: true,
      user: { select: { displayName: true } },
      availabilityRules: {
        where: { active: true },
        orderBy: [{ weekday: "asc" }, { startsAtLocal: "asc" }],
      },
      availabilityExceptions: {
        where: { endsAt: { gt: new Date() } },
        orderBy: { startsAt: "asc" },
      },
    },
  });
  const profile = profiles.find(({ id }) => id === params.mentor) ?? profiles[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Lịch rảnh"
        title="Mở và bảo vệ khung giờ"
        description="Quy tắc lặp theo tuần tạo slot; exception giúp khóa một khoảng cụ thể mà không sửa lịch nền."
      />
      {params.result ? <Alert tone="success" title="Đã cập nhật lịch rảnh" /> : null}
      {params.error ? <Alert tone="danger" title="Không thể cập nhật lịch rảnh" /> : null}

      {profiles.length === 0 ? (
        <Card>
          <EmptyState
            title="Chưa có hồ sơ cố vấn"
            description="Tạo hoặc xác minh hồ sơ cố vấn trước khi mở lịch."
          />
        </Card>
      ) : (
        <>
          {profiles.length > 1 ? (
            <Card>
              <form method="get" className="flex flex-wrap items-end gap-3">
                <div className="min-w-64 flex-1">
                  <label htmlFor="mentor" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-800)]">
                    Hồ sơ đang chỉnh
                  </label>
                  <Select id="mentor" name="mentor" defaultValue={profile?.id}>
                    {profiles.map((item) => <option key={item.id} value={item.id}>{item.user.displayName}</option>)}
                  </Select>
                </div>
                <Button type="submit" variant="outline">Chọn hồ sơ</Button>
              </form>
            </Card>
          ) : null}
          {profile ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Quy tắc hàng tuần</h2>
                    <p className="mt-1 text-sm text-[var(--color-ink-500)]">{profile.user.displayName}</p>
                  </div>
                  <Badge tone="brand">{profile.availabilityRules.length} quy tắc</Badge>
                </div>
                {profile.availabilityRules.length === 0 ? (
                  <EmptyState title="Chưa mở lịch" description="Thêm quy tắc đầu tiên bên dưới." />
                ) : (
                  <ul className="mt-5 space-y-2">
                    {profile.availabilityRules.map((rule) => (
                      <li key={rule.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-ink-50)] px-3.5 py-3 text-sm">
                        <span className="font-semibold text-[var(--color-ink-800)]">{weekdays[rule.weekday]}</span>
                        <span className="text-[var(--color-ink-600)]">{rule.startsAtLocal} – {rule.endsAtLocal} · {rule.timezone}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <form action={addAvailabilityRuleAction} className="mt-6 space-y-4 border-t border-[var(--color-ink-100)] pt-6">
                  <input type="hidden" name="mentorProfileId" value={profile.id} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="weekday" label="Ngày trong tuần" required>
                      <Select id="weekday" name="weekday" defaultValue="1" required>
                        {weekdays.map((weekday, index) => <option key={weekday} value={index}>{weekday}</option>)}
                      </Select>
                    </Field>
                    <Field id="capacity" label="Số chỗ" required>
                      <Input id="capacity" name="capacity" type="number" min={1} max={10} defaultValue={1} required />
                    </Field>
                    <Field id="startsAtLocal" label="Bắt đầu" required>
                      <Input id="startsAtLocal" name="startsAtLocal" type="time" defaultValue="09:00" required />
                    </Field>
                    <Field id="endsAtLocal" label="Kết thúc" required>
                      <Input id="endsAtLocal" name="endsAtLocal" type="time" defaultValue="16:00" required />
                    </Field>
                  </div>
                  <Field id="timezone" label="Múi giờ" required>
                    <Input id="timezone" name="timezone" defaultValue="Asia/Ho_Chi_Minh" required />
                  </Field>
                  <Button type="submit" size="sm">Thêm quy tắc</Button>
                </form>
              </Card>

              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Ngoại lệ sắp tới</h2>
                    <p className="mt-1 text-sm text-[var(--color-ink-500)]">Khóa tạm thời một khoảng đã mở.</p>
                  </div>
                  <Badge tone="warning">{profile.availabilityExceptions.length} ngoại lệ</Badge>
                </div>
                {profile.availabilityExceptions.length === 0 ? (
                  <EmptyState title="Không có ngoại lệ" description="Lịch nền đang được giữ nguyên." />
                ) : (
                  <ul className="mt-5 space-y-2">
                    {profile.availabilityExceptions.map((exception) => (
                      <li key={exception.id} className="rounded-[var(--radius-md)] border border-[var(--color-warning-200)] bg-[var(--color-warning-50)] px-3.5 py-3 text-sm text-[var(--color-warning-900)]">
                        <p className="font-semibold">{formatMentoringDate(exception.startsAt)} – {formatMentoringDate(exception.endsAt)}</p>
                        <p className="mt-1">{exception.reason || "Tạm khóa lịch"}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <form action={addAvailabilityExceptionAction} className="mt-6 space-y-4 border-t border-[var(--color-ink-100)] pt-6">
                  <input type="hidden" name="mentorProfileId" value={profile.id} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="startsAt" label="Bắt đầu khóa" required>
                      <Input id="startsAt" name="startsAt" type="datetime-local" required />
                    </Field>
                    <Field id="endsAt" label="Kết thúc khóa" required>
                      <Input id="endsAt" name="endsAt" type="datetime-local" required />
                    </Field>
                  </div>
                  <Field id="reason" label="Lý do">
                    <Input id="reason" name="reason" maxLength={180} placeholder="Ví dụ: họp chuyên môn" />
                  </Field>
                  <Button type="submit" variant="outline" size="sm">Thêm ngoại lệ</Button>
                </form>
              </Card>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
