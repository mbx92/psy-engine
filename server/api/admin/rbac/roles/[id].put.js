import { eq } from 'drizzle-orm'
import { roles } from '~~/db/schema/roles'
import { permissions } from '~~/db/schema/permissions'
import { rolePermissions } from '~~/db/schema/rolePermissions'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { validateBody, roleUpdateSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.RBAC_MANAGE)

  const roleId = Number(getRouterParam(event, 'id'))
  if (!roleId) {
    throw createError({ statusCode: 400, message: 'Role ID required' })
  }

  const rawBody = await readBody(event)
  const body = validateBody(roleUpdateSchema, {
    ...rawBody,
    label: rawBody?.label !== undefined ? String(rawBody.label).trim() : undefined,
  })
  const db = useDB()

  const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1)
  if (!role) {
    throw createError({ statusCode: 404, message: 'Role not found' })
  }

  if (body.label !== undefined) {
    await db.update(roles).set({ label: body.label, updatedAt: new Date() }).where(eq(roles.id, roleId))
  }

  if (body.permissionKeys !== undefined) {
    const allPermissions = await db.select().from(permissions)
    const permByKey = new Map(allPermissions.map((p) => [p.key, p]))

    const unknown = body.permissionKeys.filter((key) => !permByKey.has(key))
    if (unknown.length) {
      throw createError({ statusCode: 400, message: `Unknown permission key(s): ${unknown.join(', ')}` })
    }

    await db.transaction(async (tx) => {
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId))
      if (body.permissionKeys.length) {
        await tx.insert(rolePermissions).values(
          body.permissionKeys.map((key) => ({ roleId, permissionId: permByKey.get(key).id })),
        )
      }
    })
  }

  const [updatedRole] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1)
  const grants = await db.select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId))

  return { role: { ...updatedRole, permissionKeys: grants.map((g) => g.key) } }
})
