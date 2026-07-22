import type { Metadata } from "next";
import Link from "next/link";

import { forgotPasswordAction } from "@/app/(marketing)/quen-mat-khau/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Alert } from "@/components/ui/Feedback";
import { Field, Input } from "@/components/ui/Field";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
  description: "Yêu cầu liên kết đặt lại mật khẩu EduTech.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  return (
    <section className="flex min-h-[70vh] items-center bg-[var(--color-surface-muted)] py-16">
      <Container className="flex justify-center">
        <Card className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-[var(--color-ink-900)]">Đặt lại mật khẩu</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-ink-500)]">Nhập email tài khoản. Nếu thông tin hợp lệ, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu.</p>
          {sent === "1" ? (
            <Alert className="mt-5" tone="success" title="Đã tiếp nhận yêu cầu">
              Hãy kiểm tra email và làm theo liên kết trong thư. Phản hồi này giống nhau cho mọi địa chỉ để bảo vệ tài khoản.
            </Alert>
          ) : (
            <form action={forgotPasswordAction} className="mt-6 space-y-5">
              <Field id="email" label="Email" required description="Dùng email đã đăng ký với nhà trường.">
                <Input id="email" name="email" type="email" autoComplete="email" required placeholder="ban@truong.edu.vn" />
              </Field>
              <Button type="submit" size="lg" className="w-full">Gửi hướng dẫn đặt lại</Button>
            </form>
          )}
          <Link href="/login" className="mt-6 inline-flex text-sm font-semibold text-[var(--color-brand-700)] hover:underline">Quay lại đăng nhập</Link>
        </Card>
      </Container>
    </section>
  );
}
