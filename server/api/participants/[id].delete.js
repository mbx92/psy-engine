import { participants } from '~~/db/schema/participants'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.PARTICIPANTS_DELETE)

  const id = getRouterParam(event, 'id')
  const db = useDB()

  let deleted
  try {
    ;[deleted] = await db.delete(participants).where(eq(participants.id, id)).returning({ id: participants.id })
  } catch (err) {
    if (err.cause?.code === '23503') {
      throw createError({ statusCode: 400, message: 'Cannot delete participant: existing test sessions reference them' })
    }
    throw err
  }

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Participant not found' })
  }

  return { success: true }
})
