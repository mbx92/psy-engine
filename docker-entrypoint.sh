#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] ERROR: DATABASE_URL is required"
  exit 1
fi

if [ -z "${JWT_SECRET:-}" ] || [ "$JWT_SECRET" = "change-me-in-production-use-long-random-string" ]; then
  echo "[entrypoint] WARNING: set a strong JWT_SECRET for production"
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Running database migrations..."
  node scripts/migrate.mjs
fi

if [ "${SEED_RBAC:-false}" = "true" ]; then
  echo "[entrypoint] Seeding RBAC..."
  node scripts/seed-rbac.mjs
fi

echo "[entrypoint] Starting PsyEngine on ${HOST:-0.0.0.0}:${PORT:-3000}"
exec node .output/server/index.mjs
