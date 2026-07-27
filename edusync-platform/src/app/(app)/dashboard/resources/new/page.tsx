import { createResourceAction } from "@/app/(app)/dashboard/resources/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";

export default async function NewResourcePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ actor }, params] = await Promise.all([
    requireSchoolContext(permissions.resourceCreate),
    searchParams,
  ]);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Thư viện tài nguyên" title="Tạo tài nguyên mới" description="Bắt đầu bằng bản nháp. Bạn có thể gửi duyệt sau khi hoàn thiện nội dung." actions={<LinkButton href="/dashboard/resources" variant="outline" size="sm">Quay lại thư viện</LinkButton>} />
      {params.error ? <Alert tone="danger" title="Không thể tạo tài nguyên">Kiểm tra lại các trường bắt buộc và thử lại.</Alert> : null}
      <Card>
        <form action={createResourceAction} className="grid gap-5">
          <Field id="title" label="Tiêu đề" required><Input id="title" name="title" minLength={3} maxLength={160} required /></Field>
          <Field id="summary" label="Mô tả ngắn"><Textarea id="summary" name="summary" maxLength={500} /></Field>
          <Field id="body" label="Nội dung"><Textarea id="body" name="body" rows={12} maxLength={500000} /></Field>
          <Field id="visibility" label="Phạm vi hiển thị"><Select id="visibility" name="visibility" defaultValue="SCHOOL"><option value="PRIVATE">Riêng tư</option><option value="SCHOOL">Trong trường</option><option value="PUBLIC">Công khai</option></Select></Field>
          <div className="flex flex-wrap gap-3"><Button type="submit">Tạo bản nháp</Button><LinkButton href="/dashboard/resources" variant="ghost">Huỷ</LinkButton></div>
          <p className="text-xs leading-5 text-[var(--color-ink-500)]">Tài nguyên luôn bắt đầu ở trạng thái bản nháp. File sẽ được kiểm tra MIME, tên và dung lượng ở bước tạo phiên bản.</p>
        </form>
      </Card>
      <p className="text-xs text-[var(--color-ink-400)]">Người tạo: {actor.userId.slice(0, 8)}…</p>
    </div>
  );
}
