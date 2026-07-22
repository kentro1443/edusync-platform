# Spec: EduTech Enterprise Platform

## Status

Approved for implementation on 2026-07-22.

## Objective

EduTech is a production-ready local, multi-tenant SaaS platform for Vietnamese secondary schools. It replaces the existing static LiênKếtHọc prototype with:

1. A visually rich, interactive marketing experience.
2. A persistent, authenticated enterprise application.
3. Strictly isolated school workspaces.
4. Complete workflows for mentoring, resources, scheduling, forms and approvals, clubs and events, communication, administration, and reporting.

The first release is Vietnamese-only. Every visible product action must perform a real operation or be clearly disabled with an explanation. Static controls presented as functional are not acceptable.

## Confirmed Product Decisions

- Product name: **EduTech**
- Language: Vietnamese only for release one
- Delivery target: production-ready local SaaS
- Architecture: full multi-tenancy with platform administration and isolated school workspaces
- Scope: full-depth workflows delivered through verified vertical slices
- Database: PostgreSQL
- ORM: Prisma
- Authentication: Auth.js credentials authentication with database-backed sessions
- Local infrastructure: Docker Compose
- File storage: local secure storage adapter
- Notifications: persistent in-app notifications and local email outbox
- Collaboration: real-time notifications, direct messaging, comments, mentions, and activity updates
- Workflow configuration: no-code form and approval builder with reusable templates and immutable version history
- Parent/guardian access: independent authenticated accounts
- External providers: adapter-based boundaries with local development implementations

## Users and Roles

A user may have multiple roles within one or more schools. Role membership is tenant-scoped except for the platform super-admin.

### Platform Super-admin

- Create, configure, suspend, restore, and inspect schools.
- Manage plans, quotas, feature flags, and platform settings.
- View platform health and cross-tenant security metadata.
- Start explicitly authorized support sessions with a complete audit trail.
- Never silently access tenant-owned content.

### School Administrator

- Configure school identity, academic years, terms, grades, classes, departments, and subjects.
- Invite, import, activate, suspend, and organize users.
- Assign roles and tenant permissions.
- Configure form and workflow templates.
- Manage school-wide moderation, reports, quotas, retention rules, and audit events.

### Teacher or Staff Member

- Manage assigned classes and students.
- Publish or moderate resources when authorized.
- Create availability and appointments.
- Supervise clubs and events.
- Participate in assigned approval workflows.

### Mentor or Counselor

- Maintain a verified profile, expertise, subjects, and availability.
- Accept, reject, reschedule, and conduct mentoring sessions.
- Record agendas, goals, outcomes, follow-up work, and visibility-controlled notes.
- Communicate with assigned students and guardians under school policy.

### Student

- Discover resources, mentors, clubs, and events.
- Book appointments and join waitlists.
- Submit forms and monitor approvals.
- Register for clubs and events.
- Track tasks, bookmarks, history, and notifications.
- Communicate with authorized participants.

### Parent or Guardian

- Access only explicitly linked students.
- View information permitted by school privacy policy.
- Approve consent requests.
- View permitted appointments, progress, events, and notifications.
- Communicate with authorized school staff.

### Club Leader

- Manage club profile, membership applications, members, and roles.
- Create announcements, meetings, tasks, proposals, budgets, and events.
- Record attendance and submit post-event reports.

### Approver or Reviewer

- Process assigned moderation and approval queues.
- Approve, reject, request changes, comment, and delegate where policy allows.
- Inspect the immutable decision history.

## Authorization Requirements

- Authorization is enforced on the server for every query, mutation, file operation, and real-time subscription.
- UI visibility is supplementary and is never the security boundary.
- A client-provided tenant ID is never trusted.
- Every tenant-owned record carries a tenant identifier or belongs to an entity with an unambiguous tenant path.
- Every tenant query is scoped through the authenticated tenant context.
- Cross-tenant access is denied and covered by automated negative tests.
- Sensitive counseling notes use explicit visibility classifications.
- Parent access is restricted to linked students and policy-permitted fields.
- Platform support access requires explicit initiation, limited duration, and auditing.

## Functional Scope

### 1. Authentication, Identity, and Tenancy

- Secure credentials login using Argon2 password hashing.
- Auth.js database-backed sessions.
- Password reset through a local email outbox.
- Forced password change for invited and seeded users.
- Session listing and revocation.
- Login throttling and temporary lockout.
- Tenant selection for users with multiple memberships.
- Expiring, single-use invitations.
- User profile, accessibility, and notification preferences.
- Multi-role tenant memberships.
- Seeded schools and role-specific demo accounts.
- Platform school lifecycle management.
- School suspension and restoration.
- Tenant quotas and feature flags.

### 2. School and Academic Administration

