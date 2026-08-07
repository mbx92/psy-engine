# PsyEngine

Nuxt 3 + PostgreSQL (Drizzle) psychology test platform.

## Setup

```bash
pnpm install
cp .env.example .env
# edit DATABASE_URL + JWT_SECRET
pnpm db:migrate
pnpm db:seed        # RBAC + users + test types
pnpm dev
```

## Production (local)

```bash
pnpm build
pnpm start
```

## Docker

```bash
docker compose up --build
# app: http://localhost:3000
```

## Deploy on Coolify

### Recommended: Dockerfile + Coolify Postgres

1. Create a **PostgreSQL** database resource and copy its connection URL.
2. Create a new **Application** from this Git repo.
3. Set **Build Pack** → `Dockerfile`.
4. Set **Ports Exposes** → `3000`.
5. Environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Coolify Postgres URL (internal hostname) |
| `JWT_SECRET` | long random secret |
| `HOST` | `0.0.0.0` |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `RUN_MIGRATIONS` | `true` (default) |
| `SEED_ON_BOOT` | `true` (default) — seeds users + tests idempotently |

6. Deploy. Entrypoint: migrate → seed → start.
7. Healthcheck: `/api/health`

### Seed accounts (change immediately)

| Email | Password | Role |
|---|---|---|
| `admin@psy.test` | `admin123` | admin |
| `god@psy.test` | `god123` | superadmin |

Seeded tests (if missing): CFIT Scale 2, PAPI Kostick, EPPS.

To re-overwrite test definitions: set `SEED_FORCE_TESTS=true` once, then remove it.
