import { eq } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { mergeTimedAnswers, progressMetadata } from '~~/server/utils/testIntegrity'
import { logSessionEvent } from '~~/server/utils/sessionLifecycle'
import { publishSessionEvent } from '~~/server/utils/sessionLogBus'
export default defineEventHandler(async event => {
  const token = getRouterParam(event, 'token')
  const { answers, metadata } = await readBody(event) || {}
  const result = await useDB().transaction(async tx => {
    const [session] = await tx.select().from(sessions).where(eq(sessions.token, token)).limit(1).for('update')
    if (!session) throw createError({ statusCode: 404, message: 'Invitation link not found' })
    if (session.status !== 'in_progress') throw createError({ statusCode: 409, message: 'Session is not in progress' })
    const test = await getTestById(session.testTypeId)
    const merged = mergeTimedAnswers(test, session, answers).answers
    const answeredCount = Object.keys(merged).length
    const previousCount = Object.keys(session.answers || {}).length
    const now = new Date()
    await tx.update(sessions).set({ answers: merged, metadata: { ...session.metadata, ...progressMetadata(test, metadata) }, lastActivity: now, updatedAt: now }).where(eq(sessions.id, session.id))
    if (answeredCount !== previousCount && (previousCount === 0 || Math.floor(answeredCount / 5) > Math.floor(previousCount / 5))) await logSessionEvent(tx, session.id, 'answer_progress', answeredCount + ' answers saved', { answeredCount })
    return { id: session.id, answers: merged, answeredCount, lastActivity: now.toISOString() }
  })
  publishSessionEvent(result.id, { type: 'progress', ...result, status: 'in_progress' })
  return { success: true, answeredCount: result.answeredCount }
})
