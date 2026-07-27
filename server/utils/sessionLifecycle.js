import { eq, and, lt } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { sessionLogs } from '~~/db/schema/sessionLogs'
import { publishSessionEvent } from '~~/server/utils/sessionLogBus'

export const AUTO_ABANDON_HOURS = 24

/** Legal session status transitions. Anything not listed here is rejected. */
export const VALID_TRANSITIONS = {
  pending: ['in_progress', 'abandoned'],
  in_progress: ['completed', 'abandoned'],
  completed: ['verified'],
  verified: [],
  abandoned: [],
}

export function canTransition(from, to) {
  return (VALID_TRANSITIONS[from] || []).includes(to)
}

export async function logSessionEvent(db, sessionId, eventType, message, metadata = {}, level = 'info') {
  const [row] = await db.insert(sessionLogs).values({
    sessionId,
    level,
    eventType,
    message,
    metadata,
  }).returning()

  publishSessionEvent(sessionId, { type: 'log', log: row })
  return row
}

/**
 * Lazily auto-abandon sessions that have been `in_progress` with no activity
 * for longer than AUTO_ABANDON_HOURS. Called from read endpoints instead of
 * running a background job — there's no worker/cron infrastructure in this
 * app, so this "check on access" approach (explicitly suggested in PLAN.md)
 * is the pragmatic choice.
 */
export async function autoAbandonStaleSessions(db) {
  const cutoff = new Date(Date.now() - AUTO_ABANDON_HOURS * 60 * 60 * 1000)

  const stale = await db.select({ id: sessions.id }).from(sessions)
    .where(and(eq(sessions.status, 'in_progress'), lt(sessions.lastActivity, cutoff)))

  for (const s of stale) {
    await db.update(sessions).set({ status: 'abandoned', updatedAt: new Date() }).where(eq(sessions.id, s.id))
    await logSessionEvent(db, s.id, 'session_abandoned', `Auto-abandoned after ${AUTO_ABANDON_HOURS}h of inactivity`)
  }

  return stale.length
}
