import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Bảng giá",
  description:
    "Các gói triển khai EduTech cho trường THPT: từ gói Cơ bản đến gói Doanh nghiệp với hỗ trợ tùy chỉnh toàn diện.",
};

const tiers = [
  {
    name: "Cơ bản",
    price: "Liên hệ",
    description: "Phù hợp trường quy mô nhỏ muốn thí điểm 1–2 mô-đun.",
    highlighted: false,
    features: [
      "Chọn tối đa 2 mô-đun",
      "Tối đa 500 học sinh",
      "Hỗ trợ qua email trong giờ hành chính",
      "Báo cáo cơ bản hàng tháng",
    ],
  },
  {
    name: "Nâng cao",
    price: "Liên hệ",
    description: "Dành cho trường muốn triển khai đầy đủ 4 mô-đun.",
    highlighted: true,
    features: [
      "Toàn bộ 4 mô-đun",
      "Không giới hạn số lượng học sinh",
      "Hỗ trợ ưu tiên trong 4 giờ làm việc",
      "Bảng điều khiển phân tích nâng cao",
      "Tùy chỉnh luồng phê duyệt theo trường",
      "Đào tạo vận hành cho đội ngũ nhà trường",
    ],
  },
  {
    name: "Doanh nghiệp",
    price: "Tùy chỉnh",
    description: "Cho hệ thống liên cấp/chuỗi trường nhiều cơ sở.",
    highlighted: false,
    features: [
      "Toàn bộ tính năng gói Nâng cao",
      "Quản lý tập trung nhiều cơ sở/chi nhánh",
      "Tích hợp hệ thống quản lý học sinh (SIS) hiện có",
      "SLA uptime 99.9% có cam kết hợp đồng",
      "Quản lý tài khoản kỹ thuật riêng",
      "Kiểm toán bảo mật định kỳ theo yêu cầu",
    ],
  },
];

const faqs = [
  {
    q: "Chúng tôi có thể bắt đầu với một mô-đun duy nhất không?",
    a: "Có. Đa số trường bắt đầu với mô-đun Lịch hẹn & Đơn từ hoặc CLB & Sự kiện, sau đó mở rộng dần sang Cố vấn và Kho tài liệu.",
  },
  {
    q: "Thời gian triển khai trung bình là bao lâu?",
    a: "Từ 2–6 tuần tùy quy mô trường và số lượng mô-đun, bao gồm cấu hình luồng phê duyệt và đào tạo đội ngũ vận hành.",
  },
  {
    q: "Dữ liệu của trường có được lưu trữ riêng biệt không?",
    a: "Có. Mỗi trường được phân tách dữ liệu hoàn toàn (single-tenant hoặc schema riêng), đảm bảo không rò rỉ chéo giữa các trường.",
  },
  {
    q: "Có hỗ trợ tích hợp với hệ thống quản lý học sinh hiện tại không?",
    a: "Gói Doanh nghiệp hỗ trợ tích hợp API với các hệ thống SIS phổ biến để đồng bộ danh sách học sinh và lớp học.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="bg-[var(--color-brand-900)] py-20 text-white lg:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="warning" className="bg-white/10 text-[var(--color-accent-400)]">
              Bảng giá
            </Badge>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Gói triển khai linh hoạt theo quy mô nhà trường
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--color-brand-100)]">
              Mọi gói đều bao gồm bảo mật cấp doanh nghiệp và không thu phí
              theo đầu học sinh vượt mức — liên hệ để nhận báo giá chi tiết
              phù hợp với ngân sách của trường.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={cn(
                  "flex flex-col",
                  tier.highlighted &&
                    "border-[var(--color-brand-500)] ring-2 ring-[var(--color-brand-500)]"
                )}
              >
                {tier.highlighted && (
                  <Badge tone="brand" className="mb-4 w-fit">
                    Phổ biến nhất
                  </Badge>
                )}
                <h2 className="text-xl font-semibold text-[var(--color-ink-900)]">
                  {tier.name}
                </h2>
                <p className="mt-2 text-sm text-[var(--color-ink-500)]">
                  {tier.description}
                </p>
                <p className="mt-6 text-3xl font-bold text-[var(--color-ink-900)]">
                  {tier.price}
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--color-ink-600)]">
                      <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-[var(--color-success-600)]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <LinkButton
                  href="/demo"
                  variant={tier.highlighted ? "primary" : "outline"}
                  size="md"
                  className="mt-8 w-full"
                >
                  Yêu cầu báo giá
                </LinkButton>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-[var(--color-surface-muted)] py-20 lg:py-24">
        <Container>
          <h2 className="text-center text-2xl font-bold tracking-tight text-[var(--color-ink-900)] sm:text-3xl">
            Câu hỏi thường gặp
          </h2>
          <div className="mx-auto mt-10 max-w-3xl divide-y divide-[var(--color-ink-200)]">
            {faqs.map((faq) => (
              <div key={faq.q} className="py-6">
                <h3 className="font-semibold text-[var(--color-ink-900)]">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-500)]">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
