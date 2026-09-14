import { eq, and } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { participants } from '~~/db/schema/participants'
import { testTypeNorms } from '~~/db/schema/testTypeNorms'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { getTestById } from '~~/server/utils/tests'
import { calculateScore } from '~~/server/utils/scoring'
import { logSessionEvent } from '~~/server/utils/sessionLifecycle'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_MANAGE)

  const id = getRouterParam(event, 'id')
  const db = useDB()

  const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1)
  if (!session) {
    throw createError({ statusCode: 404, message: 'Session not found' })
  }
  if (!['completed', 'verified'].includes(session.status)) {
    throw createError({ statusCode: 400, message: 'Can only re-score completed or verified sessions' })
  }
  if (!session.answers) {
    throw createError({ statusCode: 400, message: 'Session has no answers to score' })
  }

  const test = await getTestById(session.testTypeId)
  if (!test) {
    throw createError({ statusCode: 404, message: 'Test type not found' })
  }

  const [participant] = await db.select({
    birthDate: participants.birthDate,
    gender: participants.gender,
  })
    .from(participants)
    .where(eq(participants.id, session.participantId))
    .limit(1)

  const [norm] = await db.select({ data: testTypeNorms.data })
    .from(testTypeNorms)
    .where(and(eq(testTypeNorms.testTypeId, session.testTypeId), test.scoringConfig?.algorithm === 'raw_to_iq' ? eq(testTypeNorms.code, 'cfit_iq') : undefined))
    .limit(1)

  let result
  try {
    result = calculateScore(test, session.answers, {
      birthDate: participant?.birthDate,
      gender: participant?.gender,
      norms: norm?.data || null,
      assessmentDate: session.startedAt,
    })
  } catch (err) {
    throw createError({ statusCode: 500, message: `Scoring failed: ${err.message}` })
  }

  const now = new Date()
  const [updated] = await db.update(sessions).set({
    scores: { ...result, status: 'scored' },
    interpretation: result.interpretation || {},
    updatedAt: now,
  }).where(eq(sessions.id, id)).returning()

  await logSessionEvent(db, id, 'session_rescored', 'Scores recalculated by admin')

  return {
    success: true,
    session: updated,
    result: {
      dimensions: result.dimensions,
      interpretation: result.interpretation,
    },
  }
})
