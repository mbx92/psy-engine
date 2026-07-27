import { eq, sql } from 'drizzle-orm'
import { roles } from '~~/db/schema/roles'
import { permissions } from '~~/db/schema/permissions'
import { rolePermissions } from '~~/db/schema/rolePermissions'
import { users } from '~~/db/schema/users'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requireAnyPermission } from '~~/server/utils/access'

export default defineEventHandler(async (event) => {
  // Read access is shared with user management (populates role pickers there);
  // editing role permissions is still gated to RBAC_MANAGE on the write endpoints.
  await requireAnyPermission(event, [PERMISSIONS.USERS_READ, PERMISSIONS.RBAC_MANAGE])

  const db = useDB()

  const [allRoles, allGrants, userCounts] = await Promise.all([
    db.select().from(roles).orderBy(roles.id),
    db.select({ roleId: rolePermissions.roleId, key: permissions.key })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id)),
    db.select({ role: users.role, count: sql`count(*)`.mapWith(Number) })
      .from(users)
      .groupBy(users.role),
  ])

  const grantsByRole = new Map()
  for (const g of allGrants) {
    if (!grantsByRole.has(g.roleId)) grantsByRole.set(g.roleId, [])
    grantsByRole.get(g.roleId).push(g.key)
  }
  const userCountByRole = new Map(userCounts.map((r) => [r.role, r.count]))

  const result = allRoles.map((role) => ({
    ...role,
    permissionKeys: grantsByRole.get(role.id) || [],
    userCount: userCountByRole.get(role.name) || 0,
  }))

  return { roles: result }
})
