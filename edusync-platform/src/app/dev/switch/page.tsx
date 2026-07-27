import { notFound, redirect } from "next/navigation";

import { DevAccountPicker } from "@/app/dev/switch/DevAccountPicker";
import { exitDevImpersonationAction } from "@/app/dev/switch/actions";
import { Brand } from "@/components/layout/Brand";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getCurrentSession } from "@/lib/auth/current-session";
import {
  DevSwitchError,
  listDevSwitchOptions,
} from "@/lib/auth/dev-switching";

type DevSwitchPageProps = {
  searchParams: Promise<{
    error?: string;
    exited?: string;
  }>;
};

const steps = [
  ["01", "Chọn trường", "Khoanh vùng dữ liệu và thành viên."],
  ["02", "Chọn tài khoản", "Nhận đúng vai trò và quyền thực tế."],
  ["03", "Trải nghiệm", "Kiểm thử toàn bộ hành trình sản phẩm."],
] as const;

export default async function DevSwitchPage({
  searchParams,
}: DevSwitchPageProps) {
  const [session, params] = await Promise.all([
    getCurrentSession(),
    searchParams,
  ]);
  if (!session) {
    redirect("/login?returnTo=/dev/switch");
  }

  let schools;
  try {
    schools = await listDevSwitchOptions(session);
  } catch (error) {
    if (error instanceof DevSwitchError) notFound();
    throw error;
  }

  return (
    <main className="min-h-screen bg-[var(--color-surface-muted)] pb-14">
      <header className="border-b border-[var(--color-ink-200)] bg-[var(--color-surface)]">
        <Container className="flex min-h-16 items-center justify-between gap-4">
          <Brand href="/dev/switch" />
          <Badge tone="warning">Chế độ phát triển</Badge>
        </Container>
      </header>

      <Container className="pt-8 sm:pt-10">
        <section className="rounded-[var(--radius-lg)] bg-[var(--color-brand-900)] px-5 py-7 text-white shadow-[var(--shadow-md)] sm:px-8 sm:py-9">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent-400)]">
              Trung tâm trải nghiệm EduSync
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">
              Một lần đăng nhập. Mọi góc nhìn.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
              Chọn trường và tài khoản demo để kiểm tra sản phẩm bằng đúng dữ
              liệu, vai trò và quyền truy cập của người dùng đó.
            </p>
          </div>

          {session.operatorUser ? (
            <div className="mt-6 flex flex-col gap-3 rounded-[var(--radius-md)] border border-white/15 bg-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/85">
                Đang trải nghiệm với{" "}
                <strong className="text-white">{session.user.displayName}</strong>.
                Bạn có thể chọn tài khoản khác ngay bên dưới.
              </p>
              <form action={exitDevImpersonationAction}>
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="min-h-11"
                >
                  Thoát và về tài khoản dev
                </Button>
              </form>
            </div>
          ) : null}
        </section>

        <ol className="my-6 grid gap-3 sm:grid-cols-3">
          {steps.map(([number, title, description]) => (
            <li
              key={number}
              className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--color-ink-200)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-100)] text-xs font-extrabold text-[var(--color-ink-900)]">
                {number}
              </span>
              <span>
                <span className="block text-sm font-semibold text-[var(--color-ink-900)]">
                  {title}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[var(--color-ink-500)]">
                  {description}
                </span>
              </span>
            </li>
          ))}
        </ol>

        {params.error ? (
          <div
            role="alert"
            className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] px-4 py-3 text-sm text-[var(--color-danger-700)]"
          >
            {params.error === "unavailable"
              ? "Phiên phát triển không còn hiệu lực. Hãy đăng nhập lại nếu cần."
              : "Không thể chuyển sang tài khoản đã chọn. Dữ liệu hoặc quyền truy cập có thể đã thay đổi."}
          </div>
        ) : null}
        {params.exited ? (
          <div
            role="status"
            className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-success-200)] bg-[var(--color-success-50)] px-4 py-3 text-sm text-[var(--color-success-700)]"
          >
            Đã trở về tài khoản phát triển an toàn.
          </div>
        ) : null}

        <DevAccountPicker
          schools={schools}
          initialSchoolId={schools[0]?.id ?? ""}
        />

        <p className="mt-5 text-center text-xs leading-5 text-[var(--color-ink-500)]">
          Mọi thao tác trong chế độ này tác động lên dữ liệu demo và được ghi
          nhận trong nhật ký kiểm toán.
        </p>
      </Container>
    </main>
  );
}
