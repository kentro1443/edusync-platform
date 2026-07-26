import { updateSchoolSettingsAction } from "@/app/(app)/dashboard/admin/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Field, Input } from "@/components/ui/Field";
import { getSchoolSettings } from "@/lib/admin/school-admin";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { getSchoolStorageQuotaUsage } from "@/lib/storage/storage-quota";

function formatBytes(bytes: bigint): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Number(bytes);
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default async function SchoolSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ actor }, params] = await Promise.all([requireSchoolContext(permissions.schoolSettingsRead), searchParams]);
  const school = await getSchoolSettings(actor);
  if (!school) return null;
  const settings = typeof school.settingsJson === "object" && school.settingsJson && !Array.isArray(school.settingsJson) ? school.settingsJson as Record<string, unknown> : {};
  const quota = await getSchoolStorageQuotaUsage(school.id);
  const quotaPercent = Math.round(quota.usedRatio * 100);
  const quotaTone = quota.usedRatio >= 0.9 ? "text-[var(--color-danger-600)]" : quota.usedRatio >= 0.7 ? "text-[var(--color-warning-600)]" : "text-[var(--color-success-600)]";
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Quản trị trường" title="Cài đặt trường" description="Thông tin nhận diện dùng xuyên suốt trong không gian vận hành." />
      <Card className="max-w-2xl">
        <h2 className="text-base font-bold text-[var(--color-ink-900)]">Dung lượng lưu trữ</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          Đã dùng <span className={`font-semibold ${quotaTone}`}>{formatBytes(quota.usedBytes)}</span> / {formatBytes(quota.quotaBytes)} ({quotaPercent}%)
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-ink-100)]" role="progressbar" aria-valuenow={quotaPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Dung lượng lưu trữ đã dùng">
          <div className={`h-full rounded-full ${quota.usedRatio >= 0.9 ? "bg-[var(--color-danger-500)]" : quota.usedRatio >= 0.7 ? "bg-[var(--color-warning-500)]" : "bg-[var(--color-success-500)]"}`} style={{ width: `${quotaPercent}%` }} />
        </div>
        {quota.usedRatio >= 0.9 ? (
          <p className="mt-2 text-xs font-medium text-[var(--color-danger-600)]">Sắp đạt hạn mức. Tải lên có thể bị từ chối; hãy xóa tệp không còn dùng hoặc liên hệ quản trị nền tảng để tăng hạn mức.</p>
        ) : null}
      </Card>
      <Card className="max-w-2xl">
        {params.saved === "1" ? <Alert className="mb-5" tone="success" title="Đã lưu cài đặt trường" /> : null}
        {params.error === "invalid" ? <Alert className="mb-5" tone="danger" title="Thông tin trường chưa hợp lệ" /> : null}
        <form action={updateSchoolSettingsAction} className="space-y-5">
          <Field id="name" label="Tên đầy đủ" required><Input id="name" name="name" defaultValue={school.name} minLength={3} maxLength={180} required /></Field>
          <Field id="shortName" label="Tên rút gọn" required><Input id="shortName" name="shortName" defaultValue={school.shortName} minLength={2} maxLength={80} required /></Field>
          <Field id="slug" label="Định danh trường" description="Định danh ổn định; liên hệ quản trị nền tảng nếu cần thay đổi."><Input id="slug" value={school.slug} disabled readOnly /></Field>
          <Field id="contactEmail" label="Email liên hệ"><Input id="contactEmail" name="contactEmail" type="email" defaultValue={typeof settings.contactEmail === "string" ? settings.contactEmail : ""} /></Field>
          <Button type="submit">Lưu cài đặt</Button>
        </form>
      </Card>
    </div>
  );
}
