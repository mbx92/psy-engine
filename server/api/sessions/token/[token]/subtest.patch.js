import { eq } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { advanceSubtest, initialTiming } from '~~/server/utils/testIntegrity'
export default defineEventHandler(async event => {
  const { code } = await readBody(event) || {}
  const token = getRouterParam(event, 'token')
  return useDB().transaction(async tx => {
    const [session] = await tx.select().from(sessions).where(eq(sessions.token, token)).limit(1).for('update')
    if (!session) throw createError({ statusCode: 404, message: 'Invitation link not found' })
    if (session.status !== 'in_progress') throw createError({ statusCode: 409, message: 'Session is not in progress' })
    const test = await getTestById(session.testTypeId)
    const now = new Date()
    const timing = advanceSubtest(test, session.metadata?.timing || initialTiming(test, new Date(session.startedAt).getTime()), code, now.getTime())
    await tx.update(sessions).set({ metadata: { ...session.metadata, timing }, updatedAt: now, lastActivity: now }).where(eq(sessions.id, session.id))
    return { timing, serverTime: now.toISOString() }
  })
})
