# PsyEngine

Nuxt 3 + PostgreSQL (Drizzle) psychology test platform.

## Setup

```bash
pnpm install
cp .env.example .env
# edit DATABASE_URL + JWT_SECRET
pnpm db:migrate
pnpm db:seed-rbac   # optional: roles + god@psy.test / god123
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

1. In Coolify, create a **PostgreSQL** database resource and copy its connection URL.
2. Create a new **Application** from this Git repo.
3. Set **Build Pack** → `Dockerfile` (uses root `Dockerfile`).
4. Set **Ports Exposes** → `3000`.
5. Add environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Coolify Postgres URL (use internal hostname) |
| `JWT_SECRET` | long random secret |
| `HOST` | `0.0.0.0` |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `RUN_MIGRATIONS` | `true` (default) |
| `SEED_RBAC` | `true` once on first deploy, then set back to `false` |

6. Deploy. The entrypoint runs migrations, then starts Nitro.
7. Healthcheck path: `/api/health`

### Alternative: Docker Compose

Use Coolify **Docker Compose** resource with `docker-compose.yml`. Set `JWT_SECRET`, `POSTGRES_PASSWORD`, and optionally `SEED_RBAC=true` for first boot.

### Alternative: Nixpacks

Build Pack → Nixpacks. Start command: `node .output/server/index.mjs`. Still set `DATABASE_URL` + `JWT_SECRET`. Run migrations once via Coolify execute command: `node scripts/migrate.mjs` (needs source + deps available), or prefer the Dockerfile path which migrates automatically.

## Default seed admin

After `SEED_RBAC=true`:

- Email: `god@psy.test`
- Password: `god123`

Change this immediately in production.
