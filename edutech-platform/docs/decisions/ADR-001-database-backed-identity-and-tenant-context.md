# ADR-001: Database-backed identity and explicit tenant context

## Status

Accepted

## Date

2026-07-23

## Context

EduTech serves multiple schools from one application. The same person may belong
to more than one school, while a platform operator must not silently inherit
access to school content. Authentication links and sessions also need revocation,
expiry, audit history, and deterministic local testing.

The design must satisfy these constraints:

- Every school-owned query is scoped by the active `schoolId`.
- Membership status and school status take effect on the next request.
- Session, invitation, and reset tokens are revocable and never stored in raw
  form in their identity tables.
- School and platform authorization remain separate.
- Security-sensitive mutations are auditable and testable without an external
  identity provider.

## Decision

Use first-party Argon2id credentials with opaque, HMAC-hashed database sessions.
Resolve active memberships on every session read and store only a validated
school slug in an `HttpOnly`, `SameSite=Lax` context cookie.

Server Actions call shared authenticated, school, or platform guards and then a
service that checks the same typed permission registry. School services accept an
authorization context and include its `schoolId` in every target query.

Invitation and password-reset links use random opaque tokens. Their HMAC hashes
are stored in lifecycle tables; raw links exist only in the email outbox until
delivery. Consumption uses a conditional database update so a link succeeds once.

Authentication throttles are durable PostgreSQL records keyed by HMAC. Updates
take a transaction-scoped advisory lock per key to prevent concurrent attempts
from losing increments. Revocation preserves session rows for audit history.

Next.js Server Actions are the mutation boundary. They retain the framework's
same-origin checks, re-resolve authorization on the server, validate all form
data, and never trust navigation visibility as access control.

## Alternatives considered

### Stateless signed sessions

- Advantage: no database read on normal requests.
- Rejected: immediate per-device, user-wide, membership, and school revocation
  would require another revocation store and duplicate the database design.

### Platform role implies school access

- Advantage: fewer support workflows.
- Rejected: it violates least privilege and makes cross-tenant access easy to do
  accidentally. Future support access must be explicit, time-limited, and audited.

### Store a school ID supplied by the client

- Advantage: simple routing.
- Rejected: a client value is not authority. EduTech stores a slug for UX only
  and validates it against active session contexts on every request.

### In-memory rate limiting

- Advantage: low implementation cost.
- Rejected: counters disappear on restart and diverge across application
  instances. PostgreSQL provides durable, deployment-independent enforcement.

### External identity provider in Phase 2

- Advantage: delegated credential operations and optional enterprise SSO.
- Rejected for this phase: it adds vendor and environment dependencies before
  school tenancy rules are stable. The service boundaries allow later federation
  without weakening tenant authorization.

## Consequences

- Authentication requires a database read, but permission and membership changes
  take effect immediately.
- Revoked/expired rows require a retention and cleanup job in a later operations
  phase.
- Email outbox payloads are sensitive until token expiry and require restricted
  database access plus delivery-time redaction/retention policy in production.
- Suspension of one school currently revokes a user's sessions globally. This is
  intentionally conservative; a future school-scoped session model may reduce
  disruption for multi-school users.
- PostgreSQL is part of the security boundary because rate-limit serialization
  uses transaction-scoped advisory locks.
- All new school services must preserve the guard → authorization context →
  tenant-scoped query pattern and add negative cross-tenant tests.
