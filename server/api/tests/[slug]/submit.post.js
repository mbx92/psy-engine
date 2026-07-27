import { sessions } from '~~/db/schema/sessions'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Test slug required' })
  }

  const body = await readBody(event)
  const { answers, sessionToken } = body || {}

  if (!answers || !sessionToken) {
    throw createError({ statusCode: 400, message: 'Answers and session token required' })
  }

  const test = await getTestBySlug(slug)
  if (!test) {
    throw createError({ statusCode: 404, message: 'Test not found' })
  }

  // Find session by token
  const db = useDB()
  const [session] = await db.select().from(sessions).where(eq(sessions.token, sessionToken)).limit(1)
  if (!session) {
    throw createError({ statusCode: 404, message: 'Session not found' })
  }
  if (session.status !== 'in_progress') {
    throw createError({ statusCode: 400, message: `Session is ${session.status}, cannot submit` })
  }

  // Calculate score
  const result = calculateScore(test, answers)

  // Update session
  await db.update(sessions).set({
    answers,
    scores: result,
    status: 'completed',
    completedAt: new Date(),
    lastActivity: new Date(),
  }).where(eq(sessions.id, session.id))

  return {
    success: true,
    result: {
      dimensions: result.dimensions,
      interpretation: result.interpretation,
    },
  }
})
