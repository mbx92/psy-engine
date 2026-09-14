import { eq, and } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { participants } from '~~/db/schema/participants'
import { testTypeNorms } from '~~/db/schema/testTypeNorms'
import { calculateScore } from '~~/server/utils/scoring'
import { mergeTimedAnswers } from '~~/server/utils/testIntegrity'
import { logSessionEvent } from '~~/server/utils/sessionLifecycle'
import { publishSessionEvent } from '~~/server/utils/sessionLogBus'
import { getBatteryProgress } from '~~/server/utils/battery'
export default defineEventHandler(async event => {
  const token = getRouterParam(event, 'token')
  const { answers } = await readBody(event) || {}
  const db = useDB()
  const outcome = await db.transaction(async tx => {
    const [session] = await tx.select().from(sessions).where(eq(sessions.token, token)).limit(1).for('update')
    if (!session) throw createError({ statusCode: 404, message: 'Invitation link not found' })
    // Retried submissions cannot overwrite a completed result.
    if (['completed','verified'].includes(session.status)) return { session, discarded: [] }
    if (session.status !== 'in_progress') throw createError({ statusCode: 409, message: 'Session is not in progress' })
    const test = await getTestById(session.testTypeId)
    if (!test) throw createError({ statusCode: 404, message: 'Test type not found' })
    const now = new Date()
    const final = mergeTimedAnswers(test, session, answers, { now: now.getTime(), finalize: true })
    const [participant] = await tx.select().from(participants).where(eq(participants.id, session.participantId)).limit(1)
    const [norm] = await tx.select().from(testTypeNorms).where(and(eq(testTypeNorms.testTypeId, session.testTypeId), test.scoringConfig?.algorithm === 'raw_to_iq' ? eq(testTypeNorms.code, 'cfit_iq') : undefined)).limit(1)
    let result
    try {
      result = { ...calculateScore(test, final.answers, { birthDate: participant?.birthDate, gender: participant?.gender, norms: norm?.data || null, assessmentDate: session.startedAt }), status: 'scored' }
    } catch (err) {
      result = { status: 'failed', raw: { error: err.message }, dimensions: {}, interpretation: {} }
      await logSessionEvent(tx, session.id, 'scoring_failed', 'Scoring failed: ' + err.message)
    }
    const [updated] = await tx.update(sessions).set({ answers: final.answers, scores: result, interpretation: result.interpretation || {}, status: 'completed', completedAt: now, lastActivity: now, updatedAt: now }).where(eq(sessions.id, session.id)).returning()
    await logSessionEvent(tx, session.id, 'test_completed', result.status === 'failed' ? 'Answers received; scoring requires administrator review' : 'Participant submitted the test')
    return { session: updated, discarded: final.discarded }
  })
  const session = outcome.session
  publishSessionEvent(session.id, { type: 'progress', status: session.status, answeredCount: Object.keys(session.answers || {}).length })
  const battery = await getBatteryProgress(db, session)
  const scoringStatus = session.scores?.status || 'scored'
  return { success: scoringStatus !== 'failed', answersSaved: true, scoringStatus, discardedLateAnswerCount: outcome.discarded.length, battery, nextTakePath: battery?.nextTakePath || null }
})
