import { eq, or, inArray, gte, desc, sql } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { participants } from '~~/db/schema/participants'
import { testTypes } from '~~/db/schema/testTypes'
import { sessionLogs } from '~~/db/schema/sessionLogs'
import { requirePermission } from '~~/server/utils/access'
import { PERMISSIONS } from '~~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_READ)
  setHeader(event, 'Cache-Control', 'no-store')
  const db = useDB()
  const cutoff = new Date(Date.now() - 86400000)
  // All active sessions plus recently finished sessions; no tokens, answers, or scoring keys leave this endpoint.
  const scope = or(inArray(sessions.status, ['pending', 'in_progress']), gte(sessions.updatedAt, cutoff))
  const rows = await db.select({
    id: sessions.id, status: sessions.status, participantName: participants.name,
    testTypeName: testTypes.name, testTypeId: sessions.testTypeId,
    startedAt: sessions.startedAt, completedAt: sessions.completedAt, lastActivity: sessions.lastActivity,
    monitoring: sql`${sessions.metadata}->'monitoring'`,
    answeredCount: sql`(select count(*)::int from jsonb_object_keys(coalesce(${sessions.answers}, '{}'::jsonb)))`,
    totalQuestions: sql`(select count(*)::int from jsonb_array_elements(${testTypes.questions}) q where q->>'type' is distinct from 'instruction')`,
  }).from(sessions)
    .innerJoin(participants, eq(sessions.participantId, participants.id))
    .innerJoin(testTypes, eq(sessions.testTypeId, testTypes.id))
    .where(scope).orderBy(desc(sessions.createdAt))
  const logs = await db.select({
    id: sessionLogs.id, sessionId: sessionLogs.sessionId, level: sessionLogs.level,
    message: sessionLogs.message, eventType: sessionLogs.eventType, createdAt: sessionLogs.createdAt,
    participantName: participants.name,
  }).from(sessionLogs)
    .innerJoin(sessions, eq(sessionLogs.sessionId, sessions.id))
    .innerJoin(participants, eq(sessions.participantId, participants.id))
    .where(gte(sessionLogs.createdAt, cutoff)).orderBy(desc(sessionLogs.createdAt), desc(sessionLogs.id)).limit(60)
  return { sessions: rows, logs, serverTime: new Date().toISOString() }
})
