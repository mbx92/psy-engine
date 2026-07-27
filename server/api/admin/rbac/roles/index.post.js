import { eq } from 'drizzle-orm'
import { roles } from '~~/db/schema/roles'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { validateBody, roleCreateSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.RBAC_MANAGE)

  const rawBody = await readBody(event)
  const { name, label } = validateBody(roleCreateSchema, {
    name: (rawBody?.name || '').trim().toLowerCase(),
    label: (rawBody?.label || '').trim(),
  })

  const db = useDB()

  const existing = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, name)).limit(1)
  if (existing.length) {
    throw createError({ statusCode: 409, message: 'A role with this name already exists' })
  }

  const [role] = await db.insert(roles).values({ name, label, isSystem: false }).returning()

  return { role: { ...role, permissionKeys: [], userCount: 0 } }
})
