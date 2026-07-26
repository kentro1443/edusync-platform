import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { Alert } from "@/components/ui/Feedback";
import { Field, Input, Textarea, Select } from "@/components/ui/Field";
import { Reveal } from "@/components/marketing/Motion";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions, getSchoolPermissions, hasPermission } from "@/lib/auth/permissions";
import {
  getActorMentorProfile,
  listMentorIncome,
  listMyOffers,
  listMyRequests,
  listOpenRequests,
  specialtyOptions,
} from "@/lib/marketplace/marketplace-queries";
import {
  formatVnd,
  formatMarketplaceDate,
  marketplaceErrorMessages,
  marketplaceResultMessages,
  translateOfferStatus,
  translatePaymentStatus,
  translateRequestStatus,
} from "@/lib/marketplace/ui";
import {
  acceptOfferAction,
  cancelRequestAction,
  markPaymentAction,
  postRequestAction,
  submitOfferAction,
  withdrawOfferAction,
} from "./actions";

export const metadata = { title: "Chợ cố vấn ngang hàng | EduTech" };

type SearchParams = { tab?: string; result?: string; error?: string };

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { actor } = await requireSchoolContext(permissions.marketplaceRead);
  const params = await searchParams;

  const effective = getSchoolPermissions(actor.schoolRoles);
  const canRequest = hasPermission(effective, permissions.marketplaceRequestCreate);
  const mentorProfile = hasPermission(effective, permissions.marketplaceOfferCreate)
    ? await getActorMentorProfile(actor)
    : null;
  const canOffer = mentorProfile !== null;

  const defaultTab = canRequest ? "requests" : canOffer ? "browse" : "requests";
  const tab = params.tab ?? defaultTab;

  const [myRequests, openRequests, myOffers, income, specialties] = await Promise.all([
    canRequest ? listMyRequests(actor) : Promise.resolve([]),
    canOffer ? listOpenRequests(actor) : Promise.resolve([]),
    canOffer ? listMyOffers(actor) : Promise.resolve([]),
    canOffer ? listMentorIncome(actor) : Promise.resolve([]),
    actor.schoolId ? specialtyOptions(actor.schoolId) : Promise.resolve([]),
  ]);

  const totalEarned = income
    .filter((item) => item.paymentStatus === "PAID")
    .reduce((sum, item) => sum + item.totalAmountVnd, 0);
  const pendingEarned = income
    .filter((item) => item.paymentStatus === "PENDING")
    .reduce((sum, item) => sum + item.totalAmountVnd, 0);

  const result = params.result ? marketplaceResultMessages[params.result] : undefined;
  const errorMessage = params.error ? marketplaceErrorMessages[params.error] : undefined;

  const tabs = [
    canRequest ? { id: "requests", label: "Yêu cầu của tôi" } : null,
    canOffer ? { id: "browse", label: "Yêu cầu đang mở" } : null,
    canOffer ? { id: "offers", label: "Đề xuất & thu nhập" } : null,
  ].filter(Boolean) as { id: string; label: string }[];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Chợ cố vấn ngang hàng"
        title="Kết nối anh chị khóa trên"
        description="Học sinh đăng nhu cầu, anh chị khóa trên đề xuất mức phí phù hợp, hai bên chốt thỏa thuận minh bạch — mọi bước đều được ghi nhận."
        actions={
          <Link href="/dashboard/mentoring/mentors">
            <Button variant="outline" size="sm">
              Danh bạ cố vấn
            </Button>
          </Link>
        }
      />

      {result ? (
        <Alert tone={result.tone === "success" ? "success" : "info"} title={result.message} />
      ) : null}
      {errorMessage ? <Alert tone="danger" title={errorMessage} /> : null}

      {tabs.length > 1 ? (
        <nav aria-label="Khu vực chợ cố vấn" className="flex flex-wrap gap-2 border-b border-[var(--color-ink-200)] pb-1">
          {tabs.map((item) => {
            const active = item.id === tab;
            return (
              <Link
                key={item.id}
                href={`/dashboard/mentoring/marketplace?tab=${item.id}`}
                className={`rounded-t-md px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "border-b-2 border-[var(--color-brand-700)] text-[var(--color-brand-800)]"
                    : "text-[var(--color-ink-500)] hover:text-[var(--color-ink-800)]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {tab === "requests" && canRequest ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <section aria-labelledby="my-requests-heading" className="space-y-4 lg:order-1 order-2">
            <h2 id="my-requests-heading" className="text-lg font-bold text-[var(--color-ink-900)]">
              Yêu cầu của tôi
            </h2>
            {myRequests.length === 0 ? (
              <EmptyState
                title="Chưa có yêu cầu nào"
                description="Đăng yêu cầu đầu tiên để anh chị khóa trên gửi đề xuất kèm mức phí."
              />
            ) : (
              <ul className="space-y-4">
                {myRequests.map((request, index) => {
                  const status = translateRequestStatus(request.status);
                  const pendingOffers = request.offers.filter((o) => o.status === "PENDING");
                  return (
                    <li key={request.id}>
                      <Reveal delay={index * 40}>
                        <Card className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-bold text-[var(--color-ink-900)]">
                              {request.title}
                            </h3>
                            <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                              {request.preferredSessions} buổi ·{" "}
                              {request.specialtyName ?? "Chưa chọn chuyên môn"} ·{" "}
                              Ngân sách tham khảo {formatVnd(request.budgetHintVnd)}
                            </p>
                          </div>
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </div>
                        <p className="text-sm leading-relaxed text-[var(--color-ink-700)]">
                          {request.description}
                        </p>

                        {request.engagement ? (
                          <div className="rounded-[var(--radius-md)] border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-[var(--color-brand-800)]">
                                  Đã ghép với {request.engagement.mentorName}
                                </p>
                                <p className="mt-1 text-sm text-[var(--color-ink-600)]">
                                  {request.engagement.sessions} buổi ·{" "}
                                  Tổng {formatVnd(request.engagement.totalAmountVnd)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge tone={translatePaymentStatus(request.engagement.paymentStatus).tone}>
                                  {translatePaymentStatus(request.engagement.paymentStatus).label}
                                </Badge>
                                {request.engagement.paymentStatus === "PENDING" ? (
                                  <form action={markPaymentAction}>
                                    <input type="hidden" name="engagementId" value={request.engagement.id} />
                                    <input type="hidden" name="status" value="PAID" />
                                    <Button type="submit" size="sm">
                                      Đánh dấu đã trả
                                    </Button>
                                  </form>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ) : request.status === "OPEN" ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-[var(--color-ink-800)]">
                                {pendingOffers.length} đề xuất đang chờ bạn chọn
                              </p>
                              <form action={cancelRequestAction}>
                                <input type="hidden" name="requestId" value={request.id} />
                                <Button type="submit" variant="ghost" size="sm">
                                  Hủy yêu cầu
                                </Button>
                              </form>
                            </div>
                            {pendingOffers.length === 0 ? (
                              <p className="text-sm text-[var(--color-ink-500)]">
                                Chưa có đề xuất. Anh chị khóa trên sẽ sớm phản hồi.
                              </p>
                            ) : (
                              <ul className="space-y-2">
                                {pendingOffers.map((offer) => (
                                  <li
                                    key={offer.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-ink-200)] bg-[var(--color-surface)] p-3"
                                  >
                                    <div>
                                      <p className="text-sm font-semibold text-[var(--color-ink-900)]">
                                        {offer.mentorName} ·{" "}
                                        <span className="text-[var(--color-brand-700)]">
                                          {formatVnd(offer.pricePerSessionVnd)}/buổi
                                        </span>
                                      </p>
                                      <p className="mt-0.5 text-sm text-[var(--color-ink-600)]">
                                        {offer.message}
                                      </p>
                                    </div>
                                    <form action={acceptOfferAction}>
                                      <input type="hidden" name="offerId" value={offer.id} />
                                      <Button type="submit" size="sm">
                                        Chọn cố vấn này
                                      </Button>
                                    </form>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : null}
                        </Card>
                      </Reveal>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside className="lg:order-2 order-1">
            <Card className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-[var(--color-ink-900)]">Đăng yêu cầu tìm cố vấn</h2>
                <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                  Mô tả nhu cầu; anh chị khóa trên sẽ gửi đề xuất kèm mức phí.
                </p>
              </div>
              <form action={postRequestAction} className="space-y-4">
                <Field id="title" label="Tiêu đề" required>
                  <Input name="title" required minLength={4} maxLength={160} placeholder="Ví dụ: Luyện SAT Math 5 buổi" />
                </Field>
                <Field id="description" label="Mô tả nhu cầu" required>
                  <Textarea name="description" required minLength={10} maxLength={4000} placeholder="Bạn cần hỗ trợ gì, mục tiêu, thời gian mong muốn…" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="preferredSessions" label="Số buổi">
                    <Input name="preferredSessions" type="number" min={1} max={50} defaultValue={1} />
                  </Field>
                  <Field id="budgetHintVnd" label="Ngân sách/buổi (đ)">
                    <Input name="budgetHintVnd" inputMode="numeric" placeholder="Tùy chọn" />
                  </Field>
                </div>
                <Field id="specialtyId" label="Chuyên môn" description="Tùy chọn — giúp đúng người đề xuất.">
                  <Select name="specialtyId" defaultValue="">
                    <option value="">Không chọn</option>
                    {specialties.map((specialty) => (
                      <option key={specialty.id} value={specialty.id}>
                        {specialty.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button type="submit" className="w-full">
                  Đăng yêu cầu
                </Button>
              </form>
            </Card>
          </aside>
        </div>
      ) : null}

      {tab === "browse" && canOffer ? (
        <section aria-labelledby="browse-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="browse-heading" className="text-lg font-bold text-[var(--color-ink-900)]">
              Yêu cầu đang mở
            </h2>
            <Badge tone="success">{openRequests.length} yêu cầu</Badge>
          </div>
          {!mentorProfile?.acceptingRequests ? (
            <Alert
              tone="info"
              title="Hồ sơ của bạn đang tạm dừng nhận yêu cầu. Bật lại trong hồ sơ cố vấn để gửi đề xuất."
            />
          ) : null}
          {openRequests.length === 0 ? (
            <EmptyState
              title="Chưa có yêu cầu nào"
              description="Khi học sinh đăng nhu cầu, yêu cầu sẽ hiển thị ở đây để bạn gửi đề xuất."
            />
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {openRequests.map((request, index) => (
                <li key={request.id}>
                  <Reveal delay={index * 40} className="h-full">
                    <Card className="flex h-full flex-col gap-4">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-bold text-[var(--color-ink-900)]">{request.title}</h3>
                        <span className="whitespace-nowrap text-xs text-[var(--color-ink-400)]">
                          {formatMarketplaceDate(request.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                        {request.studentName} · {request.preferredSessions} buổi ·{" "}
                        {request.specialtyName ?? "Chưa chọn chuyên môn"}
                      </p>
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-[var(--color-ink-700)]">
                      {request.description}
                    </p>
                    <p className="text-sm text-[var(--color-ink-600)]">
                      Ngân sách tham khảo:{" "}
                      <span className="font-semibold text-[var(--color-brand-700)]">
                        {formatVnd(request.budgetHintVnd)}
                      </span>{" "}
                      · {request.offerCount} đề xuất
                    </p>
                    {request.alreadyOffered ? (
                      <Badge tone="neutral">Bạn đã gửi đề xuất</Badge>
                    ) : mentorProfile?.acceptingRequests ? (
                      <details className="group">
                        <summary className="cursor-pointer list-none rounded-[var(--radius-md)] bg-[var(--color-brand-700)] px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-800)]">
                          Gửi đề xuất
                        </summary>
                        <form action={submitOfferAction} className="mt-3 space-y-3 rounded-[var(--radius-md)] border border-[var(--color-ink-200)] p-3">
                          <input type="hidden" name="requestId" value={request.id} />
                          <input type="hidden" name="mentorProfileId" value={mentorProfile.id} />
                          <Field id={`price-${request.id}`} label="Mức phí/buổi (đ)" required>
                            <Input name="pricePerSessionVnd" inputMode="numeric" required placeholder="Ví dụ: 120000" />
                          </Field>
                          <Field id={`message-${request.id}`} label="Lời nhắn" required>
                            <Textarea name="message" required minLength={5} maxLength={2000} placeholder="Kinh nghiệm, lộ trình bạn đề xuất…" />
                          </Field>
                          <Button type="submit" size="sm" className="w-full">
                            Gửi đề xuất
                          </Button>
                        </form>
                      </details>
                    ) : null}
                    </Card>
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "offers" && canOffer ? (
        <div className="space-y-8">
          <section aria-labelledby="income-heading" className="space-y-4">
            <h2 id="income-heading" className="text-lg font-bold text-[var(--color-ink-900)]">
              Thu nhập từ cố vấn
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-400)]">Đã nhận</p>
                <p className="mt-2 text-2xl font-bold text-[var(--color-success-600)]">{formatVnd(totalEarned)}</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-400)]">Chờ thanh toán</p>
                <p className="mt-2 text-2xl font-bold text-[var(--color-warning-600)]">{formatVnd(pendingEarned)}</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-400)]">Thỏa thuận</p>
                <p className="mt-2 text-2xl font-bold text-[var(--color-brand-800)]">{income.length}</p>
              </Card>
            </div>
            {income.length === 0 ? (
              <EmptyState title="Chưa có thu nhập" description="Khi học sinh chọn đề xuất của bạn, thỏa thuận sẽ xuất hiện ở đây." />
            ) : (
              <ul className="space-y-2">
                {income.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-ink-200)] bg-[var(--color-surface)] p-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-ink-900)]">{item.requestTitle}</p>
                      <p className="mt-0.5 text-sm text-[var(--color-ink-500)]">
                        {item.studentName} · {item.sessions} buổi · {formatVnd(item.totalAmountVnd)}
                      </p>
                    </div>
                    <Badge tone={translatePaymentStatus(item.paymentStatus).tone}>
                      {translatePaymentStatus(item.paymentStatus).label}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="offers-heading" className="space-y-4">
            <h2 id="offers-heading" className="text-lg font-bold text-[var(--color-ink-900)]">
              Đề xuất đã gửi
            </h2>
            {myOffers.length === 0 ? (
              <EmptyState title="Chưa gửi đề xuất" description="Duyệt các yêu cầu đang mở và gửi đề xuất đầu tiên." />
            ) : (
              <ul className="space-y-2">
                {myOffers.map((offer) => {
                  const status = translateOfferStatus(offer.status);
                  return (
                    <li key={offer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-ink-200)] bg-[var(--color-surface)] p-4">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-ink-900)]">{offer.requestTitle}</p>
                        <p className="mt-0.5 text-sm text-[var(--color-ink-500)]">
                          {offer.studentName} · {formatVnd(offer.pricePerSessionVnd)}/buổi
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge tone={status.tone}>{status.label}</Badge>
                        {offer.status === "PENDING" ? (
                          <form action={withdrawOfferAction}>
                            <input type="hidden" name="offerId" value={offer.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              Rút
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
