import { eq, asc } from 'drizzle-orm'
import { sessionLogs } from '~~/db/schema/sessionLogs'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_READ)

  const id = getRouterParam(event, 'id')
  const db = useDB()

  const logs = await db.select().from(sessionLogs)
    .where(eq(sessionLogs.sessionId, id))
    .orderBy(asc(sessionLogs.createdAt))

  return { logs }
})
