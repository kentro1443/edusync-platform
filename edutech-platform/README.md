# EduTech Platform

EduTech is a multi-tenant school operations platform built with Next.js, TypeScript, Prisma, PostgreSQL, and Redis. Phases 1–4 provide the foundation, identity, mentoring, and resource library. Phase 5 adds tenant-scoped school calendars and booking; Phase 6 adds immutable no-code workflow templates, submissions, and approvals.

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

## Demo accounts

The seed creates two schools (`Minh Khai` and `Nguyễn Du`) and every foundation role. All demo users share this local-development password:

```text
EduTech-Demo-2026!
```

Seeded users carry the `mustChangePassword` flag. On first login, enter the shared temporary password again at `/doi-mat-khau`, choose a new password with at least 12 characters, and continue to the school selector or dashboard.

Re-running `npm run db:seed` intentionally restores this shared password for every listed demo user, resets their first-login state, and revokes their existing sessions and password-reset tokens. Do not re-seed while preserving an active demo session.

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

These credentials are development fixtures only and must not be used in production.

## Database commands

| Command | Purpose |
| --- | --- |
| `npm run db:validate` | Validate the Prisma configuration and schema |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:migrate` | Create or apply migrations during local development |
| `npm run db:migrate:deploy` | Apply committed migrations non-interactively |
| `npm run db:seed` | Restore deterministic demo schools, users, credentials, roles, and parent links |
| `npm run db:studio` | Open Prisma Studio |

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
| `/dashboard/mentoring/mentors` | Search verified mentors and specialties | Directory permission |
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

## Phase 5–6 routes

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

The Phase 5 delivery now includes room/resource CRUD, capacity validation, blocked periods, and cross-calendar resource conflict locking. Reminder workers and real-time invalidation remain follow-up work. Phase 6 now includes tenant-scoped comments, secure attachments with inline PDF preview, processing history, role-aware submission visibility, and audited reviewer delegation; deadline/escalation and advanced analytics remain follow-up increments. Phase 7 includes a tenant-scoped club/event vertical slice: club lifecycle, applications, membership, event approval, capacity-aware registration and deterministic waitlist.

## Verification status

On July 23, 2026, Phase 1–4 passed their complete verification gates. Phase 4 adds tenant-scoped resource discovery, moderation lifecycle, immutable versions, local secure file upload/download, comments, reports, bookmarks, collections, analytics counters and rollback-as-new-version. Demo seed includes one published and one private resource for Trường Minh Khai.

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
- [`docs/decisions/ADR-001-database-backed-identity-and-tenant-context.md`](docs/decisions/ADR-001-database-backed-identity-and-tenant-context.md)
- [`tasks/todo.md`](tasks/todo.md)
