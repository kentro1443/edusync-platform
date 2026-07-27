import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { changePasswordAction } from "@/app/doi-mat-khau/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Input, Label } from "@/components/ui/Field";
import { MentorIcon } from "@/components/ui/icons";
import { minimumPasswordLength } from "@/lib/auth/change-password";
import { getCurrentSession } from "@/lib/auth/current-session";
import { getAuthenticatedLandingPath } from "@/lib/auth/navigation";

export const metadata: Metadata = {
  title: "Đổi mật khẩu",
  description: "Thiết lập mật khẩu mới trước khi sử dụng EduSync.",
};

const errorMessages: Record<string, string> = {
  missing: "Vui lòng điền đầy đủ cả ba trường mật khẩu.",
  weak: `Mật khẩu mới phải có ít nhất ${minimumPasswordLength} ký tự.`,
  mismatch: "Mật khẩu xác nhận không trùng khớp.",
  reused: "Mật khẩu mới phải khác mật khẩu hiện tại.",
  "invalid-current": "Mật khẩu hiện tại không đúng.",
};

type ChangePasswordPageProps = Readonly<{
  searchParams: Promise<{
    error?: string;
  }>;
}>;

export default async function ChangePasswordPage({
  searchParams,
}: ChangePasswordPageProps) {
  const [params, session] = await Promise.all([
    searchParams,
    getCurrentSession(),
  ]);

  if (!session) {
    redirect("/login?returnTo=/doi-mat-khau");
  }

  if (!session.user.mustChangePassword) {
    redirect(getAuthenticatedLandingPath(session));
  }

  const errorMessage = params.error ? errorMessages[params.error] : undefined;

  return (
    <main className="flex min-h-screen items-center bg-[var(--color-surface-muted)] py-12">
      <Container className="flex justify-center">
        <Card className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-700)] text-white">
              <MentorIcon width={22} height={22} />
            </span>
            <p className="mt-4 text-sm font-semibold text-[var(--color-brand-700)]">
              Xin chào {session.user.displayName}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--color-ink-900)]">
              Thiết lập mật khẩu mới
            </h1>
            <p className="mt-2 text-sm text-[var(--color-ink-500)]">
              Đây là lần đăng nhập đầu tiên. Bạn cần đổi mật khẩu tạm trước khi
              tiếp tục.
            </p>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="mb-5 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {errorMessage}
            </div>
          ) : null}

          <form action={changePasswordAction} className="space-y-5">
            <div>
              <Label htmlFor="currentPassword" required>
                Mật khẩu hiện tại
              </Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="newPassword" required>
                Mật khẩu mới
              </Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={minimumPasswordLength}
                required
                aria-describedby="password-requirements"
              />
              <p
                id="password-requirements"
                className="mt-1.5 text-xs text-[var(--color-ink-500)]"
              >
                Sử dụng ít nhất {minimumPasswordLength} ký tự và không dùng lại
                mật khẩu tạm.
              </p>
            </div>
            <div>
              <Label htmlFor="confirmPassword" required>
                Xác nhận mật khẩu mới
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={minimumPasswordLength}
                required
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Đổi mật khẩu và tiếp tục
            </Button>
          </form>
        </Card>
      </Container>
    </main>
  );
}