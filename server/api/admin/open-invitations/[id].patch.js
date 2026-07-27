import { eq } from 'drizzle-orm'
import { openInvitations } from '~~/db/schema/openInvitations'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_MANAGE)

  const id = getRouterParam(event, 'id')
  const body = await readBody(event) || {}

  if (typeof body.isActive !== 'boolean') {
    throw createError({ statusCode: 400, message: 'isActive (boolean) is required' })
  }

  const db = useDB()
  const [updated] = await db.update(openInvitations)
    .set({ isActive: body.isActive, updatedAt: new Date() })
    .where(eq(openInvitations.id, id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Open invitation not found' })
  }

  return { invitation: updated }
})
