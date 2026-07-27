import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { testTypes } from '~~/db/schema/testTypes'
import { participants } from '~~/db/schema/participants'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { logSessionEvent } from '~~/server/utils/sessionLifecycle'
import { validateBody, sessionCreateSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_MANAGE)

  const body = await readBody(event)
  const { testTypeId, participantId } = validateBody(sessionCreateSchema, body)

  const db = useDB()

  const [testType] = await db.select({ id: testTypes.id, isActive: testTypes.isActive })
    .from(testTypes).where(eq(testTypes.id, testTypeId)).limit(1)
  if (!testType) {
    throw createError({ statusCode: 404, message: 'Test type not found' })
  }
  if (!testType.isActive) {
    throw createError({ statusCode: 400, message: 'Cannot create a session for an inactive test type' })
  }

  const [participant] = await db.select({ id: participants.id })
    .from(participants).where(eq(participants.id, participantId)).limit(1)
  if (!participant) {
    throw createError({ statusCode: 404, message: 'Participant not found' })
  }

  const token = randomUUID()

  const [session] = await db.insert(sessions).values({
    testTypeId,
    participantId,
    token,
    status: 'pending',
  }).returning()

  await logSessionEvent(db, session.id, 'session_created', 'Session created and invitation token issued')

  return { session, invitationPath: `/take/${token}` }
})
