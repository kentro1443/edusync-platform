import { updateProfileAction } from "@/app/(app)/dashboard/profile/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Field, Input, Select } from "@/components/ui/Field";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [session, params] = await Promise.all([requireAuthenticatedSession("/dashboard/profile"), searchParams]);
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { displayName: true, email: true, locale: true, timezone: true },
  });
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Tài khoản" title="Hồ sơ cá nhân" description="Thông tin hiển thị trong các không gian trường bạn tham gia." />
      <Card className="max-w-2xl">
        {params.saved === "1" ? <Alert className="mb-5" tone="success" title="Đã lưu hồ sơ" /> : null}
        {params.error ? <Alert className="mb-5" tone="danger" title="Thông tin chưa hợp lệ" /> : null}
        <form action={updateProfileAction} className="space-y-5">
          <Field id="displayName" label="Họ và tên hiển thị" required>
            <Input id="displayName" name="displayName" defaultValue={user.displayName} minLength={2} maxLength={120} required />
          </Field>
          <Field id="email" label="Email" description="Email đăng nhập chỉ được thay đổi bởi quản trị viên có thẩm quyền.">
            <Input id="email" value={user.email} disabled readOnly />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="locale" label="Ngôn ngữ">
              <Select id="locale" name="locale" defaultValue={user.locale}><option value="vi">Tiếng Việt</option></Select>
            </Field>
            <Field id="timezone" label="Múi giờ">
              <Select id="timezone" name="timezone" defaultValue={user.timezone}><option value="Asia/Ho_Chi_Minh">Việt Nam (UTC+7)</option></Select>
            </Field>
          </div>
          <Button type="submit">Lưu thay đổi</Button>
        </form>
      </Card>
    </div>
  );
}