- School setup wizard.
- Academic years and terms.
- Grades, classes, departments, and subjects.
- Staff and student assignment.
- Parent/guardian linking.
- User invitation and CSV import with validation report.
- Role assignment and permission inspection.
- Configurable school policy and retention settings.
- Administrative dashboard and audit explorer.

### 3. Mentoring and Counseling

- Searchable mentor directory.
- Filters for expertise, subject, verification, rating, and availability.
- Mentor profile verification and moderation.
- Recurring availability, exceptions, holidays, capacity, and booking windows.
- Transactional appointment conflict prevention.
- Optional school-configured booking approval.
- Rescheduling, cancellation, reason capture, reminders, and waitlists.
- Session agenda, goals, notes, outcomes, attachments, and follow-up tasks.
- Note visibility classification and access controls.
- Feedback, reporting, and moderation.
- Workload, attendance, satisfaction, and response-time analytics.

### 4. Resource Library

- Secure local upload with configurable file-type and size limits.
- Subject, grade, exam, curriculum, year, topic, author, license, and tag metadata.
- Draft, review, approved, rejected, and archived lifecycle.
- File and metadata revision history.
- Version rollback.
- Browser preview for supported formats.
- Authorized download for other formats.
- Full-text and metadata search.
- Filtering, sorting, pagination, bookmarks, collections, and recently viewed.
- Ratings, comments, mentions, reports, and moderation.
- Duplicate detection.
- View and download analytics.
- Tenant storage quotas.
- Complete audit history.

### 5. Scheduling and Appointments

- Day, week, month, and list calendar views.
- Personal, mentor, room, club, and school calendars.
- Recurring events and exceptions.
- Conflict detection for users, rooms, and resources.
- Capacity and waitlists.
- Check-in, attendance, cancellation, and no-show tracking.
- Holidays and blocked periods.
- Reschedule and cancellation policy enforcement.
- iCalendar export.
- Reminder rules and real-time updates.

### 6. No-Code Form and Workflow Builder

Supported fields:

- Text
- Long text
- Number
- Date and time
- Select
- Multi-select
- Radio
- Checkbox
- File
- Person
- Class
- Consent
- Rich instructions

Builder capabilities:

- Add, remove, reorder, duplicate, and configure fields.
- Required fields and validation constraints.
- Conditional visibility and branching.
- Sequential and parallel approval steps.
- Role-based and user-based reviewer assignment.
- Conditional reviewer routing.
- Deadlines, reminders, escalation, delegation, and SLA states.
- Draft, published, and retired template lifecycle.
- Immutable published versions.
- Reusable templates within each school.
- Submission autosave.
- Attachment handling.
- Comments, mentions, and complete history.
- Withdrawal, cancellation, and reopening where policy permits.
- Approve, reject, request changes, return, and delegate actions.
- CSV export and workflow analytics.

The workflow engine must support leave requests, event proposals, resource moderation, parent consent, and custom school processes without domain-specific code for every template.

### 7. Clubs and Events

- Club directory, categories, visibility, and supervised ownership.
- Club profiles and school approval.
- Membership applications with configurable questions.
- Member roles and membership lifecycle.
- Announcements, discussions, files, meetings, and tasks.
- Event proposals connected to configurable workflows.
- Venue and shared-resource conflict checks.
- Capacity, registration, waitlists, and cancellation.
- Parent consent where required.
- QR-compatible and manual attendance.
- Budget requests and expense line items.
- Risk and safety plans.
- Post-event reports and outcomes.
- Participation and engagement analytics.

### 8. Real-Time Collaboration

- Authorized direct and group conversations.
- Persistent messages, unread counts, attachments, and soft deletion.
- Comments and mentions on supported records.
- Real-time notifications through a local WebSocket-compatible service.
- Real-time updates for approvals, appointments, moderation, messages, and activity feeds.
- Read and unread state.
- Notification preferences.
- Local email outbox for generated email notifications.
- Event-driven notification handling with idempotency.

### 9. Search, Reporting, and Audit

- Tenant-scoped global command and search palette.
- Role-specific dashboards.
- Filterable metrics and date ranges.
- CSV exports.
- Operational queues and SLA indicators.
- Immutable security and workflow audit events.
- Searchable audit explorer.
- Platform health and tenant lifecycle reporting.

## Visual and Interaction Specification

### Direction

EduTech uses a premium editorial-technology visual system instead of a generic gradient SaaS template.

- Warm off-white editorial canvases.
- Midnight and ink product surfaces.
- Cobalt, cyan, coral, amber, and acid-lime module accents.
- Oversized Vietnamese typography.
- Asymmetric, purposeful composition.
- Layered product-window illustrations built from actual EduTech components.
- Fine grids, dimensional cards, subtle grain, and restrained glass effects.
- Distinct module colors within one cohesive token system.
- Rich dark and light surfaces.

