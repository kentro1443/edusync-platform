import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { footerLinks } from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-ink-200)] bg-[var(--color-ink-50)]">
      <Container className="grid gap-10 py-14 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5 text-[var(--color-brand-900)]">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-800)] text-sm font-bold text-white">
              LK
            </span>
            <span className="text-lg font-semibold tracking-tight">
              LiênKếtHọc
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--color-ink-500)]">
            Nền tảng Smart School hợp nhất cố vấn học tập, tài liệu ôn thi, lịch
            hẹn và số hóa quy trình hành chính cho các trường phổ thông tại
            Việt Nam.
          </p>
        </div>

        <nav aria-label="Sản phẩm">
          <h3 className="text-sm font-semibold text-[var(--color-ink-900)]">
            Sản phẩm
          </h3>
          <ul className="mt-4 space-y-3">
            {footerLinks.product.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-[var(--color-ink-500)] hover:text-[var(--color-brand-700)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Công ty">
          <h3 className="text-sm font-semibold text-[var(--color-ink-900)]">
            Công ty
          </h3>
          <ul className="mt-4 space-y-3">
            {footerLinks.company.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-[var(--color-ink-500)] hover:text-[var(--color-brand-700)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Hỗ trợ">
          <h3 className="text-sm font-semibold text-[var(--color-ink-900)]">
            Hỗ trợ
          </h3>
          <ul className="mt-4 space-y-3">
            {footerLinks.support.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-[var(--color-ink-500)] hover:text-[var(--color-brand-700)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <div className="border-t border-[var(--color-ink-200)] py-6">
        <Container className="flex flex-col items-center justify-between gap-3 text-xs text-[var(--color-ink-400)] sm:flex-row">
          <p>© {new Date().getFullYear()} LiênKếtHọc. Bảo lưu mọi quyền.</p>
          <p>Xây dựng cho các trường THPT tư thục & liên cấp tại Việt Nam.</p>
        </Container>
      </div>
    </footer>
  );
}