/**
 * Public liveness probe for Coolify / Docker healthchecks.
 * Intentionally does not touch the database.
 */
export default defineEventHandler(() => ({
  ok: true,
  service: 'psy-engine',
  ts: Date.now(),
}))
