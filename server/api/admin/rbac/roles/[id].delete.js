import { eq, sql } from 'drizzle-orm'
import { roles } from '~~/db/schema/roles'
import { users } from '~~/db/schema/users'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.RBAC_MANAGE)

  const roleId = Number(getRouterParam(event, 'id'))
  if (!roleId) {
    throw createError({ statusCode: 400, message: 'Role ID required' })
  }

  const db = useDB()

  const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1)
  if (!role) {
    throw createError({ statusCode: 404, message: 'Role not found' })
  }

  if (role.isSystem) {
    throw createError({ statusCode: 400, message: 'Cannot delete a built-in system role' })
  }

  const [{ count }] = await db.select({ count: sql`count(*)`.mapWith(Number) })
    .from(users).where(eq(users.role, role.name))

  if (count > 0) {
    throw createError({ statusCode: 400, message: `Cannot delete role: ${count} user(s) still assigned to it` })
  }

  await db.delete(roles).where(eq(roles.id, roleId))

  return { success: true }
})
