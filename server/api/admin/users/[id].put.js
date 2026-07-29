import { users } from '~~/db/schema/users'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { validateBody, userUpdateSchema } from '~~/server/utils/validation'
import { isSuperadminRole } from '~~/server/utils/systemFlags'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.USERS_UPDATE)

  const targetId = Number(getRouterParam(event, 'id'))
  if (!targetId) {
    throw createError({ statusCode: 400, message: 'User ID required' })
  }

  const { userId: currentUserId, role: currentRole } = event.context.auth

  if (targetId === currentUserId) {
    throw createError({ statusCode: 400, message: 'Cannot modify your own account here' })
  }

  const body = validateBody(userUpdateSchema, await readBody(event))
  const db = useDB()

  const [target] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, targetId)).limit(1)
  if (!target) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  if (!isSuperadminRole(currentRole)) {
    if (body.role === 'superadmin' || target.role === 'superadmin') {
      throw createError({ statusCode: 403, message: 'Only superadmin can modify superadmin accounts' })
    }
  }

  const updateData = {}
  if (body.role) updateData.role = body.role
  if (body.isActive !== undefined) updateData.isActive = body.isActive
  updateData.updatedAt = new Date()

  const [updated] = await db.update(users)
    .set(updateData)
    .where(eq(users.id, targetId))
    .returning({ id: users.id, email: users.email, name: users.name, role: users.role, isActive: users.isActive })

  if (!updated) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  return { user: updated }
})
