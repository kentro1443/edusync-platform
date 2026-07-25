# Release checklist

## Data and configuration

- [ ] Production secrets are unique and stored outside the repository.
- [ ] PostgreSQL and persistent file storage have encrypted backups.
- [ ] `npm run db:migrate:deploy` succeeds against a clean database.
- [ ] Seed is used only in demo/staging environments.
- [ ] Outbox and retention schedules are installed.

## Verification

- [ ] `npm run verify` passes from a clean checkout.
- [ ] Desktop and mobile critical paths pass.
- [ ] Tenant, parent privacy, role, concurrency, upload, and outbox matrices pass.
- [ ] Browser console/network are clean on happy paths.
- [ ] Accessibility and production performance audits meet the recorded thresholds.
- [ ] Dependency and secret scans have no unresolved critical/high finding.

## Operational acceptance

- [ ] `/api/health` and `/api/readiness` are monitored separately.
- [ ] Backup restore drill passes with matching file storage.
- [ ] Structured logs reach the chosen log system.
- [ ] Rollback owner and recovery window are recorded.
- [ ] Known limitations are accepted by the release owner.
