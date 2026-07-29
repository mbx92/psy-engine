import { eq, and, gte, lte, desc, or, ilike, inArray, sql } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { participants } from '~~/db/schema/participants'
import { testTypes } from '~~/db/schema/testTypes'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { autoAbandonStaleSessions } from '~~/server/utils/sessionLifecycle'
import { parsePagination, paginationMeta } from '~~/server/utils/pagination'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_READ)

  const db = useDB()
  await autoAbandonStaleSessions(db)

  const query = getQuery(event)
  const conditions = []
  const pagination = parsePagination(query)
  const search = (query.search || '').trim()

  if (query.tab === 'active') {
    conditions.push(inArray(sessions.status, ['pending', 'in_progress']))
  } else if (query.tab === 'completed_group') {
    conditions.push(inArray(sessions.status, ['completed', 'verified']))
  } else if (query.tab && query.tab !== 'all' && ['pending', 'in_progress', 'completed', 'verified', 'abandoned'].includes(query.tab)) {
    conditions.push(eq(sessions.status, query.tab))
  } else if (query.status) {
    conditions.push(eq(sessions.status, query.status))
  }

  if (query.testTypeId) conditions.push(eq(sessions.testTypeId, query.testTypeId))
  if (query.participantId) conditions.push(eq(sessions.participantId, query.participantId))
  if (query.dateFrom) conditions.push(gte(sessions.createdAt, new Date(query.dateFrom)))
  if (query.dateTo) conditions.push(lte(sessions.createdAt, new Date(query.dateTo)))

  if (search) {
    conditions.push(or(
      ilike(participants.name, `%${search}%`),
      ilike(testTypes.name, `%${search}%`),
      ilike(testTypes.slug, `%${search}%`),
      ilike(sessions.status, `%${search}%`),
      ilike(sessions.token, `%${search}%`),
    ))
  }

  const whereClause = conditions.length ? and(...conditions) : undefined

  const selectFields = {
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
  }

  if (!pagination) {
    const rows = await db.select(selectFields)
      .from(sessions)
      .innerJoin(testTypes, eq(sessions.testTypeId, testTypes.id))
      .innerJoin(participants, eq(sessions.participantId, participants.id))
      .where(whereClause)
      .orderBy(desc(sessions.createdAt))
    return { sessions: rows }
  }

  const [{ total }] = await db.select({ total: sql`count(*)`.mapWith(Number) })
    .from(sessions)
    .innerJoin(testTypes, eq(sessions.testTypeId, testTypes.id))
    .innerJoin(participants, eq(sessions.participantId, participants.id))
    .where(whereClause)

  const rows = await db.select(selectFields)
    .from(sessions)
    .innerJoin(testTypes, eq(sessions.testTypeId, testTypes.id))
    .innerJoin(participants, eq(sessions.participantId, participants.id))
    .where(whereClause)
    .orderBy(desc(sessions.createdAt))
    .limit(pagination.limit)
    .offset(pagination.offset)

  return {
    sessions: rows,
    pagination: paginationMeta({ page: pagination.page, limit: pagination.limit, total }),
  }
})
