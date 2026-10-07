import { eq } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { initialTiming } from '~~/server/utils/testIntegrity'
import { logSessionEvent } from '~~/server/utils/sessionLifecycle'
export default defineEventHandler(async event => {
  const token = getRouterParam(event, 'token')
  return useDB().transaction(async tx => {
    const [session] = await tx.select().from(sessions).where(eq(sessions.token, token)).limit(1).for('update')
    if (!session) throw createError({ statusCode: 404, message: 'Invitation link not found' })
    if (session.status !== 'pending') throw createError({ statusCode: 409, message: 'Session has already started or ended' })
    const test = await getTestById(session.testTypeId)
    if (!test) throw createError({ statusCode: 404, message: 'Test not found' })
    const now = new Date()
    const [updated] = await tx.update(sessions).set({ status: 'in_progress', startedAt: now, lastActivity: now, updatedAt: now, metadata: { ...session.metadata, timing: initialTiming(test, now.getTime()) } }).where(eq(sessions.id, session.id)).returning()
    await logSessionEvent(tx, session.id, 'test_started', 'Participant started the test')
    return { session: { id: updated.id, status: updated.status, startedAt: updated.startedAt }, timing: updated.metadata.timing, serverTime: now.toISOString() }
  })
})
