import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { DemoForm } from "./DemoForm";

export const metadata: Metadata = {
  title: "Yêu cầu Demo",
  description: "Đăng ký nhận demo LiênKếtHọc dành riêng cho trường THPT của bạn.",
};

export default function DemoPage() {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <div className="mx-auto mb-12 max-w-xl text-center">
          <Badge tone="brand">Yêu cầu demo</Badge>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-[var(--color-ink-900)] sm:text-5xl">
            Xem LiênKếtHọc hoạt động cho trường của bạn
          </h1>
          <p className="mt-4 text-[var(--color-ink-500)]">
            Điền thông tin bên dưới, đội ngũ của chúng tôi sẽ liên hệ để sắp
            xếp buổi demo trực tiếp trong vòng 24 giờ làm việc.
          </p>
        </div>
        <DemoForm />
      </Container>
    </section>
  );
}