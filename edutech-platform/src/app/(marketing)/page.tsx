import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { moduleIcons, ShieldIcon, ArrowRightIcon, CheckIcon, CalendarIcon, BookIcon, WorkflowIcon } from "@/components/ui/icons";
import { modules, roleBenefits } from "@/lib/site-data";

export const metadata: Metadata = {
  description:
    "EduTech số hóa cố vấn học tập, tài liệu ôn thi, lịch hẹn và quy trình phê duyệt CLB/sự kiện cho các trường THPT — an toàn, minh bạch, có kiểm soát.",
};

const problems = [
  {
    title: "Cố vấn học tập thiếu kiểm soát",
    detail:
      "Học sinh tự tìm mentor qua mạng xã hội, không có xác minh, phụ huynh không nắm được, thanh toán và lịch sử không minh bạch.",
  },
  {
    title: "Tài liệu ôn tập trôi nổi",
    detail:
      "Đề thi, tài liệu chia sẻ rời rạc qua nhóm chat, không rõ nguồn gốc, dễ sai lệch và khó tìm kiếm theo môn/khối lớp.",
  },
  {
    title: "Đặt lịch hẹn thủ công",
    detail:
      "Học sinh phải xin gặp giáo viên qua tin nhắn cá nhân hoặc xếp hàng chờ, không có hệ thống theo dõi trạng thái.",
  },
  {
    title: "Quy trình xin phép rườm rà",
    detail:
      "Đơn xin mượn phòng, tổ chức sự kiện CLB phải qua chữ ký giấy nhiều cấp, mất nhiều ngày và không thể tra cứu lại.",
  },
];

const trustSignals = [
  "Xác minh danh tính hai lớp cho Mentor và Giáo viên",
  "Đồng ý của phụ huynh bắt buộc trước mọi buổi cố vấn",
  "Toàn bộ giao dịch được ghi log và có thể kiểm toán",
  "Tuân thủ nguyên tắc bảo vệ dữ liệu trẻ em & học sinh",
];

