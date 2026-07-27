import { eq } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { logSessionEvent } from '~~/server/utils/sessionLifecycle'
import { publishSessionEvent } from '~~/server/utils/sessionLogBus'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const db = useDB()

  const [session] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1)
  if (!session) {
    throw createError({ statusCode: 404, message: 'Invitation link not found' })
  }
  if (session.status !== 'pending') {
    throw createError({ statusCode: 400, message: `Cannot start: session is ${session.status}` })
  }

  const now = new Date()
  const [updated] = await db.update(sessions).set({
    status: 'in_progress',
    startedAt: now,
    lastActivity: now,
    updatedAt: now,
  }).where(eq(sessions.id, session.id)).returning()

  await logSessionEvent(db, session.id, 'test_started', 'Participant started the test')
  publishSessionEvent(session.id, {
    type: 'progress',
    answeredCount: Object.keys(session.answers || {}).length,
    lastActivity: now.toISOString(),
    status: 'in_progress',
  })

  return { session: { id: updated.id, status: updated.status, startedAt: updated.startedAt } }
})
