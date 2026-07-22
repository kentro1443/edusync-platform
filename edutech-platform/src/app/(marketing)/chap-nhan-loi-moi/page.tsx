import type { Metadata } from "next";

import { acceptInvitationAction } from "@/app/(marketing)/chap-nhan-loi-moi/actions";
import { translateRole } from "@/components/app/shell-utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Alert } from "@/components/ui/Feedback";
import { Field, Input } from "@/components/ui/Field";
import { getInvitationByToken } from "@/lib/auth/invitation";

export const metadata: Metadata = { title: "Chấp nhận lời mời" };

const errors: Record<string, string> = {
  weak: "Vui lòng nhập họ tên và mật khẩu có ít nhất 12 ký tự.",
  mismatch: "Hai mật khẩu chưa trùng khớp.",
  "inactive-user": "Tài khoản hiện không hoạt động. Vui lòng liên hệ quản trị viên.",
  invalid: "Lời mời không còn hiệu lực.",
};

export default async function AcceptInvitationPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const params = await searchParams;
  const token = params.token ?? "";
  const invitation = await getInvitationByToken(token);
  return (
    <section className="flex min-h-[70vh] items-center bg-[var(--color-surface-muted)] py-16">
      <Container className="flex justify-center">
        <Card className="w-full max-w-lg">
          <h1 className="text-2xl font-bold">Chấp nhận lời mời</h1>
          {!invitation ? (
            <Alert className="mt-5" tone="danger" title="Lời mời không còn hiệu lực">Lời mời có thể đã được chấp nhận, thu hồi hoặc hết hạn. Hãy liên hệ quản trị viên trường.</Alert>
          ) : (
            <>
              <p className="mt-2 text-sm text-[var(--color-ink-500)]">Bạn được mời tham gia <strong>{invitation.schoolName}</strong> bằng email {invitation.email}.</p>
              <div className="mt-4 flex flex-wrap gap-2">{invitation.roles.map((role) => <Badge key={role} tone="brand">{translateRole(role)}</Badge>)}</div>
              {params.error && errors[params.error] ? <Alert className="mt-5" tone="danger" title="Chưa thể chấp nhận lời mời">{errors[params.error]}</Alert> : null}
              <form action={acceptInvitationAction} className="mt-6 space-y-5">
                <input type="hidden" name="token" value={token} />
                {!invitation.existingAccount ? <><Field id="displayName" label="Họ và tên" required><Input id="displayName" name="displayName" autoComplete="name" minLength={2} required /></Field><Field id="password" label="Mật khẩu" required description="Dùng ít nhất 12 ký tự."><Input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required /></Field><Field id="confirmPassword" label="Nhập lại mật khẩu" required><Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required /></Field></> : <Alert tone="info" title="Tài khoản đã tồn tại">Xác nhận để thêm trường vào tài khoản hiện có; sau đó đăng nhập như bình thường.</Alert>}
                <Button type="submit" size="lg" className="w-full">Chấp nhận và tham gia trường</Button>
              </form>
            </>
          )}
        </Card>
      </Container>
    </section>
  );
}
