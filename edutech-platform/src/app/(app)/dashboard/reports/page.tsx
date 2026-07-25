import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { parseReportRange } from "@/lib/reporting/reporting-domain";
import { getSchoolOperationsReport } from "@/lib/reporting/reporting-service";
import { ReportSavedView } from "./ReportSavedView";

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatBytes(bytes: bigint) {
  const value = Number(bytes);
  if (value < 1024 * 1024) return `${Math.max(0, value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const query = await searchParams;
  const { actor, school } = await requireSchoolContext(permissions.schoolReportRead);
  const range = parseReportRange(query.from, query.to);
  const report = await getSchoolOperationsReport(actor, range);
  const inclusiveTo = new Date(range.to.getTime() - 86_400_000);
  const queryString = new URLSearchParams({
    from: dateValue(range.from),
    to: dateValue(inclusiveTo),
  }).toString();
  const currentHref = `/dashboard/reports?${queryString}`;
  const maxValue = Math.max(...report.metrics.map((metric) => metric.value), 1);
  const usagePercent =
    report.usage.storageQuotaBytes > BigInt(0)
      ? Math.min(
          100,
          Number(
            (report.usage.storageBytes * BigInt(10_000)) /
              report.usage.storageQuotaBytes,
          ) / 100,
        )
      : 100;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Báo cáo vận hành"
        title={`Dữ liệu thật tại ${school.schoolName}`}
        description="Theo dõi khối lượng công việc, mức tham gia và việc cần xử lý; mọi truy vấn đều khóa theo trường hiện tại."
        actions={
          <div className="flex flex-wrap gap-2">
            <ReportSavedView
              storageKey={`edutech:report-view:${school.schoolId}`}
              currentHref={currentHref}
            />
            <LinkButton
              href={`/dashboard/reports/export?${queryString}`}
              size="sm"
              prefetch={false}
            >
              Xuất CSV
            </LinkButton>
          </div>
        }
      />

      <Card>
        <form method="get" className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <Field id="report-from" label="Từ ngày">
            <Input
              id="report-from"
              name="from"
              type="date"
              defaultValue={dateValue(range.from)}
            />
          </Field>
          <Field id="report-to" label="Đến ngày">
            <Input
              id="report-to"
              name="to"
              type="date"
              defaultValue={dateValue(inclusiveTo)}
            />
          </Field>
          <button
            type="submit"
            className="min-h-11 self-end rounded-[var(--radius-md)] bg-[var(--color-brand-700)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-brand-800)]"
          >
            Áp dụng
          </button>
        </form>
      </Card>

      <section aria-labelledby="report-overview">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="report-overview" className="text-lg font-bold">
            Tổng quan theo mô-đun
          </h2>
          <Badge tone="neutral">
            {dateValue(range.from)} – {dateValue(inclusiveTo)}
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {report.metrics.map((metric) => (
            <Card key={metric.key}>
              <p className="text-sm font-semibold text-[var(--color-ink-600)]">
                {metric.label}
              </p>
              <p className="mt-3 text-3xl font-black text-[var(--color-ink-950)]">
                {metric.value.toLocaleString("vi-VN")}
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink-500)]">{metric.detail}</p>
              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-ink-100)]"
                role="img"
                aria-label={`${metric.label}: ${metric.value}`}
              >
                <span
                  className="block h-full rounded-full bg-[var(--color-brand-600)]"
                  style={{ width: `${Math.max(4, (metric.value / maxValue) * 100)}%` }}
                />
              </div>
              <Link
                href={metric.href}
                className="mt-4 inline-flex text-sm font-semibold text-[var(--color-brand-700)] hover:underline"
              >
                Mở mô-đun
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <h2 className="text-lg font-bold">Bảng dữ liệu thay thế</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">
            Cùng dữ liệu với biểu đồ, đọc được bằng trình đọc màn hình.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-ink-200)]">
                  <th className="px-3 py-3">Mô-đun</th>
                  <th className="px-3 py-3 text-right">Chỉ số</th>
                  <th className="px-3 py-3">Ngữ cảnh</th>
                </tr>
              </thead>
              <tbody>
                {report.metrics.map((metric) => (
                  <tr key={metric.key} className="border-b border-[var(--color-ink-100)]">
                    <td className="px-3 py-3 font-semibold">{metric.label}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{metric.value}</td>
                    <td className="px-3 py-3 text-[var(--color-ink-500)]">
                      {metric.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Dung lượng trường</h2>
          <p className="mt-3 text-2xl font-black">
            {formatBytes(report.usage.storageBytes)}
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">
            {report.usage.storedFileCount} tệp · hạn mức{" "}
            {formatBytes(report.usage.storageQuotaBytes)}
          </p>
          <div
            className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--color-ink-100)]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(usagePercent)}
            aria-label="Mức sử dụng dung lượng"
          >
            <span
              className="block h-full rounded-full bg-[var(--color-brand-600)]"
              style={{ width: `${Math.max(1, usagePercent)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--color-ink-500)]">
            {usagePercent.toFixed(2)}% đã sử dụng
          </p>
        </Card>
      </div>
    </div>
  );
}
