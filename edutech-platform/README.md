# EduTech Platform

EduTech is a multi-tenant school platform for Vietnamese specialised high schools, built with Next.js, TypeScript, Prisma, PostgreSQL, and Redis. Its core is a **peer-mentor marketplace** where junior students post learning needs and verified senior-student mentors (SAT/IELTS/du học specialties) bid with a price, plus a shared **past-exam/resource library** and **no-code approval workflows** that digitise the paper CLB/event/facility forms (4 signatures, 1–2 weeks → 24–48h). It also includes identity and school administration, staff mentoring/counseling, scheduling, clubs/events, collaboration, notifications, reporting, search, and audit — all permission-aware and tenant-isolated.

## Prerequisites

- Node.js 20 or newer
- npm
- Docker with Docker Compose for the recommended local PostgreSQL and Redis services

## Local setup

Install dependencies:

```bash
npm install
```

Create a local environment file from the committed template:

```bash
cp .env.example .env
```

Replace `AUTH_SECRET` in `.env` with a random value containing at least 32 characters. The remaining example values match `compose.yaml`.

Start PostgreSQL and Redis:

```bash
npm run services:up
```

Apply the committed migrations and load deterministic demo data:

```bash
npm run db:migrate:deploy
npm run db:seed
```

Start the application:

```bash
npm run dev
```

Open <http://localhost:3000>.

Stop local services when they are no longer needed:

```bash
npm run services:down
```

## Production deployment prerequisites

Vercel deployments require explicit production values for `APP_URL`,
`AUTH_SECRET`, `DATABASE_URL`, `REDIS_URL`, `FILE_STORAGE_ROOT`, and
`EMAIL_OUTBOX_ROOT`. Managed Redis URLs may use either `redis://` or the TLS
form `rediss://`.

`FILE_STORAGE_ROOT` and `EMAIL_OUTBOX_ROOT` are local-development adapters.
They are not durable on Vercel. Before enabling file uploads or transactional
email in production, replace them with managed object storage and an email
provider, then run scheduled workers through authenticated HTTP endpoints.

The `dev@edutech.local` account is restricted to development and test by
default. Production access requires the explicit
`ENABLE_PRODUCTION_DEV_MODE=true` environment variable and a separately
rotated production password. The rotation command revokes existing developer
and impersonated sessions and stores the generated credential in macOS
Keychain. Never use the shared demo password for this production account.

## Demo accounts

The seed creates two schools (`Minh Khai` and `Nguyễn Du`) and every foundation role. All demo users share this local-development password:

```text
EduTech-Demo-2026!
```

Demo users enter the dashboard directly; the seed does not force a first-login password change. Re-running `npm run db:seed` restores the shared password, clears the first-login flag, and revokes existing sessions and password-reset tokens. Do not re-seed while preserving an active demo session.

| Scope | Role | Email |
| --- | --- | --- |
| Platform | Platform super admin | `platform@edutech.local` |
| Minh Khai | School admin | `admin.minhkhai@edutech.local` |
| Minh Khai | Teacher/staff | `teacher.minhkhai@edutech.local` |
| Minh Khai | Mentor/counselor and teacher/staff | `mentor.minhkhai@edutech.local` |
| Minh Khai | Student | `student.minhkhai@edutech.local` |
| Minh Khai | Parent/guardian | `parent.minhkhai@edutech.local` |
| Minh Khai | Club leader | `club.minhkhai@edutech.local` |
| Minh Khai | Approver/reviewer | `approver.minhkhai@edutech.local` |
| Nguyễn Du | School admin | `admin.nguyendu@edutech.local` |
| Nguyễn Du | Teacher/staff | `teacher.nguyendu@edutech.local` |
| Nguyễn Du | Mentor/counselor | `mentor.nguyendu@edutech.local` |
| Nguyễn Du | Student | `student.nguyendu@edutech.local` |
| Nguyễn Du | Parent/guardian | `parent.nguyendu@edutech.local` |
| Nguyễn Du | Club leader | `club.nguyendu@edutech.local` |
| Nguyễn Du | Approver/reviewer | `approver.nguyendu@edutech.local` |
| Minh Khai + Nguyễn Du | Multi-school admin (school switching) | `admin.multischool@edutech.local` |
| Developer operator | Demo account switcher | `dev@edutech.local` |

