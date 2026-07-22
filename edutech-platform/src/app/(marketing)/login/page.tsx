import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/(marketing)/login/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Alert } from "@/components/ui/Feedback";
import { Input, Label } from "@/components/ui/Field";
import { MentorIcon } from "@/components/ui/icons";
import { getCurrentSession } from "@/lib/auth/current-session";
import {
  getAuthenticatedLandingPath,
  sanitizeReturnPath,
} from "@/lib/auth/navigation";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào tài khoản EduTech của bạn.",
};

type LoginPageProps = Readonly<{
  searchParams: Promise<{
    error?: string;
    returnTo?: string;
    reset?: string;
    invited?: string;
    revoked?: string;
  }>;
}>;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, session] = await Promise.all([
    searchParams,
    getCurrentSession(),
  ]);
  const returnTo = sanitizeReturnPath(params.returnTo);

  if (session) {
    redirect(returnTo ?? getAuthenticatedLandingPath(session));
  }

  return (
    <section className="flex min-h-[calc(100vh-64px)] items-center bg-[var(--color-surface-muted)] py-16">
      <Container className="flex justify-center">
        <Card className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-700)] text-white">
                <MentorIcon width={20} height={20} />
              </span>
              <span className="text-lg font-bold text-[var(--color-ink-900)]">
                EduTech
              </span>
            </Link>
            <h1 className="mt-6 text-xl font-semibold text-[var(--color-ink-900)]">
              Đăng nhập tài khoản
            </h1>
            <p className="mt-1.5 text-sm text-[var(--color-ink-500)]">
              Dành cho học sinh, phụ huynh, giáo viên và quản trị viên nhà trường
            </p>
          </div>

          {params.error === "invalid" ? (
            <div
              role="alert"
              className="mb-5 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              Email hoặc mật khẩu không đúng. Vui lòng thử lại.
            </div>
          ) : null}
          {params.error === "rate-limited" ? (
            <div
              role="alert"
              className="mb-5 rounded-[var(--radius-md)] border border-[var(--color-warning-300)] bg-[var(--color-warning-50)] px-4 py-3 text-sm text-[var(--color-warning-900)]"
            >
              Đã có quá nhiều lần đăng nhập không thành công. Vui lòng thử lại sau.
            </div>
          ) : null}
          {params.reset === "success" ? (
            <Alert className="mb-5" tone="success" title="Mật khẩu đã được cập nhật">
              Bạn có thể đăng nhập bằng mật khẩu mới.
            </Alert>
          ) : null}
          {params.invited === "1" ? (
            <Alert className="mb-5" tone="success" title="Đã tham gia trường">
              Đăng nhập để mở không gian trường vừa được cấp.
            </Alert>
          ) : null}
          {params.revoked === "1" ? (
            <Alert className="mb-5" tone="info" title="Đã đăng xuất khỏi mọi thiết bị" />
          ) : null}

          <form action={loginAction} className="space-y-5">
            {returnTo ? (
              <input type="hidden" name="returnTo" value={returnTo} />
            ) : null}
            <div>
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="ban@truong.edu.vn"
              />
            </div>
            <div>
              <Label htmlFor="password" required>
                Mật khẩu
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end text-sm">
              <Link href="/quen-mat-khau" className="font-medium text-[var(--color-brand-700)] hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <Button type="submit" size="lg" className="w-full">
              Đăng nhập
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[var(--color-ink-500)]">
            Trường bạn chưa sử dụng EduTech?{" "}
            <Link
              href="/demo"
              className="font-medium text-[var(--color-brand-700)] hover:underline"
            >
              Yêu cầu demo
            </Link>
          </p>
        </Card>
      </Container>
    </section>
  );
}
