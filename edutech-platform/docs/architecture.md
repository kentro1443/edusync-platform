# EduTech Architecture Decision Record

## Status

Approved foundation architecture — 2026-07-22.

## Context

EduTech is a Vietnamese-only, local production SaaS for multiple schools. The system needs durable workflows, strict tenant isolation, role-based authorization, local infrastructure, real-time collaboration, secure file access, and a visual marketing site within one Next.js codebase.

The existing application is a static Next.js prototype. The architecture must enable incremental vertical slices without allowing prototype UI assumptions to become the security or domain model.

## System Shape

EduTech is a modular monolith with a separate real-time process:

```text
Browser
  ├── Next.js App Router web application
  │     ├── Marketing routes
  │     ├── Auth routes
  │     ├── Platform routes
  │     ├── School workspace routes
  │     └── HTTP/API boundaries
  │
  └── WebSocket-compatible real-time client
        │
        └── Local real-time service

Next.js server
  ├── Auth.js session handling
  ├── Server actions and route handlers
  ├── Domain services
  ├── Prisma repositories
  ├── Local file storage adapter
  └── Local notification/email-outbox adapter

Infrastructure
  ├── PostgreSQL: durable application data
  ├── Redis-compatible service: transient events, rate limits, fan-out
  ├── Local filesystem: uploaded file bytes
  └── Email outbox table/files: generated local email records
```

A modular monolith is preferred initially because the project requires strong transactional boundaries across mentoring, scheduling, workflows, and audit records. A standalone real-time process is separated because WebSocket connection lifecycle and fan-out have different runtime characteristics from request/response rendering.

## Tenancy Model

### Tenant identity

A `School` is the tenant boundary. Users may belong to multiple schools through `SchoolMembership`. The platform super-admin has a platform role and is not automatically granted access to school content.

Tenant-owned records must either:

1. Include a direct `schoolId`, or
2. Be reachable only through a relation whose school ownership is enforced by the repository/service boundary.

For high-risk entities, direct `schoolId` is preferred even when redundant. This makes database queries, indexes, audit checks, and negative tests explicit.

### Tenant context

Every authenticated request that touches school data resolves an `AuthContext`:

```ts
type AuthContext =
  | {
      kind: "school";
      userId: string;
      schoolId: string;
      membershipId: string;
      roles: SchoolRole[];
      permissions: Permission[];
    }
  | {
      kind: "platform";
      userId: string;
      roles: ["PLATFORM_SUPER_ADMIN"];
    };
```

The school context comes from the authenticated membership and server-side selection, never from an untrusted query or form field. Mutations may accept an entity ID but must derive its school from the database and compare it with the context.

### Repository rules

- Repositories receive a required school scope for tenant operations.
- A repository must not expose an unscoped `findById` for tenant entities.
- Cross-tenant joins are forbidden unless explicitly part of a platform aggregate.
- Search indexes are partitioned or filtered by school ID.
- File keys include an opaque school path and never expose raw filesystem paths.
- Real-time channels include school and authorization checks before subscription.

## Authentication and Sessions

Auth.js credentials authentication is the application authentication boundary.

### Requirements

- Passwords are hashed with Argon2id.
- Sessions are database-backed and revocable.
- Session cookies are secure, HTTP-only, same-site, and appropriately scoped.
- Login attempts are rate-limited and lockouts are auditable.
- Invitation and password-reset tokens are single-use, hashed at rest, and expiry-bound.
- Seed accounts require password change on first login.
- Session callbacks attach only stable identifiers; permissions are reloaded server-side when sensitive operations occur.
- A session does not itself grant school access. A current school membership must be resolved and active.

### Auth layers

1. `getAuthenticatedUser()` verifies session presence.
2. `requireSchoolContext()` resolves an active school membership.
3. `requirePermission(permission)` checks role/permission policy.
4. Domain service rechecks entity ownership and state transition constraints.
5. Database transaction commits the mutation and audit/domain events.

## Authorization

Authorization uses permission-based policies derived from role membership.

```text
role membership → role permissions → effective membership permissions
                              ↓
                     resource policy checks
                              ↓
                     domain state transition
```

Roles are tenant-scoped and users may hold more than one role. Effective permissions are the union of assigned role permissions, subject to school policy and resource ownership checks.

Authorization has three distinct levels:

- **Visibility**: whether a user can discover or read a resource.
- **Capability**: whether a user may attempt an operation.
- **State policy**: whether the operation is valid for the current resource state.

All three are checked server-side.

## Data and Transactions

Prisma is the data access layer. Domain services own transactions for operations that change multiple records.

Examples requiring transactions:

- Booking an appointment and updating capacity/waitlist state.
- Publishing a workflow template version.
- Approving a workflow step and advancing the submission.
- Creating a membership and recording an approval event.
- Uploading a file version and creating its audit record.
- Creating a notification and an email-outbox item idempotently.

Domain events are persisted in an outbox table inside the same transaction as the source mutation. A worker or real-time bridge publishes them after commit. Consumers are idempotent using a stable event ID.

## State Machines

Status fields are not free-form mutations. Each domain exposes explicit transition functions:

```ts
transitionAppointment(current, "CONFIRM", actorPolicy)
transitionResource(current, "SUBMIT_FOR_REVIEW", actorPolicy)
transitionWorkflowSubmission(current, "APPROVE_STEP", actorPolicy)
```

A transition function validates:

- Current state.
- Actor permission.
- Required data.
- State-specific invariants.
- Allowed next state.
- Audit event details.

The database stores the resulting status and an append-only history record.

## File Storage

