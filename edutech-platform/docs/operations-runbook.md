# EduTech operations runbook

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
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" > edutech.dump
```

Back up `FILE_STORAGE_ROOT` in the same operational window. Database file metadata and stored bytes must be restored as a matched pair. `EMAIL_OUTBOX_ROOT` is useful for local delivery evidence but is not the source of truth.

Encrypt backups, restrict access, record checksums, and test restore regularly.

## Restore drill

Restore into a new empty database, never over the live database:

```bash
createdb edutech_restore
pg_restore --clean --if-exists --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" edutech.dump
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

## Known non-critical limitations

- Live external email/SMS and cloud object storage are not bundled.
- Realtime uses SSE/polling rather than a dedicated multi-region gateway.
- Search uses PostgreSQL queries rather than a dedicated full-text cluster.
- The first release is Vietnamese-only and has no native mobile client.
