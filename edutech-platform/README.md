# EduTech Platform

EduTech is a multi-tenant school operations platform built with Next.js, TypeScript, Prisma, PostgreSQL, and Redis. The current foundation includes strict environment validation, identity and tenancy models, a typed authorization registry, database-session and credentials primitives, local file/email adapters, and policy/adapter tests.

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

Seeded users are required to change that password.

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

These credentials are development fixtures only and must not be used in production.

## Database commands

| Command | Purpose |
| --- | --- |
| `npm run db:validate` | Validate the Prisma configuration and schema |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:migrate` | Create or apply migrations during local development |
| `npm run db:migrate:deploy` | Apply committed migrations non-interactively |
| `npm run db:seed` | Upsert deterministic demo schools, users, roles, and parent links |
| `npm run db:studio` | Open Prisma Studio |

Prisma configuration intentionally requires `DATABASE_URL`. Run database commands after creating `.env`, or provide the variable explicitly to the process.

## Quality gates

Run each foundation quality gate with:

```bash
npm run db:validate
npm run lint
npm run typecheck
npm test
npm run build
```

The unit/integration suite covers permission evaluation, tenant isolation, parent/student privacy links, local file-storage containment, and durable email-outbox behavior.

## Verification status

On July 22, 2026, Prisma schema validation, ESLint, TypeScript, all 18 Vitest tests, and the production build passed. Clean-database migration and seed execution could not be run on the verification machine because neither Docker nor a native PostgreSQL client was installed. The schema, initial migration, deterministic seed, and Compose definitions are present; complete that remaining gate in an environment with Docker by running:

```bash
npm run services:up
npm run db:migrate:deploy
npm run db:seed
```

## Architecture documentation

- [`docs/specification.md`](docs/specification.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/data-model.md`](docs/data-model.md)
- [`docs/permissions-matrix.md`](docs/permissions-matrix.md)
- [`tasks/todo.md`](tasks/todo.md)