# EduSync operations runbook

## Required production environment

Set `NODE_ENV=production`, `APP_URL` to the canonical HTTPS origin, a unique random `AUTH_SECRET` of at least 32 characters, `DATABASE_URL`, `REDIS_URL`, and durable writable paths for `FILE_STORAGE_ROOT` and `EMAIL_OUTBOX_ROOT`.

Do not reuse `.env.example` secrets. Terminate TLS at the platform/load balancer, persist both adapter directories, restrict database access, and run migrations before replacing web instances.

## Deploy

```bash
npm ci
npm run db:migrate:deploy
npm run build
npm run start
```

Verify:

```bash
curl --fail https://your-host/api/health
curl --fail https://your-host/api/readiness
```

`health` proves the process can serve traffic. `readiness` also proves PostgreSQL is reachable. Remove an instance from rotation when readiness is non-200.

## Durable workers

Run the outbox command repeatedly from a scheduler (recommended every minute):

```bash
npm run outbox:process
```

The command claims bounded batches, retries with backoff, recovers expired leases, and is safe to invoke again. Unknown event types remain pending for a compatible consumer.

Send due calendar reminders (recommended every 5 minutes):

```bash
npm run calendar:remind
```

Idempotent per (event, lead time); a reminder cannot be sent twice.

Escalate overdue workflow approval steps (recommended hourly):

```bash
npm run workflows:escalate
```

Idempotent: a step already marked overdue is not re-escalated or double-notified. Emits one `workflow.step.overdue` outbox event per newly overdue step.

Preview retention daily:

```bash
npm run maintenance:cleanup -- --dry-run
```

Apply it from a single scheduled job:

```bash
npm run maintenance:cleanup
```

The default job never removes unread notifications, pending outbox work, available files, application records, or audit history.

## Backup

Create a consistent PostgreSQL custom-format backup:

```bash
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" > edusync.dump
```

Back up `FILE_STORAGE_ROOT` in the same operational window. Database file metadata and stored bytes must be restored as a matched pair. `EMAIL_OUTBOX_ROOT` is useful for local delivery evidence but is not the source of truth.

Encrypt backups, restrict access, record checksums, and test restore regularly.

## Restore drill

Restore into a new empty database, never over the live database:

```bash
createdb edusync_restore
pg_restore --clean --if-exists --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" edusync.dump
DATABASE_URL="$RESTORE_DATABASE_URL" npm run db:migrate:deploy
```

Restore the matching file-storage snapshot, point a non-production app instance at the restored database/storage, then verify readiness, demo-free authentication, tenant isolation, and one authorized file preview. Promote only after checks pass.

## Incident checks

1. Check `/api/readiness`.
2. Inspect structured JSON logs by `event` and timestamp.
3. Inspect pending/failed `DomainOutboxEvent` and `EmailOutbox` rows without exposing payload secrets.
4. Confirm disk space for database and `FILE_STORAGE_ROOT`.
5. Confirm the canonical `APP_URL`, cookie security, and proxy-forwarded client IP.
6. Roll back the application build if behavior regressed; do not reverse a data migration without a reviewed recovery plan.

## Local adapters and production replacement

- Storage: `LocalFileStorage` writes opaque keys beneath `FILE_STORAGE_ROOT`, rejects traversal, and streams only after domain authorization.
- Email: `LocalEmailDelivery` writes rendered messages beneath `EMAIL_OUTBOX_ROOT`; replace it with a provider adapter before live email.
- Realtime: authenticated SSE plus polling fallback invalidates durable queries. Multi-region deployments should add a shared pub/sub adapter.

## Accessibility and performance audit (2026-07-26)

Automated WCAG 2.2 A/AA scan (`npx playwright test e2e/accessibility.spec.ts`, axe-core) across the marketing homepage, login, dashboard overview, peer-mentor marketplace, and workflow builder found four real color-contrast defects, all now fixed in `src/app/globals.css`:

| Token | Before | After | Context |
| --- | --- | --- | --- |
| `--color-ink-500` | `#64758a` (4.44–4.46:1 on tinted surfaces) | `#566173` (≥5.1:1) | secondary/muted body text |
| `--color-ink-400` | `#8b98a9` (2.77–2.93:1) | `#5b6b80` (≥5.1:1) | eyebrow/label text |
| `--color-success-600` | `#1a7f4e` (4.44:1 on success-100) | `#0f7a45` (4.79:1) | success badge text |
| `--color-warning-600` | `#b3760a` (3.41:1 on warning-100) | `#8a5c08` (5.20:1) | warning badge text |

All five scanned pages now report zero serious/critical axe violations. Re-run the scan after any token or Badge/Alert change.

Production build (Turbopack, Next 16): total client JS across `.next/static/chunks` is ~876 KB, largest single chunk 224 KB (framework runtime) — no route ships an unusually large bundle. One evidence-based query fix landed this pass: club-event registration created one `ClubConsent` row per linked guardian in a sequential loop; replaced with a single batched `createMany({ skipDuplicates: true })` (`src/lib/clubs/club-service.ts`).

## Known non-critical limitations

- Live external email/SMS and cloud object storage are not bundled.
- Realtime uses SSE/polling rather than a dedicated multi-region gateway.
- Search uses PostgreSQL queries rather than a dedicated full-text cluster.
- The first release is Vietnamese-only and has no native mobile client.
