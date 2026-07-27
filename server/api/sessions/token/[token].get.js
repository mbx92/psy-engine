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

  return {
    session: row,
    battery,
  }
})
