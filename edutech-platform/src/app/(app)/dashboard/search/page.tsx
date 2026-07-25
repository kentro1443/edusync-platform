import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { searchSchool } from "@/lib/search/search-service";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = await searchParams;
  const q = query.q?.trim().slice(0, 80) ?? "";
  const { actor } = await requireSchoolContext(permissions.messageConversationRead);
  const results = await searchSchool(actor, q);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tìm kiếm toàn trường"
        title="Kết quả theo đúng quyền của bạn"
        description="Tài liệu riêng tư, lịch cá nhân và cuộc trò chuyện không tham gia không xuất hiện trong kết quả."
      />
      <Card>
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field id="global-search" label="Từ khóa" className="flex-1">
            <Input
              id="global-search"
              name="q"
              type="search"
              minLength={2}
              maxLength={80}
              defaultValue={q}
              autoFocus
              placeholder="Tên tài liệu, sự kiện, CLB, quy trình…"
            />
          </Field>
          <button
            type="submit"
            className="min-h-11 rounded-[var(--radius-md)] bg-[var(--color-brand-700)] px-5 text-sm font-semibold text-white"
          >
            Tìm kiếm
          </button>
        </form>
      </Card>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            {q.length >= 2 ? `Kết quả cho “${q}”` : "Nhập ít nhất 2 ký tự"}
          </h2>
          <Badge tone="neutral">{results.length}</Badge>
        </div>
        {results.length ? (
          <ul className="mt-4 divide-y divide-[var(--color-ink-100)]">
            {results.map((result) => (
              <li key={result.id}>
                <Link
                  href={result.href}
                  className="group flex min-h-20 items-start gap-4 px-2 py-4 hover:bg-[var(--color-ink-50)]"
                >
                  <Badge tone="neutral">{result.type}</Badge>
                  <span className="min-w-0">
                    <span className="block font-semibold text-[var(--color-ink-900)] group-hover:text-[var(--color-brand-800)]">
                      {result.title}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm text-[var(--color-ink-500)]">
                      {result.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : q.length >= 2 ? (
          <div role="status" className="py-10 text-center text-sm text-[var(--color-ink-500)]">
            Không tìm thấy nội dung bạn được phép truy cập.
          </div>
        ) : null}
      </Card>
    </div>
  );
}
