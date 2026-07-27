import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { testTypes } from '~~/db/schema/testTypes'
import { participants } from '~~/db/schema/participants'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { logSessionEvent } from '~~/server/utils/sessionLifecycle'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_MANAGE)

  const body = await readBody(event)
  const { testTypeId, participantIds } = body || {}

  if (!testTypeId || !Array.isArray(participantIds) || !participantIds.length) {
    throw createError({ statusCode: 400, message: 'testTypeId and a non-empty participantIds array are required' })
  }

  const db = useDB()

  const [testType] = await db.select({ id: testTypes.id, isActive: testTypes.isActive })
    .from(testTypes).where(eq(testTypes.id, testTypeId)).limit(1)
  if (!testType) {
    throw createError({ statusCode: 404, message: 'Test type not found' })
  }
  if (!testType.isActive) {
    throw createError({ statusCode: 400, message: 'Cannot create sessions for an inactive test type' })
  }

  const created = []
  const errors = []

  for (const participantId of participantIds) {
    const [participant] = await db.select({ id: participants.id })
      .from(participants).where(eq(participants.id, participantId)).limit(1)
    if (!participant) {
      errors.push({ participantId, reason: 'Participant not found' })
      continue
    }

    const token = randomUUID()
    const [session] = await db.insert(sessions).values({
      testTypeId,
      participantId,
      token,
      status: 'pending',
    }).returning()

    await logSessionEvent(db, session.id, 'session_created', 'Session created and invitation token issued (bulk)')

    created.push({ sessionId: session.id, participantId, token, invitationPath: `/take/${token}` })
  }

  return { created, errors }
})
