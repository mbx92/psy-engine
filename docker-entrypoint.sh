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

# Idempotent bootstrap (safe on every restart). Disable with SEED_ON_BOOT=false
if [ "${SEED_ON_BOOT:-true}" = "true" ]; then
  echo "[entrypoint] Seeding RBAC + users..."
  node scripts/seed-rbac.mjs
  echo "[entrypoint] Seeding test types..."
  node seed/index.js
elif [ "${SEED_RBAC:-false}" = "true" ]; then
  echo "[entrypoint] Seeding RBAC + users..."
  node scripts/seed-rbac.mjs
fi

if [ "${SEED_ON_BOOT:-true}" != "true" ] && [ "${SEED_TESTS:-false}" = "true" ]; then
  echo "[entrypoint] Seeding test types..."
  node seed/index.js
fi

echo "[entrypoint] Starting PsyEngine on ${HOST:-0.0.0.0}:${PORT:-3000}"
exec node .output/server/index.mjs
