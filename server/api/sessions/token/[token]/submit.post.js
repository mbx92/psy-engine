import { eq } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { participants } from '~~/db/schema/participants'
import { testTypeNorms } from '~~/db/schema/testTypeNorms'
import { getTestById } from '~~/server/utils/tests'
import { calculateScore } from '~~/server/utils/scoring'
import { logSessionEvent } from '~~/server/utils/sessionLifecycle'
import { publishSessionEvent } from '~~/server/utils/sessionLogBus'
import { getBatteryProgress } from '~~/server/utils/battery'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const body = await readBody(event)
  const { answers } = body || {}

  if (!answers) {
    throw createError({ statusCode: 400, message: 'answers are required' })
  }

  const db = useDB()
  const [session] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1)
  if (!session) {
    throw createError({ statusCode: 404, message: 'Invitation link not found' })
  }
  if (session.status !== 'in_progress') {
    throw createError({ statusCode: 400, message: `Cannot submit: session is ${session.status}` })
  }

  const test = await getTestById(session.testTypeId)
  if (!test) {
    throw createError({ statusCode: 404, message: 'Test type not found' })
  }

  const [participant] = await db.select({
    birthDate: participants.birthDate,
    gender: participants.gender,
  })
    .from(participants).where(eq(participants.id, session.participantId)).limit(1)

  const [norm] = await db.select({ data: testTypeNorms.data })
    .from(testTypeNorms)
    .where(eq(testTypeNorms.testTypeId, session.testTypeId))
    .limit(1)

  const finalAnswers = { ...session.answers, ...answers }
  let result
  try {
    result = calculateScore(test, finalAnswers, {
      birthDate: participant?.birthDate,
      gender: participant?.gender,
      norms: norm?.data || null,
    })
  } catch (err) {
    result = {
      raw: { error: err.message },
      dimensions: {},
      interpretation: {},
    }
    await logSessionEvent(db, session.id, 'scoring_failed', `Scoring failed: ${err.message}`)
  }

  const now = new Date()
  const [updated] = await db.update(sessions).set({
    answers: finalAnswers,
    scores: result,
    interpretation: result.interpretation || {},
    status: 'completed',
    completedAt: now,
    lastActivity: now,
    updatedAt: now,
  }).where(eq(sessions.id, session.id)).returning()

  await logSessionEvent(db, session.id, 'test_completed', 'Participant submitted the test')
  publishSessionEvent(session.id, {
    type: 'progress',
    answeredCount: Object.keys(finalAnswers).length,
    lastActivity: now.toISOString(),
    status: 'completed',
    answers: finalAnswers,
  })

  const battery = await getBatteryProgress(db, updated || { ...session, status: 'completed', metadata: session.metadata })

  return {
    success: true,
    result: {
      dimensions: result.dimensions,
      interpretation: result.interpretation,
    },
    battery,
    nextTakePath: battery?.nextTakePath || null,
  }
})
