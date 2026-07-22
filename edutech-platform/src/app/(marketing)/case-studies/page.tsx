import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Trường hợp triển khai",
  description:
    "Các kịch bản triển khai LiênKếtHọc thực tế cho trường THPT tư thục và liên cấp tại Việt Nam.",
};

const cases = [
  {
    school: "Trường THPT Liên cấp Việt Đức (minh họa)",
    size: "1,800 học sinh · 3 cơ sở",
    challenge:
      "Ban chủ nhiệm CLB mất trung bình 6 ngày để xin duyệt tổ chức sự kiện do quy trình chữ ký giấy qua 4 cấp.",
    solution:
      "Triển khai mô-đun CLB & Sự kiện với luồng phê duyệt 2 cấp cấu hình theo quy mô sự kiện.",
    result: "Thời gian duyệt đơn giảm còn 36 giờ trung bình, không còn trùng lịch phòng.",
  },
  {
    school: "Hệ thống Trường Quốc tế Ánh Dương (minh họa)",
    size: "2,400 học sinh · 5 cơ sở",
    challenge:
      "Học sinh tự tìm gia sư qua mạng xã hội, phụ huynh không kiểm soát được chất lượng và độ an toàn.",
    solution:
      "Triển khai mô-đun Mentoring với quy trình xác minh mentor và đồng ý phụ huynh bắt buộc.",
    result: "120+ mentor được xác minh trong học kỳ đầu, 0 khiếu nại về an toàn.",
  },
  {
    school: "Trường THPT Chuyên Lê Quý Đôn (minh họa)",
    size: "1,200 học sinh · 1 cơ sở",
    challenge:
      "Đề thi và tài liệu ôn tập phân tán trên hàng chục nhóm chat, không rõ nguồn gốc.",
    solution:
      "Triển khai Kho tài liệu tập trung với quy trình kiểm duyệt và huy hiệu nguồn xác thực.",
    result: "Hơn 3,000 tài liệu được hệ thống hóa, thời gian tìm kiếm giảm từ nhiều phút xuống vài giây.",
  },
];

export default function CaseStudiesPage() {
  return (
    <>
      <section className="bg-[var(--color-brand-900)] py-20 text-white lg:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="warning" className="bg-white/10 text-[var(--color-accent-400)]">
              Trường hợp triển khai
            </Badge>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Kịch bản triển khai thực tế cho trường THPT
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--color-brand-100)]">
              Các ví dụ minh họa dưới đây phản ánh những vấn đề phổ biến mà
              đội ngũ của chúng tôi đã nghiên cứu tại các trường phổ thông
              tại Việt Nam.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container className="space-y-6">
          {cases.map((c) => (
            <Card key={c.school} className="grid gap-6 lg:grid-cols-[1fr_2fr]">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
                  {c.school}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-ink-500)]">{c.size}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-danger-600)]">
                    Thách thức
                  </p>
                  <p className="mt-1.5 text-sm text-[var(--color-ink-600)]">{c.challenge}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand-700)]">
                    Giải pháp
                  </p>
                  <p className="mt-1.5 text-sm text-[var(--color-ink-600)]">{c.solution}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-success-600)]">
                    Kết quả
                  </p>
                  <p className="mt-1.5 text-sm text-[var(--color-ink-600)]">{c.result}</p>
                </div>
              </div>
            </Card>
          ))}
        </Container>
      </section>

      <section className="bg-[var(--color-surface-muted)] py-20 lg:py-24">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-ink-900)] sm:text-3xl">
            Trường của bạn có thể là câu chuyện tiếp theo
          </h2>
          <LinkButton href="/demo" variant="primary" size="lg">
            Yêu cầu demo
          </LinkButton>
        </Container>
      </section>
    </>
  );
}