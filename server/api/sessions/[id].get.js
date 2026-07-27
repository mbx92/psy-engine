import { eq } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { participants } from '~~/db/schema/participants'
import { testTypes } from '~~/db/schema/testTypes'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { autoAbandonStaleSessions } from '~~/server/utils/sessionLifecycle'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_READ)

  const id = getRouterParam(event, 'id')
  const db = useDB()
  await autoAbandonStaleSessions(db)

  const [row] = await db.select({
    id: sessions.id,
    status: sessions.status,
    token: sessions.token,
    answers: sessions.answers,
    scores: sessions.scores,
    interpretation: sessions.interpretation,
    verifiedNotes: sessions.verifiedNotes,
    createdAt: sessions.createdAt,
    startedAt: sessions.startedAt,
    completedAt: sessions.completedAt,
    verifiedAt: sessions.verifiedAt,
    verifiedBy: sessions.verifiedBy,
    lastActivity: sessions.lastActivity,
    testType: {
      id: testTypes.id,
      name: testTypes.name,
      slug: testTypes.slug,
      type: testTypes.type,
      questions: testTypes.questions,
      scoringConfig: testTypes.scoringConfig,
    },
    participant: {
      id: participants.id,
      name: participants.name,
      email: participants.email,
      phone: participants.phone,
      birthDate: participants.birthDate,
      gender: participants.gender,
    },
  })
    .from(sessions)
    .innerJoin(testTypes, eq(sessions.testTypeId, testTypes.id))
    .innerJoin(participants, eq(sessions.participantId, participants.id))
    .where(eq(sessions.id, id))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, message: 'Session not found' })
  }

  return { session: row }
})