The shared password above is a development fixture and must not be used in
production.

The development account lands on `/dev/switch`. Choose a school, then any
school-scoped demo account to test its real permissions without signing in
again. A persistent amber banner identifies impersonation and provides
controls to change account or return to the development account. Developer
authentication and impersonated sessions are rejected when the application
runs with `NODE_ENV=production`, unless production dev mode has been
explicitly enabled.

To rotate the production developer password after pulling the Vercel
production environment into `.env.production.local`, run:

```bash
node --env-file=.env.production.local \
  --conditions=react-server \
  --import tsx \
  scripts/rotate-production-dev-password.ts
```

Retrieve the generated password from macOS Keychain when signing in:

```bash
security find-generic-password \
  -a dev@edutech.local \
  -s edutech-platform-production-dev \
  -w
```

## Database commands

| Command | Purpose |
| --- | --- |
| `npm run db:validate` | Validate the Prisma configuration and schema |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:migrate` | Create or apply migrations during local development |
| `npm run db:migrate:deploy` | Apply committed migrations non-interactively |
| `npm run db:seed` | Restore deterministic demo schools, users, credentials, roles, and parent links |
| `npm run db:studio` | Open Prisma Studio |
| `npm run outbox:process` | Process one durable notification/email outbox batch |
| `npm run maintenance:cleanup -- --dry-run` | Preview retention cleanup counts |
| `npm run maintenance:cleanup` | Apply the documented retention policy |

Prisma configuration intentionally requires `DATABASE_URL`. Run database commands after creating `.env`, or provide the variable explicitly to the process.

## Start the website for manual testing

Run the following commands one by one from `/Users/huan/EduTechTest`:

1. Start PostgreSQL and Redis:

```bash
npm --prefix edutech-platform run services:up
```

2. Apply database migrations:

```bash
npm --prefix edutech-platform run db:migrate:deploy
```

3. Load the demo accounts for initial setup:

```bash
npm --prefix edutech-platform run db:seed
```

This seed step is normally required only for the initial setup or when the demo fixtures need to be restored.

4. Start the development server and leave this terminal running:

```bash
npm --prefix edutech-platform run dev
```

5. Open <http://localhost:3000> and sign in with a demo account listed above.

After each completed phase or bug fix, the EduTech verification skill runs the automated checks, starts or reuses these services, confirms the website responds at `http://localhost:3000`, and leaves it running for manual testing.

## Testing and quality gates

For the full automated verification after each phase or bug fix, run:

```bash
npm run verify
```

This runs Prisma schema validation, ESLint, TypeScript checking, all Vitest tests, the production build, and the Playwright E2E suite in sequence. It stops immediately when a check fails.

Individual commands:

```bash
npm run db:validate  # Prisma schema
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm test             # Unit/integration tests once
npm run test:watch   # Unit tests in watch mode
npm run build        # Production build
npm run test:e2e     # Playwright browser tests
```

Before running the E2E suite, ensure PostgreSQL and Redis are running and the database has been migrated and seeded. To test manually, run `npm run dev`, open <http://localhost:3000>, and use one of the demo accounts listed above.

The unit/integration suite covers permission evaluation, tenant isolation, parent/student privacy links, opaque/consume-once tokens, durable rate limiting, session revocation, invitation/reset flows, authentication navigation safety, local file-storage containment, and durable email-outbox behavior. Playwright verifies the public site and responsive shell plus every school role, the platform role, forced password change, password reset, invitation acceptance, school switching, and school/platform administration.

## Authentication behavior