The first adapter is local filesystem storage.

```ts
interface FileStorage {
  put(input: PutFileInput): Promise<StoredFile>;
  openReadStream(fileKey: string): Promise<NodeJS.ReadableStream>;
  remove(fileKey: string): Promise<void>;
  exists(fileKey: string): Promise<boolean>;
}
```

Rules:

- Bytes are stored outside the public web root.
- The database stores opaque keys, metadata, content hash, and ownership.
- File download requires a server authorization check.
- Original filenames are treated as display metadata, not paths.
- Paths are generated from IDs and validated before filesystem access.
- Uploads are streamed or size-limited before persistence.
- MIME type is detected/validated rather than trusted solely from a client header.
- Version records are immutable; rollback creates a new active pointer or version event.
- Storage cleanup is asynchronous and audited.

## Notifications and Email

Notifications are first-class durable entities.

- The source transaction writes an outbox event.
- A notification consumer resolves recipients using tenant policy and entity visibility.
- The consumer creates an in-app notification with an idempotency key.
- The local email adapter writes a rendered email to an email-outbox record.
- The UI receives the notification through the real-time service when connected.
- A normal query remains the source of truth if real-time delivery is unavailable.

External email and SMS providers can later implement the adapter interface without changing domain services.

## Real-Time Service

The real-time process authenticates a connection using the same session boundary or a short-lived signed connection token.

Connection flow:

1. Browser requests a connection token from the Next.js server.
2. Server validates session, school membership, and channel intent.
3. Browser connects to the real-time process with the short-lived token.
4. Real-time process validates token signature and expiry.
5. Subscription authorization is checked for each school/channel.
6. Redis-compatible pub/sub distributes events across process instances.
7. Client receives event and invalidates/refetches the durable query.

Real-time events are delivery hints, not the durable data source. If a message is missed, query refresh recovers the state.

## Workflow Engine

Workflow templates contain:

- A draft definition.
- Published immutable versions.
- Form field definitions.
- Conditional rules.
- Approval graph.
- Role/user assignment rules.
- SLA/deadline configuration.
- Notification triggers.

Published versions are immutable. A template update creates a new draft or version. Submissions reference the exact published version they used, so later template changes cannot alter historical interpretation.

The workflow engine is generic. Domain modules provide:

- Submission context.
- Allowed attachment/entity links.
- Domain-specific policy hooks.
- Completion side effects.

## Search

The first implementation uses PostgreSQL indexes and tenant-filtered queries. Search abstractions will isolate query construction so a later dedicated search engine can be introduced without changing feature APIs.

All search requests must include school scope. Public marketing search is separate and has no school context.

## Observability and Audit

Every important mutation writes an audit event:

- Actor and actor type.
- School ID when applicable.
- Action.
- Entity type and ID.
- Before/after summary where safe.
- Request/correlation ID.
- Timestamp.
- Result and failure reason where applicable.

Sensitive values such as passwords, reset tokens, private notes, and raw file bytes are never written to audit logs.

Initial observability is structured application logging plus database-backed audit/outbox records. Metrics can be added behind a service boundary later.

## Error Handling

- Validation errors return field-level structured errors.
- Permission failures are indistinguishable from resource absence where disclosure would be unsafe.
- Domain conflicts return typed conflict errors.
- Unexpected errors are logged with a correlation ID and shown as a safe generic message.
- Server actions never serialize secrets or internal stack traces to clients.
- UI provides retry, empty, forbidden, and failure states.

## Deployment and Local Operations

Docker Compose runs:

- PostgreSQL.
- Redis-compatible service.

The web app, real-time service, and optional workers run as local Node processes during development. Uploaded storage is mounted to an ignored local directory.

Environment variables are validated at startup. `.env.example` documents names and safe local defaults but never includes credentials intended for production.

## Security Review Baseline

- Argon2id password hashing.
- CSRF protection through framework/server-action boundaries and same-site cookies.
- XSS-safe rendering and sanitized rich text.
- Content-Disposition and MIME safety for downloads.
- Rate limits on login, password reset, invitations, messaging, and uploads.
- Tenant-scoped authorization at repositories and services.
- Audit logging for support access and privileged changes.
- No raw SQL using untrusted string interpolation.
- No client-supplied role or school ownership accepted as authority.
- Upload quotas and abuse controls.
- Secure headers and no-store responses for private data where appropriate.

## Evolution Strategy

The modular monolith may later extract:

- Real-time delivery.
- Notification workers.
- Search.
- File storage.
- Reporting/analytics.

Extraction is deferred until load or operational evidence requires it. Stable interfaces for storage, notification delivery, search, and event publication are created from the beginning.

## Implemented Reporting and Operations Boundary

Phase 9 keeps reporting as read-side services inside the modular monolith:

- `reporting-service` executes aggregate-only, tenant-scoped queries; mentoring data never returns note bodies.
- `search-service` applies both tenant and capability filters before returning resources, calendars, clubs, workflows, conversations, or members.
- CSV exports neutralize spreadsheet formulas, use UTF-8 BOM for Vietnamese, disable link prefetch, and append an audit record.
- Liveness is process-only at `/api/health`; readiness verifies PostgreSQL at `/api/readiness`.
- `cleanup-service` applies explicit retention windows. It supports dry-run and emits a structured completion log.
- HTTP security headers are centralized in `next.config.ts`; mutation abuse controls are centralized in `proxy.ts`.

The local file adapter stores bytes outside the public tree under opaque keys. The local email adapter stores rendered deliveries under an ignored directory. Server-sent events are hints; durable database queries remain authoritative.
