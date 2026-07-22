import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/icons";
import { modules } from "@/lib/site-data";
import type { ModuleKey } from "@/lib/site-data";

export interface WorkflowStep {
  title: string;
  detail: string;
}

export interface FeatureBlock {
  title: string;
  detail: string;
}

export interface ModulePageContent {
  key: ModuleKey;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  problemTitle: string;
  problemPoints: string[];
  workflow: WorkflowStep[];
  features: FeatureBlock[];
  metrics: { value: string; label: string }[];
}

export function ModulePageLayout({
  content,
  icon: Icon,
}: {
  content: ModulePageContent;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
}) {
  const current = modules.find((m) => m.key === content.key)!;
  const others = modules.filter((m) => m.key !== content.key);

  return (
    <>
      <section className="bg-[var(--color-brand-900)] py-20 text-white lg:py-24">
        <Container>
          <div className="max-w-3xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-white/10 text-[var(--color-accent-400)]">
              <Icon width={24} height={24} />
            </span>
            <Badge tone="warning" className="mt-6 bg-white/10 text-[var(--color-accent-400)]">
              {content.eyebrow}
            </Badge>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              {content.heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-brand-100)]">
              {content.heroDescription}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
            <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3">
              {content.metrics.map((m) => (
                <div key={m.label}>
                  <dt className="text-2xl font-bold text-[var(--color-accent-400)]">
                    {m.value}
                  </dt>
                  <dd className="mt-1 text-sm text-[var(--color-brand-200)]">
                    {m.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--color-ink-900)] sm:text-3xl">
              {content.problemTitle}
            </h2>
            <ul className="mt-6 space-y-4">
              {content.problemPoints.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-[var(--color-ink-600)]">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-danger-600)]" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <Card className="bg-[var(--color-brand-50)]">
            <h3 className="text-lg font-semibold text-[var(--color-ink-900)]">
              Cách EduTech giải quyết
            </h3>
            <ol className="mt-5 space-y-5">
              {content.workflow.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-[var(--color-ink-900)]">{step.title}</p>
                    <p className="mt-1 text-sm text-[var(--color-ink-500)]">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </Container>
      </section>

      <section className="bg-[var(--color-surface-muted)] py-20 lg:py-24">
        <Container>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-ink-900)] sm:text-3xl">
            Tính năng chính
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {content.features.map((f) => (
              <Card key={f.title}>
                <CheckIcon width={20} height={20} className="text-[var(--color-success-600)]" />
                <h3 className="mt-3 font-semibold text-[var(--color-ink-900)]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-500)]">
                  {f.detail}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-24">
        <Container>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-ink-900)] sm:text-3xl">
            Khám phá các mô-đun khác
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {others.map((mod) => (
              <Link
                key={mod.key}
                href={mod.href}
                className="group flex flex-col justify-between rounded-[var(--radius-lg)] border border-[var(--color-ink-200)] p-5 hover:border-[var(--color-brand-400)]"
              >
                <div>
                  <p className="font-medium text-[var(--color-ink-900)]">{mod.name}</p>
                  <p className="mt-1.5 text-sm text-[var(--color-ink-500)]">{mod.tagline}</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand-700)]">
                  Xem chi tiết
                  <ArrowRightIcon
                    width={15}
                    height={15}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-20 lg:pb-28">
        <Container>
          <div className="flex flex-col items-center gap-6 rounded-[var(--radius-xl)] bg-[var(--color-brand-700)] px-8 py-14 text-center text-white sm:px-16">
            <h2 className="text-3xl font-bold tracking-tight">
              Triển khai {current.name} cho trường của bạn
            </h2>
            <LinkButton href="/demo" variant="secondary" size="lg">
              Yêu cầu demo
            </LinkButton>
          </div>
        </Container>
      </section>
    </>
  );
}
