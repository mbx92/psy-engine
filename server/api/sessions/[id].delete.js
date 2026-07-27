import { eq } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_MANAGE)

  const id = getRouterParam(event, 'id')
  const db = useDB()

  const [session] = await db.select({ id: sessions.id, status: sessions.status }).from(sessions).where(eq(sessions.id, id)).limit(1)
  if (!session) {
    throw createError({ statusCode: 404, message: 'Session not found' })
  }
  if (session.status !== 'pending') {
    throw createError({ statusCode: 400, message: `Can only delete sessions that are still pending (this one is ${session.status})` })
  }

  await db.delete(sessions).where(eq(sessions.id, id))

  return { success: true }
})