function ProductPreview() {
  const tasks = [
    { icon: CalendarIcon, label: "Lịch tư vấn", value: "08:30", detail: "Cô Minh · Phòng 204", tone: "brand" },
    { icon: BookIcon, label: "Học liệu mới", value: "12", detail: "Đang chờ kiểm duyệt", tone: "warning" },
    { icon: WorkflowIcon, label: "Hồ sơ", value: "06", detail: "Cần xử lý hôm nay", tone: "success" },
  ] as const;
  return (
    <div aria-label="Xem trước không gian vận hành EduTech" className="relative mx-auto max-w-[36rem] lg:mx-0">
      <div className="absolute -inset-6 rounded-[2rem] bg-white/5 blur-2xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[1.35rem] border border-white/15 bg-[var(--color-surface)] shadow-[0_30px_80px_rgb(0_0_0_/_0.28)]">
        <div className="flex h-12 items-center justify-between border-b bg-[var(--color-ink-50)] px-4">
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[var(--color-danger-200)]" /><span className="h-2.5 w-2.5 rounded-full bg-[var(--color-warning-200)]" /><span className="h-2.5 w-2.5 rounded-full bg-[var(--color-success-200)]" /></div>
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-400)]">Không gian trường Minh Khai</span>
          <span className="h-7 w-7 rounded-full bg-[var(--color-brand-100)]" />
        </div>
        <div className="grid sm:grid-cols-[8rem_1fr]">
          <aside className="hidden border-r bg-[var(--color-brand-900)] p-3 sm:block">
            <div className="mb-5 flex items-center gap-2 px-2 py-1.5"><span className="h-6 w-6 rounded-lg bg-white/15" /><span className="h-2 w-12 rounded bg-white/40" /></div>
            {["Tổng quan", "Thành viên", "Lịch hẹn", "Học liệu", "Quy trình"].map((item, index) => <div key={item} className={`mb-1 rounded-md px-2 py-2 text-[0.62rem] font-semibold ${index === 0 ? "bg-white/12 text-white" : "text-white/55"}`}>{item}</div>)}
          </aside>
          <div className="bg-[var(--color-surface-warm)] p-4 sm:p-5">
            <div className="flex items-end justify-between"><div><p className="text-[0.62rem] font-bold uppercase tracking-[0.13em] text-[var(--color-brand-700)]">Thứ Năm, 23 tháng 7</p><p className="mt-1 text-lg font-extrabold tracking-tight text-[var(--color-ink-900)]">Chào buổi sáng, cô Lan</p></div><span className="hidden rounded-md border bg-white px-2 py-1 text-[0.6rem] font-semibold text-[var(--color-ink-500)] sm:inline">Tạo nhanh +</span></div>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-3">{tasks.map(({ icon: Icon, ...task }) => <div key={task.label} className="rounded-[0.7rem] border bg-white p-3 shadow-[var(--shadow-sm)]"><Icon width={16} height={16} className="text-[var(--color-brand-700)]" /><p className="mt-3 text-[0.58rem] font-semibold text-[var(--color-ink-400)]">{task.label}</p><p className="mt-0.5 text-lg font-extrabold text-[var(--color-ink-900)]">{task.value}</p><p className="mt-0.5 truncate text-[0.55rem] text-[var(--color-ink-500)]">{task.detail}</p></div>)}</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1.35fr_1fr]"><div className="rounded-[0.7rem] border bg-white p-3"><div className="flex items-center justify-between"><p className="text-[0.65rem] font-bold text-[var(--color-ink-800)]">Hoạt động trong tuần</p><span className="text-[0.55rem] text-[var(--color-success-600)]">+18%</span></div><div className="mt-4 flex h-20 items-end gap-2" aria-hidden="true">{["h-[42%]", "h-[60%]", "h-[48%]", "h-[78%]", "h-[66%]", "h-[90%]", "h-[72%]"].map((heightClass, index) => <span key={index} className={`flex-1 rounded-t bg-[var(--color-brand-200)] ${heightClass}`} />)}</div></div><div className="rounded-[0.7rem] border bg-white p-3"><p className="text-[0.65rem] font-bold text-[var(--color-ink-800)]">Cần chú ý</p><div className="mt-3 space-y-2">{["2 hồ sơ quá hạn", "5 lời mời sắp hết hạn", "3 phiên đăng nhập mới"].map((item) => <div key={item} className="flex items-center gap-2 text-[0.57rem] text-[var(--color-ink-600)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-500)]" />{item}</div>)}</div></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="marketing-hero relative overflow-hidden text-white">
        <div aria-hidden="true" className="subtle-grid pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <Container className="relative grid items-center gap-14 py-16 lg:grid-cols-[1fr_0.92fr] lg:py-24">
          <div className="max-w-3xl">
            <Badge tone="warning" className="bg-white/10 text-[var(--color-accent-400)]">
              Nền tảng vận hành trường học kết nối
            </Badge>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-5xl lg:text-[3.7rem]">
              Mọi kết nối trong trường, vận hành trên một nền tảng đáng tin cậy.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-brand-100)]">
              EduTech hợp nhất cố vấn, học liệu, lịch hẹn và quy trình hành chính;
              giúp nhà trường nhìn rõ trách nhiệm, bảo vệ dữ liệu học sinh và đưa
              quyết định đi đúng người, đúng thời điểm.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/demo" variant="secondary" size="lg">
                Đăng ký tư vấn triển khai
                <ArrowRightIcon width={18} height={18} />
              </LinkButton>
              <LinkButton
                href="/case-studies"
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Xem trường hợp triển khai
              </LinkButton>
            </div>
            <dl className="mt-14 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {[
                ["8", "Vai trò được phân quyền rõ"],
                ["2", "Trường demo cô lập dữ liệu"],
                ["5", "Mô-đun vận hành hợp nhất"],
                ["1", "Bảng điều khiển xuyên suốt"],
              ].map(([stat, label]) => (
                <div key={label}>
                  <dt className="text-3xl font-bold text-[var(--color-accent-400)]">
                    {stat}
                  </dt>
                  <dd className="mt-1 text-sm text-[var(--color-brand-200)]">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <ProductPreview />
        </Container>
      </section>

      <section className="py-20 lg:py-28" aria-labelledby="problems-heading">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="problems-heading"
              className="text-3xl font-bold tracking-tight text-[var(--color-ink-900)] sm:text-4xl"
            >
              Những vấn đề nhà trường đang đối mặt mỗi ngày
            </h2>
            <p className="mt-4 text-[var(--color-ink-500)]">
              Được xây dựng dựa trên khảo sát thực tế đời sống học đường —
              nơi các kết nối, tài liệu và quy trình quan trọng nhất vẫn đang
              vận hành ngoài tầm kiểm soát của nhà trường.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {problems.map((p) => (
              <Card key={p.title} className="border-[var(--color-danger-100)]">
                <h3 className="text-lg font-semibold text-[var(--color-ink-900)]">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-500)]">
                  {p.detail}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section
        className="bg-[var(--color-brand-50)] py-20 lg:py-28"
        aria-labelledby="modules-heading"
      >
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="modules-heading"
              className="text-3xl font-bold tracking-tight text-[var(--color-ink-900)] sm:text-4xl"
            >
              Năm mô-đun, một nền tảng duy nhất
            </h2>
            <p className="mt-4 text-[var(--color-ink-500)]">
              Mỗi mô-đun giải quyết trực tiếp một điểm nghẽn cụ thể, được
              thiết kế để triển khai độc lập hoặc theo bộ trọn gói.
            </p>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {modules.map((mod) => {
              const Icon = moduleIcons[mod.icon];
              return (
                <Card key={mod.key} className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
                      <Icon width={22} height={22} />
                    </span>
                    <h3 className="text-lg font-semibold text-[var(--color-ink-900)]">
                      {mod.name}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-500)]">
                    {mod.description}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {mod.outcomes.map((o) => (
                      <li key={o} className="flex items-start gap-2 text-sm text-[var(--color-ink-700)]">
                        <CheckIcon
                          width={16}
                          height={16}
                          className="mt-0.5 shrink-0 text-[var(--color-success-600)]"
                        />
                        {o}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={mod.href}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand-700)] hover:text-[var(--color-brand-900)]"
                  >
                    Tìm hiểu chi tiết
                    <ArrowRightIcon width={16} height={16} />
                  </Link>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-28" aria-labelledby="roles-heading">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="roles-heading"
              className="text-3xl font-bold tracking-tight text-[var(--color-ink-900)] sm:text-4xl"
            >
              Giá trị cho từng vai trò trong nhà trường
            </h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {roleBenefits.map((r) => (
              <Card key={r.role} className="bg-[var(--color-surface-muted)]">
                <h3 className="text-base font-semibold text-[var(--color-brand-800)]">
                  {r.role}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-600)]">
                  {r.benefit}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section
        className="bg-[var(--color-ink-900)] py-20 text-white lg:py-28"
        aria-labelledby="trust-heading"
      >
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-white/10 text-[var(--color-accent-400)]">
              <ShieldIcon width={24} height={24} />
            </span>
            <h2 id="trust-heading" className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              An toàn cho học sinh là ưu tiên số một
            </h2>
            <p className="mt-4 text-[var(--color-ink-200)] leading-relaxed">
              Mọi tính năng đều được thiết kế với sự giám sát của nhà trường
              và phụ huynh làm trọng tâm — không phải tùy chọn thêm vào sau.
            </p>
            <LinkButton href="/security" variant="outline" size="md" className="mt-8 border-white/25 text-white hover:bg-white/10">
              Xem chi tiết bảo mật & an toàn
            </LinkButton>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {trustSignals.map((t) => (
              <li
                key={t}
                className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-5"
              >
                <CheckIcon width={20} height={20} className="mt-0.5 shrink-0 text-[var(--color-accent-400)]" />
                <span className="text-sm leading-relaxed text-[var(--color-ink-100)]">{t}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-20 lg:py-24" aria-labelledby="cta-heading">
        <Container>
          <div className="flex flex-col items-center gap-6 rounded-[var(--radius-xl)] bg-[var(--color-brand-700)] px-8 py-14 text-center text-white sm:px-16">
            <h2 id="cta-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
              Sẵn sàng triển khai cho trường của bạn?
            </h2>
            <p className="max-w-xl text-[var(--color-brand-100)]">
              Đặt lịch demo 30 phút với đội ngũ của chúng tôi để xem cách
              EduTech phù hợp với quy trình vận hành hiện tại của trường.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/demo" variant="secondary" size="lg">
                Yêu cầu demo
              </LinkButton>
              <LinkButton
                href="/pricing"
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Xem bảng giá
              </LinkButton>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
