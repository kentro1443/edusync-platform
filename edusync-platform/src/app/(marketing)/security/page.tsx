import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { ShieldIcon, CheckIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Bảo mật & An toàn",
  description:
    "Cam kết bảo mật dữ liệu và an toàn học sinh của EduSync: xác minh danh tính, đồng ý phụ huynh, mã hóa dữ liệu và kiểm toán đầy đủ.",
};

const pillars = [
  {
    title: "An toàn học sinh trước tiên",
    points: [
      "Xác minh danh tính hai lớp cho toàn bộ mentor trước khi được kích hoạt hồ sơ.",
      "Đồng ý số của phụ huynh là bắt buộc trước mọi lượt đặt lịch cố vấn.",
      "Trò chuyện được kiểm duyệt tự động, cấm liên hệ ngoài nền tảng.",
      "Đường dây báo cáo khẩn cấp trực tiếp đến đội ngũ an toàn học đường.",
    ],
  },
  {
    title: "Bảo mật dữ liệu",
    points: [
      "Mã hóa dữ liệu khi truyền (TLS 1.3) và khi lưu trữ (AES-256).",
      "Phân quyền truy cập theo vai trò (RBAC) ở mọi cấp độ hệ thống.",
      "Sao lưu dữ liệu tự động hàng ngày với khả năng khôi phục theo thời điểm.",
      "Kiểm thử xâm nhập định kỳ bởi bên thứ ba độc lập.",
    ],
  },
  {
    title: "Tuân thủ & Minh bạch",
    points: [
      "Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân tại Việt Nam.",
      "Chính sách bảo vệ dữ liệu trẻ em được rà soát định kỳ hàng năm.",
      "Toàn bộ hành động quan trọng được ghi log phục vụ kiểm toán.",
      "Báo cáo minh bạch định kỳ gửi đến ban giám hiệu nhà trường.",
    ],
  },
  {
    title: "Vận hành đáng tin cậy",
    points: [
      "Hạ tầng đám mây với SLA uptime 99.9%, giám sát 24/7.",
      "Quy trình phản ứng sự cố có thời gian phản hồi cam kết trong hợp đồng.",
      "Phân tách môi trường dữ liệu giữa các trường sử dụng nền tảng.",
      "Đội ngũ hỗ trợ kỹ thuật riêng cho từng trường triển khai.",
    ],
  },
];

export default function SecurityPage() {
  return (
    <>
      <section className="bg-[var(--color-brand-900)] py-20 text-white lg:py-24">
        <Container>
          <div className="max-w-3xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-white/10 text-[var(--color-accent-400)]">
              <ShieldIcon width={24} height={24} />
            </span>
            <Badge tone="warning" className="mt-6 bg-white/10 text-[var(--color-accent-400)]">
              Bảo mật & An toàn
            </Badge>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              An toàn của học sinh không phải là tính năng — đó là nền tảng
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-brand-100)]">
              EduSync được thiết kế từ đầu với nguyên tắc bảo vệ trẻ em và
              bảo mật dữ liệu làm trọng tâm, không phải điều chỉnh thêm vào
              sau khi sản phẩm đã hoàn thiện.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2">
            {pillars.map((pillar) => (
              <Card key={pillar.title}>
                <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
                  {pillar.title}
                </h2>
                <ul className="mt-4 space-y-3">
                  {pillar.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-[var(--color-ink-600)]">
                      <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-[var(--color-success-600)]" />
                      {p}
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
            Cần tài liệu bảo mật chi tiết cho phòng CNTT của trường?
          </h2>
          <p className="max-w-xl text-[var(--color-ink-500)]">
            Chúng tôi cung cấp hồ sơ bảo mật đầy đủ, báo cáo kiểm thử xâm
            nhập và điều khoản xử lý dữ liệu (DPA) khi bạn yêu cầu demo.
          </p>
          <LinkButton href="/demo" variant="primary" size="lg">
            Yêu cầu demo & tài liệu bảo mật
          </LinkButton>
        </Container>
      </section>
    </>
  );
}