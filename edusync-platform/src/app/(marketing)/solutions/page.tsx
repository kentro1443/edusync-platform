import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Giải pháp theo nhu cầu trường học",
  description: "Lộ trình triển khai EduSync cho vận hành học sinh, cố vấn, học liệu và quy trình hành chính.",
};

const solutions = [
  { audience: "Ban giám hiệu", title: "Một bức tranh vận hành đáng tin cậy", detail: "Tập trung trạng thái, trách nhiệm và lịch sử quyết định trên một nền tảng có phân quyền.", points: ["Dữ liệu theo đúng phạm vi trường", "Báo cáo có nguồn gốc", "Audit cho thao tác nhạy cảm"] },
  { audience: "Phòng học sinh", title: "Theo sát từng nhu cầu hỗ trợ", detail: "Kết nối lịch hẹn, cố vấn, biểu mẫu và phụ huynh mà không làm lộ dữ liệu riêng tư.", points: ["Phân công rõ ràng", "Nhắc việc đúng lúc", "Quyền xem theo quan hệ"] },
  { audience: "Phòng hành chính", title: "Giảm giấy tờ, tăng khả năng kiểm soát", detail: "Chuẩn hóa biểu mẫu và phê duyệt nhưng vẫn giữ linh hoạt riêng của từng trường.", points: ["Biểu mẫu có phiên bản", "SLA từng bước", "Tra cứu lịch sử đầy đủ"] },
];

export default function SolutionsPage() {
  return (
    <>
      <section className="border-b bg-[var(--color-surface-warm)] py-20 lg:py-28">
        <Container>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-brand-700)]">Giải pháp EduSync</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-[var(--color-ink-900)] sm:text-6xl">Thiết kế quanh cách nhà trường thực sự vận hành.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-ink-500)]">Không ép mọi trường vào cùng một quy trình. EduSync cung cấp nền tảng chung, quyền kiểm soát rõ và lộ trình triển khai theo ưu tiên.</p>
        </Container>
      </section>
      <section className="py-16 lg:py-24">
        <Container className="space-y-6">
          {solutions.map((solution, index) => (
            <article key={solution.audience} className="grid gap-8 border-b py-10 first:pt-0 last:border-0 lg:grid-cols-[0.75fr_1.25fr]">
              <div><span className="text-sm font-bold text-[var(--color-accent-700)]">0{index + 1}</span><p className="mt-2 text-sm font-semibold uppercase tracking-[0.13em] text-[var(--color-ink-400)]">{solution.audience}</p></div>
              <div><h2 className="text-2xl font-bold tracking-tight text-[var(--color-ink-900)] sm:text-3xl">{solution.title}</h2><p className="mt-3 max-w-2xl leading-relaxed text-[var(--color-ink-500)]">{solution.detail}</p><ul className="mt-6 grid gap-3 sm:grid-cols-3">{solution.points.map((point) => <li key={point} className="flex items-start gap-2 text-sm font-medium text-[var(--color-ink-700)]"><CheckIcon width={17} height={17} className="mt-0.5 shrink-0 text-[var(--color-success-600)]" />{point}</li>)}</ul></div>
            </article>
          ))}
          <Link href="/demo" className="inline-flex items-center gap-2 font-bold text-[var(--color-brand-700)]">Trao đổi về lộ trình triển khai <ArrowRightIcon width={18} height={18} /></Link>
        </Container>
      </section>
    </>
  );
}
