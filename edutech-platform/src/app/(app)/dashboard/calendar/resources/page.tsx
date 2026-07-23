import {
  createBlockedPeriodAction,
  createBookableResourceAction,
  deleteBlockedPeriodAction,
  updateBookableResourceAction,
} from "@/app/(app)/dashboard/calendar/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Field, Input, Select } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { listBookableResources } from "@/lib/calendar/calendar-service";

const dateTime = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

export default async function CalendarResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; error?: string }>;
}) {
  const [{ actor }, params] = await Promise.all([
    requireSchoolContext(permissions.calendarSchoolManage),
    searchParams,
  ]);
  const resources = await listBookableResources(actor);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lịch & cơ sở vật chất"
        title="Phòng và tài nguyên đặt chỗ"
        description="Quản lý sức chứa, trạng thái hoạt động và khoảng thời gian bảo trì để tránh trùng lịch."
        actions={<LinkButton href="/dashboard/calendar" variant="outline" size="sm">Quay lại lịch</LinkButton>}
      />
      {params.result ? <Alert tone="success" title="Đã cập nhật tài nguyên">Thay đổi đã được lưu.</Alert> : null}
      {params.error ? <Alert tone={params.error === "conflict" ? "warning" : "danger"} title={params.error === "conflict" ? "Khung giờ đã có sự kiện" : "Không thể cập nhật"}>Kiểm tra lại dữ liệu và khung giờ.</Alert> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Danh mục tài nguyên</h2>
          {resources.length === 0 ? <EmptyState title="Chưa có tài nguyên" description="Tạo phòng học, hội trường hoặc thiết bị đầu tiên." /> : <ul className="mt-4 divide-y divide-[var(--color-ink-100)]">{resources.map((resource) => <li key={resource.id} className="py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="font-bold text-[var(--color-ink-900)]">{resource.name}</h3><Badge tone={resource.active ? "success" : "neutral"}>{resource.active ? "Đang mở" : "Tạm đóng"}</Badge></div><p className="mt-1 text-sm text-[var(--color-ink-500)]">{resource.kind} · sức chứa {resource.capacity} · {resource._count.events} sự kiện</p></div><form action={updateBookableResourceAction} className="flex items-end gap-2"><input type="hidden" name="resourceId" value={resource.id} /><input type="hidden" name="active" value={resource.active ? "false" : "true"} /><Field id={`capacity-${resource.id}`} label="Sức chứa"><Input id={`capacity-${resource.id}`} name="capacity" type="number" min="1" max="10000" defaultValue={resource.capacity} className="w-24" /></Field><Button type="submit" size="sm" variant="outline">{resource.active ? "Tạm đóng" : "Mở lại"}</Button></form></div>{resource.blockedPeriods.length ? <ul className="mt-4 space-y-2">{resource.blockedPeriods.map((period) => <li key={period.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-warning-50)] px-3 py-2 text-sm"><span><strong>{dateTime.format(period.startsAt)}</strong> – {dateTime.format(period.endsAt)}{period.reason ? ` · ${period.reason}` : ""}</span><form action={deleteBlockedPeriodAction}><input type="hidden" name="blockedPeriodId" value={period.id} /><Button type="submit" size="sm" variant="ghost">Gỡ khóa</Button></form></li>)}</ul> : null}</li>)}</ul>}
        </Card>
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Thêm tài nguyên</h2>
            <form action={createBookableResourceAction} className="mt-4 space-y-4">
              <Field id="name" label="Tên" required><Input id="name" name="name" required maxLength={120} placeholder="Phòng STEM 204" /></Field>
              <Field id="kind" label="Loại"><Select id="kind" name="kind" defaultValue="ROOM"><option value="ROOM">Phòng học</option><option value="HALL">Hội trường</option><option value="EQUIPMENT">Thiết bị</option></Select></Field>
              <Field id="capacity" label="Sức chứa" required><Input id="capacity" name="capacity" type="number" min="1" max="10000" defaultValue="30" required /></Field>
              <Button type="submit" className="w-full">Thêm tài nguyên</Button>
            </form>
          </Card>
          <Card>
            <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Khóa khung giờ</h2>
            <form action={createBlockedPeriodAction} className="mt-4 space-y-4">
              <Field id="resourceId" label="Tài nguyên" required><Select id="resourceId" name="resourceId" required>{resources.filter((resource) => resource.active).map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</Select></Field>
              <Field id="startsAt" label="Bắt đầu" required><Input id="startsAt" name="startsAt" type="datetime-local" required /></Field>
              <Field id="endsAt" label="Kết thúc" required><Input id="endsAt" name="endsAt" type="datetime-local" required /></Field>
              <Field id="reason" label="Lý do"><Input id="reason" name="reason" maxLength={300} placeholder="Bảo trì thiết bị" /></Field>
              <Button type="submit" variant="outline" className="w-full" disabled={resources.length === 0}>Khóa khung giờ</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
