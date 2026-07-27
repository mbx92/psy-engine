import { permissions } from '~~/db/schema/permissions'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.RBAC_MANAGE)

  const db = useDB()
  const allPermissions = await db.select().from(permissions).orderBy(permissions.resource, permissions.action)

  return { permissions: allPermissions }
})
