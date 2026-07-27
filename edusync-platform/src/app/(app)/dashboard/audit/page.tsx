import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { listSchoolAuditEvents } from "@/lib/reporting/audit-service";
import { parseReportRange } from "@/lib/reporting/reporting-domain";

const formatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    action?: string;
    entityType?: string;
    actor?: string;
  }>;
}) {
  const query = await searchParams;
  const { actor } = await requireSchoolContext(permissions.auditReadSchool);
  const range = parseReportRange(query.from, query.to);
  const filters = {
    from: range.from,
    to: range.to,
    action: query.action?.trim().slice(0, 80),
    entityType: query.entityType?.trim().slice(0, 80),
    actor: query.actor?.trim().slice(0, 80),
  };
  const events = await listSchoolAuditEvents(actor, filters);
  const exportParams = new URLSearchParams(
    Object.entries({
      from: range.from.toISOString().slice(0, 10),
      to: new Date(range.to.getTime() - 86_400_000).toISOString().slice(0, 10),
      action: filters.action,
      entityType: filters.entityType,
      actor: filters.actor,
    }).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kiểm toán"
        title="Ai đã làm gì, khi nào"
        description="Nhật ký chỉ đọc theo trường, tối đa 200 kết quả mới nhất trong khoảng lọc."
        actions={
          <LinkButton
            href={`/dashboard/audit/export?${exportParams}`}
            size="sm"
            prefetch={false}
          >
            Xuất CSV có audit
          </LinkButton>
        }
      />
      <Card>
        <form method="get" className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Field id="audit-from" label="Từ ngày">
            <Input
              id="audit-from"
              name="from"
              type="date"
              defaultValue={range.from.toISOString().slice(0, 10)}
            />
          </Field>
          <Field id="audit-to" label="Đến ngày">
            <Input
              id="audit-to"
              name="to"
              type="date"
              defaultValue={new Date(range.to.getTime() - 86_400_000)
                .toISOString()
                .slice(0, 10)}
            />
          </Field>
          <Field id="audit-actor" label="Người thao tác">
            <Input id="audit-actor" name="actor" defaultValue={filters.actor} />
          </Field>
          <Field id="audit-action" label="Hành động">
            <Input id="audit-action" name="action" defaultValue={filters.action} />
          </Field>
          <Field id="audit-entity" label="Loại đối tượng">
            <Input
              id="audit-entity"
              name="entityType"
              defaultValue={filters.entityType}
            />
          </Field>
          <button
            type="submit"
            className="min-h-11 self-end rounded-[var(--radius-md)] bg-[var(--color-brand-700)] px-4 text-sm font-semibold text-white"
          >
            Lọc nhật ký
          </button>
        </form>
      </Card>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Sự kiện kiểm toán</h2>
          <Badge tone="neutral">{events.length}</Badge>
        </div>
        {events.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[54rem] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-ink-200)]">
                  <th className="px-3 py-3">Thời gian</th>
                  <th className="px-3 py-3">Tác nhân</th>
                  <th className="px-3 py-3">Hành động</th>
                  <th className="px-3 py-3">Đối tượng</th>
                  <th className="px-3 py-3">Chi tiết</th>
                  <th className="px-3 py-3">Request ID</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-[var(--color-ink-100)]">
                    <td className="px-3 py-3 whitespace-nowrap">
                      {formatter.format(event.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold">
                        {event.actor?.displayName ?? event.actorType}
                      </p>
                      {event.actor?.email ? (
                        <p className="text-xs text-[var(--color-ink-500)]">
                          {event.actor.email}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      {event.beforeJson || event.afterJson ? (
                        <details>
                          <summary className="cursor-pointer font-semibold text-[var(--color-brand-700)]">
                            Xem thay đổi
                          </summary>
                          <pre className="mt-2 max-w-80 overflow-auto whitespace-pre-wrap rounded bg-[var(--color-ink-50)] p-2 text-[10px]">
                            {JSON.stringify(
                              {
                                before: event.beforeJson,
                                after: event.afterJson,
                              },
                              null,
                              2,
                            )}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-[var(--color-ink-400)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{event.action}</td>
                    <td className="px-3 py-3">
                      {event.entityType}
                      {event.entityId ? (
                        <span className="block font-mono text-[10px] text-[var(--color-ink-400)]">
                          {event.entityId}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 font-mono text-[10px] text-[var(--color-ink-500)]">
                      {event.requestId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div role="status" className="py-10 text-center text-sm text-[var(--color-ink-500)]">
            Không có sự kiện phù hợp bộ lọc.
          </div>
        )}
      </Card>
    </div>
  );
}