### Motion and Interaction

- Scroll-triggered section reveals.
- Sticky product storytelling sequences.
- Scroll-linked progress and depth transformations.
- Subtle parallax layers.
- Animated workflow paths and data visualizations.
- Interactive product previews.
- Purposeful hover and focus interactions.
- Loading, success, drag, optimistic, and state-transition feedback.
- Route, drawer, dialog, and panel transitions.
- Skeleton states.

### Motion Boundaries

- Motion must explain hierarchy, causality, or state.
- No scroll hijacking.
- Animation must not block task completion.
- All movement must respect `prefers-reduced-motion`.
- Keyboard and assistive-technology workflows must not depend on animation.
- Marketing-only animation code must not burden authenticated routes unnecessarily.
- Mobile fallbacks must preserve meaning without requiring parallax or hover.

## Technology Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma
- PostgreSQL
- Auth.js credentials provider and database sessions
- Argon2 password hashing
- Zod validation
- React Hook Form
- Motion for React
- TanStack Table
- Redis-compatible local service
- Socket.IO-compatible local real-time process where required
- Vitest
- React Testing Library
- Playwright
- Docker Compose
- Local filesystem storage adapter
- Local email outbox adapter

Dependency versions must be pinned to mutually compatible releases during implementation.

## Commands

The target command surface is:

```bash
# Start local infrastructure
docker compose up -d

# Install dependencies
npm install

# Create and apply local database migrations
npm run db:migrate

# Seed demo schools and accounts
npm run db:seed

# Start the web application
npm run dev

# Start the local real-time service
npm run realtime:dev

# Run unit and integration tests
npm run test

# Run browser tests
npm run test:e2e

# Run static checks
npm run lint
npm run typecheck

# Build the production application
npm run build
```

The exact scripts will be added and verified during foundation implementation.

## Project Structure

```text
edutech-platform/
├── docs/
│   ├── specification.md
│   ├── architecture.md
│   ├── permissions-matrix.md
│   └── data-model.md
├── tasks/
│   ├── plan.md
│   └── todo.md
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── storage/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   ├── (auth)/
│   │   ├── (platform)/
│   │   ├── (workspace)/
│   │   └── api/
│   ├── components/
│   │   ├── marketing/
│   │   ├── app/
│   │   └── ui/
│   ├── features/
│   │   ├── auth/
│   │   ├── tenants/
│   │   ├── mentoring/
│   │   ├── resources/
│   │   ├── scheduling/
│   │   ├── workflows/
│   │   ├── clubs/
│   │   ├── messaging/
│   │   └── reporting/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── permissions/
│   │   ├── storage/
│   │   ├── notifications/
│   │   └── validation/
│   └── server/
│       ├── actions/
│       ├── services/
│       └── repositories/
├── tests/
├── e2e/
└── docker-compose.yml
```

## Code Style

Business logic must be tenant-aware, explicit, validated, and separated from rendering.

```ts
const input = createAppointmentSchema.parse(payload);
const actor = await requireTenantPermission("appointment:create");

return prisma.$transaction(async (tx) => {
  await assertAvailability(tx, actor.tenantId, input);

  const appointment = await createAppointment(tx, actor, input);

  await enqueueDomainEvent(tx, {
    tenantId: actor.tenantId,
    type: "appointment.created",
    entityId: appointment.id,
  });

  return appointment;
});
```

Conventions:

- `camelCase` for values and functions.
- `PascalCase` for components, classes, and types.
- Domain services own business rules.
- Server actions and API handlers remain thin.
- Every tenant-owned query is tenant-scoped.
- Status transitions use explicit state-machine functions.
- Zod validates every untrusted boundary.
- Avoid `any`.
- Do not rely on client-only authorization.
- Prefer server components unless interaction requires a client component.
- Keep feature modules cohesive and avoid global utility dumping grounds.

## Testing Strategy

### Unit Tests

- Permission policies.
- Workflow state transitions.
- Scheduling conflicts and recurrence.
- Notification routing.
- Validation and tenant-scoping helpers.
- Domain calculations and status transitions.

### Integration Tests

- Prisma repositories against PostgreSQL.
- Authentication and session behavior.
- Cross-tenant denial.
- File authorization and revision history.
- Transactional appointment conflict prevention.
- Workflow publication and version immutability.
- Notification and outbox idempotency.

### End-to-End Tests

- Every seeded role can sign in.
- School A cannot access School B.
- Complete mentoring lifecycle.
- Complete resource upload, moderation, and version lifecycle.
- Appointment recurrence, conflict, and waitlist lifecycle.
- Workflow design, publish, submit, and approval lifecycle.
- Club membership, event, consent, and attendance lifecycle.
- Parent consent workflow.
- Real-time notification and message delivery.
- Platform tenant lifecycle.

