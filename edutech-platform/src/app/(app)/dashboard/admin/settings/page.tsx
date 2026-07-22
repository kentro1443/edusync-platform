import { updateSchoolSettingsAction } from "@/app/(app)/dashboard/admin/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Field, Input } from "@/components/ui/Field";
import { getSchoolSettings } from "@/lib/admin/school-admin";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";

export default async function SchoolSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ actor }, params] = await Promise.all([requireSchoolContext(permissions.schoolSettingsRead), searchParams]);
  const school = await getSchoolSettings(actor);
  if (!school) return null;
  const settings = typeof school.settingsJson === "object" && school.settingsJson && !Array.isArray(school.settingsJson) ? school.settingsJson as Record<string, unknown> : {};
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Quản trị trường" title="Cài đặt trường" description="Thông tin nhận diện dùng xuyên suốt trong không gian vận hành." />
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
