import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Field";
import { MentorIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào tài khoản LiênKếtHọc của bạn.",
};

export default function LoginPage() {
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
                LiênKếtHọc
              </span>
            </Link>
            <h1 className="mt-6 text-xl font-semibold text-[var(--color-ink-900)]">
              Đăng nhập tài khoản
            </h1>
            <p className="mt-1.5 text-sm text-[var(--color-ink-500)]">
              Dành cho học sinh, phụ huynh, giáo viên và quản trị viên nhà trường
            </p>
          </div>
          <form className="space-y-5">
            <div>
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input id="email" name="email" type="email" required placeholder="ban@truong.edu.vn" />
            </div>
            <div>
              <Label htmlFor="password" required>
                Mật khẩu
              </Label>
              <Input id="password" name="password" type="password" required placeholder="••••••••" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[var(--color-ink-600)]">
                <input type="checkbox" className="h-4 w-4 rounded border-[var(--color-ink-300)]" />
                Ghi nhớ đăng nhập
              </label>
              <a href="#" className="font-medium text-[var(--color-brand-700)] hover:underline">
                Quên mật khẩu?
              </a>
            </div>
            <Button type="submit" size="lg" className="w-full">
              Đăng nhập
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[var(--color-ink-500)]">
            Trường bạn chưa sử dụng LiênKếtHọc?{" "}
            <Link href="/demo" className="font-medium text-[var(--color-brand-700)] hover:underline">
              Yêu cầu demo
            </Link>
          </p>
        </Card>
      </Container>
    </section>
  );
}