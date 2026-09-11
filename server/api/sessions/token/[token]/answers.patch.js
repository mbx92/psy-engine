import { eq, sql } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { logSessionEvent } from '~~/server/utils/sessionLifecycle'
import { publishSessionEvent } from '~~/server/utils/sessionLogBus'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const body = await readBody(event)
  const { answers, metadata } = body || {}

  if (!answers || typeof answers !== 'object') {
    throw createError({ statusCode: 400, message: 'answers object is required' })
  }

  const db = useDB()
  const [session] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1)
  if (!session) {
    throw createError({ statusCode: 404, message: 'Invitation link not found' })
  }
  if (session.status !== 'in_progress') {
    throw createError({ statusCode: 400, message: `Cannot save answers: session is ${session.status}` })
  }

  const prevCount = Object.keys(session.answers || {}).length
  const merged = { ...session.answers, ...answers }
  const answeredCount = Object.keys(merged).length
  const metadataPatch = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? { ...metadata } : {}
  delete metadataPatch.monitoring
  const now = new Date()

  await db.update(sessions).set({
    answers: merged,
    metadata: sql`coalesce(${sessions.metadata}, '{}'::jsonb) || ${JSON.stringify(metadataPatch)}::jsonb`,
    lastActivity: now,
    updatedAt: now,
  }).where(eq(sessions.id, session.id))

  // Live progress for admin SSE (not persisted every keystroke)
  publishSessionEvent(session.id, {
    type: 'progress',
    answeredCount,
    lastActivity: now.toISOString(),
    status: session.status,
    answers: merged,
  })

  // Persist milestone logs so the timeline stays useful after reconnect
  const crossedMilestone = answeredCount !== prevCount && (
    prevCount === 0
    || Math.floor(prevCount / 5) < Math.floor(answeredCount / 5)
  )
  if (crossedMilestone) {
    await logSessionEvent(
      db,
      session.id,
      prevCount === 0 ? 'answer_saved' : 'answer_progress',
      prevCount === 0
        ? 'Participant answers are being auto-saved'
        : `${answeredCount} answers saved`,
      { answeredCount },
    )
  }

  return { success: true, answeredCount }
})