- Credentials are verified with Argon2id and failures return a generic Vietnamese message.
- Successful login creates an opaque database session and an `HttpOnly`, `SameSite=Lax` cookie.
- Login, password-reset requests, and invitation delivery use durable HMAC-keyed rate limits.
- Logout revokes the current database session and clears both session and active-school cookies; users can also revoke one, other, or every active session from `/dashboard/security`.
- `/dashboard` requires a valid, unrevoked session.
- Users with multiple active school memberships select a school at `/chon-truong`; the selected slug is stored in a protected cookie and validated against the current session on every use.
- First-login password changes and completed password resets revoke other active sessions.
- Forgot-password responses do not reveal whether an account exists. Reset and invitation links store only HMAC token hashes, expire, and can be consumed once.
- School routes use shared active-membership and permission guards. Platform routes require a separate platform role and never inherit school-content access.
- Mutations use same-origin Next.js Server Actions; authorization and tenant scope are re-evaluated on the server for every action.
- Security-sensitive auth and administration changes are recorded in the append-only audit event store.
- `returnTo` values are restricted to local application paths to prevent open redirects.

## Phase 2 administration routes

| Route | Purpose | Required scope |
| --- | --- | --- |
| `/dashboard/profile` | Personal profile | Authenticated user |
| `/dashboard/security` | Session list/revocation and security history | Authenticated user |
| `/dashboard/admin/members` | Search, filter, invite, role, status, and parent links | School admin |
| `/dashboard/admin/settings` | Tenant display/contact settings | School admin |
| `/dashboard/platform/schools` | Tenant directory and provisioning | Platform super-admin |
| `/quen-mat-khau` | Non-enumerating reset request | Public |
| `/dat-lai-mat-khau` | Consume-once password reset | Valid token |
| `/chap-nhan-loi-moi` | Consume-once school invitation | Valid token |

## Phase 3 mentoring routes

| Route | Purpose | Required scope |
| --- | --- | --- |
| `/dashboard/mentoring` | Role-aware mentoring dashboard and agenda | Active school member |
| `/dashboard/mentoring/marketplace` | Peer-mentor bidding: post requests, submit priced offers, accept, and track income/payment | Marketplace read (offer/request per role) |
| `/dashboard/mentoring/mentors` | Search verified senior-student mentors, specialties, achievements and rates | Directory permission |
| `/dashboard/mentoring/mentors/[mentorProfileId]` | Mentor profile, slots, booking/waitlist | Appointment create |
| `/dashboard/appointments` | Day/14-day appointment agenda | Appointment read |
| `/dashboard/appointments/[appointmentId]` | Approval, reschedule, cancel, complete, attendance | Appointment transition |
| `/dashboard/mentoring/availability` | Weekly rules and exceptions | Availability manage |
| `/dashboard/mentoring/cases` | Case list, filter, and create | Case read/create |
| `/dashboard/mentoring/cases/[caseId]` | Overview, goals, sessions, tasks, files, activity, notes, referral | Case access + note projection |

## Phase 4 resource routes

| Route | Purpose | Required scope |
| --- | --- | --- |
| `/dashboard/resources` | Search-first library with status filters and tenant-scoped cards | Resource read |
| `/dashboard/resources/new` | Create a draft resource | Resource create |
| `/dashboard/resources/[resourceId]` | Detail, preview, comments, reports, lifecycle, versions and rollback | Resource visibility |
| `/dashboard/resources/[resourceId]/download` | Authorized private download | Resource download |
| `/dashboard/resources/[resourceId]/preview` | Inline PDF stream for browser preview; records a preview event | Resource download |
| `/dashboard/resources/moderation` | Review queue for pending resources | Resource review |
| `/dashboard/resources/bookmarks` | Personal bookmarks and collections | Resource read |
| `/dashboard/resources/analytics` | Published-resource usage counters | Resource analytics |

## Phase 5–9 routes