### Quality Gates

```bash
docker compose up -d
npm run db:migrate
npm run db:seed
npm run test
npm run test:e2e
npm run lint
npm run typecheck
npm run build
```

Critical authorization and workflow-state modules require high branch coverage. Critical acceptance paths require end-to-end coverage.

## Boundaries

### Always

- Scope tenant-owned data on the server.
- Validate input and authorize every mutation.
- Use transactions for multi-record state changes.
- Audit security-relevant and workflow-relevant events.
- Preserve published workflow versions.
- Implement loading, empty, failure, and forbidden states.
- Provide keyboard navigation and reduced-motion support.
- Run tests, lint, typecheck, and build at checkpoints.

### Ask First

- Integrating an external provider.
- Performing a destructive schema or data migration.
- Adding deployment infrastructure.
- Changing confirmed role semantics.
- Removing a requested module.

### Never

- Store plaintext passwords or secrets.
- Trust a client-provided tenant ID.
- Expose private counseling notes to unauthorized roles.
- Permit cross-tenant search or file access.
- Weaken or delete tests to conceal failures.
- Present nonfunctional controls as functional.
- Commit uploaded files, credentials, or local database data.
- Mutate a published workflow version.

## Delivery Phases

### Phase 0 — Specification and Foundation

- Save the specification, architecture, permission matrix, data model, implementation plan, and task list.
- Add Docker PostgreSQL and Redis.
- Add test tooling and quality scripts.
- Establish environment validation and local setup documentation.

### Phase 1 — Brand and Design System

- Rename all LiênKếtHọc references to EduTech.
- Expand color, typography, elevation, and motion tokens.
- Replace core primitives with enterprise-ready variants.
- Build richer marketing navigation, footer, and application shell.

### Phase 2 — Identity, Tenancy, and Authorization

- Add Prisma schema and migrations.
- Add Auth.js credential sessions.
- Add tenant context and role-based access control.
- Add invitations, password reset, and session controls.
- Seed demo schools and accounts.
- Add super-admin and school administration.

### Phase 3 — Rich Marketing Experience

- Rebuild the homepage and module pages.
- Add sticky storytelling, scroll motion, product previews, and animated data.
- Add reduced-motion and mobile fallbacks.
- Connect calls-to-action to real product routes.

### Phase 4 — Mentoring

- Build mentor discovery, verification, availability, booking, sessions, notes, feedback, and analytics.

### Phase 5 — Resources

- Build upload and storage, metadata, search, moderation, versions, preview, collections, comments, and analytics.

### Phase 6 — Scheduling

- Build calendar views, recurrence, conflicts, rooms, resources, waitlists, attendance, reminders, and iCalendar export.

### Phase 7 — Workflow Engine

- Build no-code forms, template publication and versioning, approval graphs, conditions, escalation, submissions, and history.

### Phase 8 — Clubs and Events

- Build clubs, memberships, leadership, proposals, budgets, events, consent, registration, waitlists, attendance, and reports.

### Phase 9 — Real-Time Collaboration

- Build messaging, comments, mentions, notifications, email outbox, activity updates, and preferences.

### Phase 10 — Reporting and Hardening

- Build role dashboards, analytics, exports, audit explorer, command search, and quotas.
- Complete security, tenant-isolation, accessibility, and performance reviews.
- Complete end-to-end verification.

Each phase must remain buildable and testable. Verification may not be deferred until the end.

## Success Criteria

The release is complete only when:

- All user-facing branding says **EduTech**.
- Marketing pages are visually rich, responsive, interactive, and motion-accessible.
- All listed roles can sign in using seeded accounts.
- Tenant isolation is proven with automated negative tests.
- Every requested module supports complete persistent workflows.
- Concurrent scheduling attempts cannot create conflicts.
- Published workflow versions cannot be retroactively changed.
- Files are access-controlled and retain revision history.
- Messages and notifications update in real time locally.
- Important state transitions are auditable.
- Major list views support search, filtering, sorting, and pagination.
- Loading, empty, error, and forbidden states exist.
- No primary product control is a dead interaction.
- Unit, integration, and end-to-end suites pass.
- Lint, typecheck, and production build pass.
- Core keyboard workflows and reduced-motion behavior pass accessibility checks.

## Non-Goals for Release One

- Native iOS or Android applications.
- Production cloud deployment.
- Live SMS delivery.
- Live external email delivery.
- External object storage.
- Payment processing.
- English localization.
- Third-party student-information-system integrations.

The architecture must expose adapter boundaries so local implementations can later be replaced without rewriting domain workflows.