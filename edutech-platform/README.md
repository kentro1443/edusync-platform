# EduTech Platform

EduTech is a multi-tenant school operations platform built with Next.js, TypeScript, Prisma, PostgreSQL, and Redis. Phases 1–2 provide the production foundation: a responsive Vietnamese design system and marketing site, database-backed identity and session security, tenant-safe authorization, school membership administration, and platform tenant provisioning.

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

## Verification status

On July 23, 2026, Phase 1 and Phase 2 passed their complete verification gates: 78 unit/integration tests, lint, typecheck, production build, 24 Playwright scenarios, and Git whitespace validation all pass. Phase 3 adds transactional mentoring booking, waitlist, appointment lifecycle, counseling cases, encrypted note projection, and role-aware dashboards; rerun the full verification gate after future changes.

## Architecture documentation

- [`docs/specification.md`](docs/specification.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/data-model.md`](docs/data-model.md)
- [`docs/permissions-matrix.md`](docs/permissions-matrix.md)
- [`docs/decisions/ADR-001-database-backed-identity-and-tenant-context.md`](docs/decisions/ADR-001-database-backed-identity-and-tenant-context.md)
- [`tasks/todo.md`](tasks/todo.md)
