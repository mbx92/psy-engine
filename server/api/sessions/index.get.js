import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { participants } from '~~/db/schema/participants'
import { testTypes } from '~~/db/schema/testTypes'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { autoAbandonStaleSessions } from '~~/server/utils/sessionLifecycle'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_READ)

  const db = useDB()
  await autoAbandonStaleSessions(db)

  const query = getQuery(event)
  const conditions = []

  if (query.status) conditions.push(eq(sessions.status, query.status))
  if (query.testTypeId) conditions.push(eq(sessions.testTypeId, query.testTypeId))
  if (query.participantId) conditions.push(eq(sessions.participantId, query.participantId))
  if (query.dateFrom) conditions.push(gte(sessions.createdAt, new Date(query.dateFrom)))
  if (query.dateTo) conditions.push(lte(sessions.createdAt, new Date(query.dateTo)))

  const rows = await db.select({
    id: sessions.id,
    status: sessions.status,
    token: sessions.token,
    createdAt: sessions.createdAt,
    startedAt: sessions.startedAt,
    completedAt: sessions.completedAt,
    verifiedAt: sessions.verifiedAt,
    lastActivity: sessions.lastActivity,
    testTypeId: sessions.testTypeId,
    testTypeName: testTypes.name,
    testTypeSlug: testTypes.slug,
    participantId: sessions.participantId,
    participantName: participants.name,
    scores: sessions.scores,
  })
    .from(sessions)
    .innerJoin(testTypes, eq(sessions.testTypeId, testTypes.id))
    .innerJoin(participants, eq(sessions.participantId, participants.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(sessions.createdAt))

  return { sessions: rows }
})