| Route | Purpose | Required scope |
| --- | --- | --- |
| `/dashboard/calendar` | Day/week/month calendar, event creation, conflict-safe booking, recurrence, iCalendar export | Calendar read/create |
| `/dashboard/calendar/[eventId]` | Booking roster, attendance, and cancel/move editor for recurring occurrences | Calendar read/update/attendance |
| `/dashboard/calendar/ical` | Private iCalendar stream for permitted events | Calendar export |
| `/dashboard/calendar/resources` | Room/resource catalog, capacity, availability and blocked-period management | Calendar school manage |
| `/dashboard/workflows` | Template catalog, submission launcher, and recent hồ sơ | Workflow template read |
| `/dashboard/workflows/[templateId]` | Draft builder for fields, conditional/parallel approval steps, and immutable publish | Template create/update/publish |
| `/dashboard/workflows/submissions` | Reviewer queue and authorized CSV export | Submission read/analytics |
| `/dashboard/workflows/submissions/[submissionId]` | Form submission, status/history timeline, scoped discussion, secure attachments/PDF preview, and decisions | Submission scope |
| `/dashboard/workflows/submissions/[submissionId]/attachments/[fileLinkId]` | Authorized inline PDF preview or private attachment download | Submission scope |
| `/dashboard/clubs-events` | Câu lạc bộ trong trường, sự kiện sắp tới và tạo CLB | Club read/create |
| `/dashboard/clubs-events/[clubId]` | Thành viên, đơn tham gia, đề xuất/duyệt sự kiện và đăng ký | Club scope |
| `/dashboard/messages` | Hội thoại theo tenant, mention, tệp đính kèm và cập nhật SSE | Conversation participant |
| `/dashboard/notifications` | Lịch sử thông báo, bộ lọc và tùy chọn nhận tin | Authenticated school member |
| `/dashboard/search` | Tìm kiếm hợp nhất, khóa theo tenant và quyền | Authenticated school member |
| `/dashboard/reports` | Báo cáo vận hành, date range, table alternative và CSV | School report permission |
| `/dashboard/audit` | Bộ lọc và CSV nhật ký kiểm toán | School audit permission |
| `/api/health` | Liveness không phụ thuộc database | Public |
| `/api/readiness` | Readiness có kiểm tra database | Public |

## Demo walkthrough

- `platform@edutech.local`: tenant directory and platform health counts.
- `admin.minhkhai@edutech.local`: members/settings, all school modules, reports and audit.
- `mentor.minhkhai@edutech.local`: mentor directory, availability, appointments and privacy-projected cases.
- `approver.minhkhai@edutech.local`: workflow review queue and decisions.
- `club.minhkhai@edutech.local`: club roster and event operations.
- `student.minhkhai@edutech.local`: published resources, own bookings/submissions and visible clubs.
- `parent.minhkhai@edutech.local`: linked-student scope only.
- `admin.multischool@edutech.local`: validates explicit school switching and tenant isolation.

### Upload and PDF preview

1. Sign in as a school member with resource-create permission and open `/dashboard/resources/new`.
2. Create the draft metadata, then open the resource detail page.
3. In **Tạo phiên bản mới**, choose a `.pdf` file (maximum 25 MiB) and save the version.
4. After the resource is published, every authorized member of the same school sees **Xem trước PDF** on the detail page. The browser loads the file through the protected `/preview` route; the file remains private, and the event increments the resource preview counter.
5. Non-PDF files remain downloadable, but do not render in the PDF preview panel.

Draft and private resources stay visible only to their author and moderation roles. Students and parents see published, non-private resources within their school.

## Architecture documentation

- [`docs/specification.md`](docs/specification.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/data-model.md`](docs/data-model.md)
- [`docs/permissions-matrix.md`](docs/permissions-matrix.md)
- [`docs/operations-runbook.md`](docs/operations-runbook.md)
- [`docs/release-checklist.md`](docs/release-checklist.md)
- [`docs/decisions/ADR-001-database-backed-identity-and-tenant-context.md`](docs/decisions/ADR-001-database-backed-identity-and-tenant-context.md)
- [`tasks/todo.md`](tasks/todo.md)
