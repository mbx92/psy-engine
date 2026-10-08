import { and, eq, inArray } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { logSessionEvent } from '~~/server/utils/sessionLifecycle'
import { publishSessionEvent } from '~~/server/utils/sessionLogBus'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_MANAGE)

  const id = getRouterParam(event, 'id')
  const db = useDB()
  const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1)
  if (!session) throw createError({ statusCode: 404, message: 'Session not found' })
  if (!['pending', 'in_progress'].includes(session.status)) {
    throw createError({ statusCode: 400, message: `Hanya sesi pending atau in progress yang bisa dihentikan (status sekarang: ${session.status})` })
  }

  const [updated] = await db.update(sessions)
    .set({ status: 'abandoned', updatedAt: new Date() })
    .where(and(eq(sessions.id, id), inArray(sessions.status, ['pending', 'in_progress'])))
    .returning()

  if (!updated) throw createError({ statusCode: 409, message: 'Sesi sudah berubah status. Muat ulang halaman.' })

  try {
    await logSessionEvent(db, id, 'session_abandoned', `Session terminated by admin (was ${session.status})`)
    publishSessionEvent(id, {
      type: 'progress',
      status: 'abandoned',
      answeredCount: Object.keys(updated.answers || {}).length,
      lastActivity: updated.lastActivity,
    })
  } catch { /* status already saved */ }

  return { session: updated }
})
