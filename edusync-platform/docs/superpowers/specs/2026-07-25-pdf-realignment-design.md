# EduSync — PDF Realignment Design

Date: 2026-07-25
Status: Approved (verbal), implementing incrementally

## Goal

Realign the built platform to the original pitch PDF ("toy story 4.pdf"): a
student-centric school super-app for specialized high schools (trường Chuyên).
Keep all existing modules (no deletion, no hiding — user directive), reframe
positioning to the PDF's story, add the one missing differentiator (the paid
peer-mentor marketplace with bidding), and seed the killer demos. Raise product
and UI/UX quality toward 10/10.

## The PDF's four pillars (and where they map today)

1. **Peer-mentor marketplace** (senior students mentor juniors, earn income via
   bidding/offer, study-abroad + exam-prep focus, Ban Liên chi Đoàn certificate)
   → today's `mentoring` module (staff counseling). **Needs: reframe + new
   bidding/offer/payment economics.**
2. **Peer knowledge / past-exam sharing** → today's `resources` module. **Needs:
   reframe copy + seeded past-exam catalog.**
3. **Digital CLB event & facility approval** (4-signature, 2 weeks → 48h) →
   today's `workflows` + `clubs` modules (engine complete). **Needs: seeded
   templates + in-progress submissions.**
4. **Personal admin forms + book a teacher** (xin nghỉ, xin đổi môn, gặp thầy cô)
   → today's `workflows` + `appointments`. **Needs: seeded form templates.**

## Scope decisions (locked)

- **Money:** bidding/offer only, track agreed amount + payment status
  (`Chờ thanh toán` / `Đã trả`, settled offline). No real gateway, no card data.
- **Modules:** reframe only. Delete nothing, hide nothing.
- **Mentors:** reframe verified mentors to senior-student mentors with
  achievements + specialties + certificate badge; keep a separate teacher-booking
  flow via existing appointments.

## New domain: Peer-Mentor Marketplace

Follows the existing service pattern (`db.$transaction`, `pg_advisory_xact_lock`,
`auditEvent` + `domainOutboxEvent`, `can(actor, permission)`).

### Schema additions (new migration)

- `MentorProfile` extra fields: `gradeLabel` (e.g. "Lớp 12"), `achievements`
  (String[] — e.g. "SAT 1520", "IELTS 8.0"), `hourlyRateMin`/`hourlyRateMax`
  (Int VND, nullable), `certifiedByUnion` (Boolean), `certifiedAt`, `acceptingRequests`.
- `enum MentorRequestStatus { OPEN, MATCHED, CLOSED, CANCELLED }`
- `enum MentorOfferStatus { PENDING, ACCEPTED, DECLINED, WITHDRAWN }`
- `enum MentorPaymentStatus { PENDING, PAID, WAIVED }`
- `model MentorRequest` — student-posted need: `schoolId`, `studentUserId`,
  `title`, `description`, `specialtyId?`, `preferredSessions`, `budgetHintVnd?`,
  `status`, timestamps. Tenant + status indexes.
- `model MentorOffer` — a mentor's bid on a request: `schoolId`, `requestId`,
  `mentorProfileId`, `mentorUserId`, `pricePerSessionVnd`, `message`, `status`.
  Unique `(requestId, mentorProfileId)`. Indexes on request+status, mentor+status.
- `model MentorEngagement` — created when an offer is accepted: `schoolId`,
  `requestId` (unique), `offerId` (unique), `mentorProfileId`, `mentorUserId`,
  `studentUserId`, `agreedPricePerSessionVnd`, `sessions`, `totalAmountVnd`,
  `paymentStatus`. This is the settled agreement / income record.

### Service (`src/lib/marketplace/marketplace-service.ts`)

- `postMentorRequest(actor, input)` — student creates an OPEN request. Audit + outbox.
- `submitMentorOffer(actor, input)` — a verified, accepting mentor bids on an OPEN
  request (not own request). Unique per mentor. Notifies the student. Audit + outbox.
- `acceptMentorOffer(actor, offerId)` — **transactional, locked on the request**:
  request must be OPEN and owned by actor; set offer ACCEPTED, all sibling offers
  DECLINED, request MATCHED, create `MentorEngagement` (payment PENDING). Audit +
  outbox notification to the winning mentor.
- `withdrawMentorOffer`, `cancelMentorRequest`, `updatePaymentStatus`
  (student marks an engagement `Đã trả`).
- Read helpers: open requests (mentor browse, excludes own), my requests +
  offers (student), my offers + engagements/income (mentor).

### Permissions (added to registry + roles)

- `marketplaceRequestCreate` — STUDENT (+ admin visibility read).
- `marketplaceOfferCreate` — STUDENT, MENTOR_COUNSELOR (a senior student may hold
  the mentor role). Common read: `marketplaceRead` for all school members.
- `marketplaceRequestManageOwn`, `marketplaceOfferManageOwn` enforced by ownership
  in the service, not distinct permissions.

### Server actions + routes

- `/dashboard/mentoring/marketplace` — hub: student "Đăng yêu cầu" + "Yêu cầu của
  tôi" (with offers to accept, payment status); mentor "Yêu cầu đang mở" +
  "Offer của tôi" + "Thu nhập" income summary. Role-aware sections in one page.
- Actions in `marketplace/actions.ts`: post request, submit offer, accept offer,
  withdraw, cancel, mark paid.

## Reframes (copy + seed, no logic change)

- **Mentor directory + profile:** show grade, achievements chips, rate range,
  certificate badge, "Đăng yêu cầu với cố vấn này" CTA into the marketplace.
- **Resources → "Kho đề thi & tài liệu ôn tập":** module title/description; seed
  categories (Đề giữa kỳ, Đề cuối kỳ, Đề các năm trước, Tài liệu ôn tập) + entries.
- **Marketing site:** homepage hero + problems + modules + role value props +
  pricing reframed to the PDF's students/mentors/CLB/school narrative and market
  context. Sidebar/module labels aligned.

## Seed additions (cohesive demo)

- Mentor profiles as senior students with achievements + specialties + certificate.
- 2–3 open mentor requests + offers + one accepted engagement (income visible).
- Past-exam resources across the new categories.
- Workflow templates: **Đơn xin tổ chức sự kiện CLB** (Chủ tịch CLB → GV phụ trách
  CLB → GV Ban Liên chi Đoàn → Phó Hiệu trưởng), **Đơn xin mượn cơ sở vật chất**,
  **Đơn xin nghỉ học**, **Đơn xin đổi môn học**, with in-progress submissions.

## UI/UX polish

- Enhance `Motion` primitives: keep `Reveal`/`TiltCard`; add scroll-progress-driven
  reveals with stagger, a subtle parallax wrapper, and an animated number counter —
  all gated on `prefers-reduced-motion`. Apply across marketing + dashboard headers.
- Consistent marketplace UI using existing design-system components (Card, Badge,
  Button, EmptyState) and status-with-icon (not color-only).

## Testing

- Unit: offer state machine (accept locks siblings, cannot offer on own/closed
  request, cannot accept others' request), payment status transitions, price
  validation.
- Integration: concurrent `acceptMentorOffer` on one request yields exactly one
  engagement; audit + outbox written; cross-tenant offer rejected.
- Full suite green (`npm test`), production build, and browser verification of the
  marketplace happy path + seeded CLB workflow.

## Out of scope

- Real payments / card data. AI features. Deadline/escalation workers. New
  real-time transport. Deleting or hiding existing modules.
