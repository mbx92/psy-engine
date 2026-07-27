import { eq, and, inArray } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { participants } from '~~/db/schema/participants'
import { testTypes } from '~~/db/schema/testTypes'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

function median(nums) {
  if (!nums.length) return null
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_READ)

  const query = getQuery(event)
  if (!query.testTypeId) {
    throw createError({ statusCode: 400, message: 'testTypeId is required' })
  }

  const db = useDB()

  const [testType] = await db.select({ id: testTypes.id, name: testTypes.name })
    .from(testTypes).where(eq(testTypes.id, query.testTypeId)).limit(1)
  if (!testType) {
    throw createError({ statusCode: 404, message: 'Test type not found' })
  }

  const conditions = [
    eq(sessions.testTypeId, query.testTypeId),
    inArray(sessions.status, ['completed', 'verified']),
  ]
  if (query.participantId) conditions.push(eq(sessions.participantId, query.participantId))

  const rows = await db.select({
    id: sessions.id,
    participantId: sessions.participantId,
    participantName: participants.name,
    completedAt: sessions.completedAt,
    scores: sessions.scores,
  })
    .from(sessions)
    .innerJoin(participants, eq(sessions.participantId, participants.id))
    .where(and(...conditions))
    .orderBy(sessions.completedAt)

  const sessionRows = rows.map((r) => ({
    id: r.id,
    participantId: r.participantId,
    participantName: r.participantName,
    completedAt: r.completedAt,
    dimensions: r.scores?.dimensions || {},
  }))

  const dimensionKeys = [...new Set(sessionRows.flatMap((r) => Object.keys(r.dimensions)))]
  const aggregate = {}
  for (const key of dimensionKeys) {
    const values = sessionRows.map((r) => r.dimensions[key]).filter((v) => typeof v === 'number')
    if (!values.length) continue
    aggregate[key] = {
      avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100,
      median: median(values),
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }
  }

  return { testType, sessions: sessionRows, aggregate }
})
