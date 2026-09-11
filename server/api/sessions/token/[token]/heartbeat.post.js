import { and, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { sessions } from '~~/db/schema/sessions'
import { logSessionEvent } from '~~/server/utils/sessionLifecycle'

const payloadSchema = z.object({
  currentQuestionIndex: z.number().int().min(0).max(100000).nullable(),
  questionId: z.string().max(255).nullable(),
  questionNumber: z.number().int().min(1).max(100000).nullable(),
  instruction: z.boolean(),
  subtest: z.string().max(100),
  visibility: z.enum(['visible', 'hidden']),
  saveState: z.enum(['idle', 'saving', 'saved', 'error']),
})

export default defineEventHandler(async (event) => {
  const parsed = payloadSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: 'Invalid heartbeat' })
  const db = useDB()
  const [session] = await db.select({ id: sessions.id, metadata: sessions.metadata })
    .from(sessions).where(eq(sessions.token, getRouterParam(event, 'token'))).limit(1)
  if (!session) throw createError({ statusCode: 404, message: 'Session not found' })
  const now = new Date()
  const monitoring = { ...parsed.data, receivedAt: now.toISOString() }
  const updated = await db.update(sessions).set({
    metadata: sql`coalesce(${sessions.metadata}, '{}'::jsonb) || ${JSON.stringify({ monitoring })}::jsonb`,
    lastActivity: now,
  }).where(and(eq(sessions.id, session.id), inArray(sessions.status, ['pending', 'in_progress'])))
    .returning({ id: sessions.id })
  if (!updated.length) return { success: false, ended: true }
  const previous = session.metadata?.monitoring
  if (monitoring.questionId && previous?.questionId !== monitoring.questionId) {
    await logSessionEvent(db, session.id, 'question_viewed',
      monitoring.instruction ? 'Membuka petunjuk subtes' : `Membuka soal ${monitoring.questionNumber}`,
      { questionId: monitoring.questionId, questionNumber: monitoring.questionNumber, subtest: monitoring.subtest })
  }
  if (previous?.visibility !== monitoring.visibility && (previous || monitoring.visibility === 'hidden')) {
    await logSessionEvent(db, session.id, 'visibility_changed',
      monitoring.visibility === 'hidden' ? 'Halaman tes tidak terlihat' : 'Peserta kembali ke halaman tes',
      { visibility: monitoring.visibility }, monitoring.visibility === 'hidden' ? 'warning' : 'info')
  }
  if (monitoring.saveState === 'error' && previous?.saveState !== 'error') {
    await logSessionEvent(db, session.id, 'save_failed', 'Perangkat peserta melaporkan gagal menyimpan jawaban', {}, 'warning')
  }
  return { success: true }
})
