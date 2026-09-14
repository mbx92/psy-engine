import { participantTest } from '~~/server/utils/participantTest'
import { eq } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { participants } from '~~/db/schema/participants'
import { testTypes } from '~~/db/schema/testTypes'
import { autoAbandonStaleSessions } from '~~/server/utils/sessionLifecycle'
import { getBatteryProgress } from '~~/server/utils/battery'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const db = useDB()
  await autoAbandonStaleSessions(db)

  const [row] = await db.select({
    id: sessions.id,
    token: sessions.token,
    status: sessions.status,
    answers: sessions.answers,
    scores: sessions.scores,
    interpretation: sessions.interpretation,
    metadata: sessions.metadata,
    startedAt: sessions.startedAt,
    completedAt: sessions.completedAt,
    participantName: participants.name,
    participantGender: participants.gender,
    participantBirthDate: participants.birthDate,
    testType: {
      name: testTypes.name,
      slug: testTypes.slug,
      description: testTypes.description,
      config: testTypes.config,
      questions: testTypes.questions,
      scoringConfig: testTypes.scoringConfig,
    },
  })
    .from(sessions)
    .innerJoin(participants, eq(sessions.participantId, participants.id))
    .innerJoin(testTypes, eq(sessions.testTypeId, testTypes.id))
    .where(eq(sessions.token, token))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, message: 'Invitation link not found' })
  }

  const battery = await getBatteryProgress(db, row)

  const timing = row.metadata?.timing
  const subtestTimers = Object.fromEntries(Object.entries(timing?.subtests || {}).map(([key, value]) => [key, value.closedAt ? 0 : Math.max(0, Math.ceil((Date.parse(value.deadlineAt) - Date.now()) / 1000))]))
  const safeRow = {
    ...row, testType: participantTest(row.testType),
    scores: { status: row.scores?.status || (row.completedAt ? 'scored' : 'pending') }, interpretation: {},
    metadata: { currentQuestionIndex: row.metadata?.currentQuestionIndex, currentSubtest: timing?.activeSubtest, subtestTimers, timing },
  }
  delete safeRow.token
  return { session: safeRow, battery, serverTime: new Date().toISOString() }
})
