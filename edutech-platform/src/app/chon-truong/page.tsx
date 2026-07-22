import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { selectSchoolAction } from "@/app/(app)/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { getCurrentSession } from "@/lib/auth/current-session";

export const metadata: Metadata = {
  title: "Chọn trường",
  description: "Chọn phạm vi trường bạn muốn làm việc.",
};

type SelectSchoolPageProps = Readonly<{
  searchParams: Promise<{
    error?: string;
  }>;
}>;

export default async function SelectSchoolPage({
  searchParams,
}: SelectSchoolPageProps) {
  const [params, session] = await Promise.all([
    searchParams,
    getCurrentSession(),
  ]);

  if (!session) {
    redirect("/login?returnTo=/chon-truong");
  }

  if (session.user.mustChangePassword) {
    redirect("/doi-mat-khau");
  }

  if (session.schoolContexts.length === 0) {
    redirect("/dashboard");
  }

  if (session.schoolContexts.length === 1) {
    const formData = new FormData();
    formData.set("schoolSlug", session.schoolContexts[0].schoolSlug);
    await selectSchoolAction(formData);
  }

  return (
    <main className="flex min-h-screen items-center bg-[var(--color-surface-muted)] py-12">
      <Container className="max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-brand-700)]">
            EduTech
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--color-ink-900)]">
            Chọn trường làm việc
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-500)]">
            Xin chào {session.user.displayName}. Mọi dữ liệu và quyền truy cập sẽ
            được giới hạn theo trường bạn chọn.
          </p>
        </div>

        {params.error === "invalid" ? (
          <div
            role="alert"
            className="mb-5 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            Bạn không có quyền truy cập trường đã chọn.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {session.schoolContexts.map((schoolContext) => (
            <Card key={schoolContext.membershipId}>
              <form action={selectSchoolAction}>
                <input
                  type="hidden"
                  name="schoolSlug"
                  value={schoolContext.schoolSlug}
                />
                <h2 className="font-semibold text-[var(--color-ink-900)]">
                  {schoolContext.schoolName}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                  Vai trò: {schoolContext.roles.join(", ")}
                </p>
                <Button type="submit" className="mt-5 w-full">
                  Tiếp tục với trường này
                </Button>
              </form>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}