import { participants } from '~~/db/schema/participants'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.PARTICIPANTS_READ)

  const id = getRouterParam(event, 'id')
  const db = useDB()

  const [participant] = await db.select().from(participants).where(eq(participants.id, id)).limit(1)
  if (!participant) {
    throw createError({ statusCode: 404, message: 'Participant not found' })
  }

  return { participant }
})
