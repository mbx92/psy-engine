import { hasUsableScores } from '~~/server/utils/testIntegrity'
import { eq } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { canTransition, logSessionEvent } from '~~/server/utils/sessionLifecycle'
import { publishSessionEvent } from '~~/server/utils/sessionLogBus'
import { validateBody, sessionStatusPatchSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_MANAGE)

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { status, notes } = validateBody(sessionStatusPatchSchema, body)

  const db = useDB()
  const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1)
  if (!session) {
    throw createError({ statusCode: 404, message: 'Session not found' })
  }

  if (!canTransition(session.status, status)) {
    throw createError({ statusCode: 400, message: `Cannot transition session from ${session.status} to ${status}` })
  }

  const updateData = { status, updatedAt: new Date() }
  if (status === 'verified' && !hasUsableScores(session)) throw createError({ statusCode: 409, message: 'Scoring must succeed before verification' })
  if (status === 'completed') throw createError({ statusCode: 400, message: 'Complete the test through the submit endpoint so answers are scored' })
  if (status === 'verified') {
    updateData.verifiedAt = new Date()
    updateData.verifiedBy = event.context.auth.userId
    if (notes) updateData.verifiedNotes = notes
  }

  const [updated] = await db.update(sessions).set(updateData).where(eq(sessions.id, id)).returning()

  const eventType = status === 'verified' ? 'session_verified' : status === 'abandoned' ? 'session_abandoned' : `session_${status}`
  const message = status === 'abandoned'
    ? `Session terminated by admin (was ${session.status})`
    : `Status changed from ${session.status} to ${status} by admin`
  await logSessionEvent(db, id, eventType, message, notes ? { notes } : {})
  publishSessionEvent(id, {
    type: 'progress',
    status,
    answeredCount: Object.keys(updated.answers || {}).length,
    lastActivity: updated.lastActivity,
  })

  return { session: updated }
})
