import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Trợ giúp",
  description: "Trung tâm trợ giúp LiênKếtHọc cho học sinh, phụ huynh, giáo viên và ban quản trị nhà trường.",
};

const categories = [
  {
    title: "Dành cho Học sinh",
    items: [
      { label: "Cách đặt lịch với mentor", href: "/modules/mentoring" },
      {
        label: "Cách tìm và tải tài liệu ôn tập",
        href: "/modules/resources",
      },
      {
        label: "Cách đặt lịch hẹn với giáo viên",
        href: "/modules/appointments",
      },
      {
        label: "Cách nộp đơn từ trực tuyến",
        href: "/modules/appointments",
      },
    ],
  },
  {
    title: "Dành cho Phụ huynh",
    items: [
      {
        label: "Cách xác nhận đồng ý cho con tham gia cố vấn",
        href: "/modules/mentoring",
      },
      {
        label: "Cách theo dõi lịch sử buổi học của con",
        href: "/modules/mentoring",
      },
      { label: "Cách báo cáo vấn đề an toàn", href: "/security" },
      {
        label: "Câu hỏi về thanh toán và hóa đơn",
        href: "/modules/mentoring",
      },
    ],
  },
  {
    title: "Dành cho Giáo viên & Ban quản trị",
    items: [
      {
        label: "Cách thiết lập khung giờ tư vấn",
        href: "/modules/appointments",
      },
      {
        label: "Cách cấu hình luồng phê duyệt CLB/sự kiện",
        href: "/modules/clubs-events",
      },
      {
        label: "Cách duyệt hồ sơ mentor mới",
        href: "/modules/mentoring",
      },
      {
        label: "Cách xuất báo cáo hoạt động toàn trường",
        href: "/demo",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <section className="bg-[var(--color-brand-900)] py-20 text-white lg:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="warning" className="bg-white/10 text-[var(--color-accent-400)]">
              Trung tâm trợ giúp
            </Badge>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Chúng tôi có thể giúp gì cho bạn?
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--color-brand-100)]">
              Tìm câu trả lời nhanh theo vai trò của bạn, hoặc liên hệ trực
              tiếp đội ngũ hỗ trợ của LiênKếtHọc.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container>
          <div className="grid gap-6 sm:grid-cols-3">
            {categories.map((cat) => (
              <Card key={cat.title}>
                <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
                  {cat.title}
                </h2>
                <ul className="mt-4 space-y-3">
                  {cat.items.map((item) => (
                    <li
                      key={item.label}
                      className="text-sm text-[var(--color-ink-600)]"
                    >
                      <Link
                        href={item.href}
                        className="hover:text-[var(--color-brand-700)] hover:underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-[var(--color-surface-muted)] py-20 lg:py-24">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-ink-900)] sm:text-3xl">
            Không tìm thấy câu trả lời bạn cần?
          </h2>
          <p className="max-w-xl text-[var(--color-ink-500)]">
            Đội ngũ hỗ trợ của chúng tôi phản hồi trong vòng 24 giờ làm việc
            qua email hoặc kênh hỗ trợ ưu tiên dành cho trường đối tác.
          </p>
          <LinkButton href="/demo" variant="primary" size="lg">
            Liên hệ đội ngũ hỗ trợ
          </LinkButton>
        </Container>
      </section>
    </>
  );
}