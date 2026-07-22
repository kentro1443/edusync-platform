import type { Metadata } from "next";
import Link from "next/link";

import { resetPasswordAction } from "@/app/(marketing)/dat-lai-mat-khau/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Alert } from "@/components/ui/Feedback";
import { Field, Input } from "@/components/ui/Field";
import { getPasswordResetTokenState } from "@/lib/auth/password-reset";

export const metadata: Metadata = { title: "Đặt lại mật khẩu" };

const errorMessages: Record<string, string> = {
  missing: "Vui lòng nhập đầy đủ hai trường mật khẩu.",
  weak: "Mật khẩu mới phải có ít nhất 12 ký tự.",
  mismatch: "Hai mật khẩu chưa trùng khớp.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";
  const tokenState = await getPasswordResetTokenState(token);
  return (
    <section className="flex min-h-[70vh] items-center bg-[var(--color-surface-muted)] py-16">
      <Container className="flex justify-center">
        <Card className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-[var(--color-ink-900)]">Tạo mật khẩu mới</h1>
          {tokenState === "invalid" ? (
            <>
              <Alert className="mt-5" tone="danger" title="Liên kết không còn hiệu lực">Liên kết có thể đã được dùng, bị thu hồi hoặc hết hạn.</Alert>
              <Link href="/quen-mat-khau" className="mt-6 inline-flex font-semibold text-[var(--color-brand-700)] hover:underline">Yêu cầu liên kết mới</Link>
            </>
          ) : (
            <form action={resetPasswordAction} className="mt-6 space-y-5">
              <input type="hidden" name="token" value={token} />
              {params.error && errorMessages[params.error] ? (
                <Alert tone="danger" title="Chưa thể đặt lại mật khẩu">{errorMessages[params.error]}</Alert>
              ) : null}
              <Field id="password" label="Mật khẩu mới" required description="Dùng ít nhất 12 ký tự; tránh thông tin dễ đoán.">
                <Input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required />
              </Field>
              <Field id="confirmPassword" label="Nhập lại mật khẩu" required>
                <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required />
              </Field>
              <Button type="submit" size="lg" className="w-full">Lưu mật khẩu mới</Button>
            </form>
          )}
        </Card>
      </Container>
    </section>
  );
}
