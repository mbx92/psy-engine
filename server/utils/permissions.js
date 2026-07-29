import { eq, and } from 'drizzle-orm'
import { roles } from '~~/db/schema/roles'
import { permissions } from '~~/db/schema/permissions'
import { rolePermissions } from '~~/db/schema/rolePermissions'

/**
 * RBAC (Role-Based Access Control)
 *
 * Permission format: `<resource>:<action>`
 * Example: `tests:create`, `users:delete`
 *
 * The set of permissions the app understands is fixed here (each one
 * corresponds to an actual authorization check in the code). Which
 * permissions belong to which role is admin-editable data, stored in
 * the roles / permissions / role_permissions tables.
 */

export const PERMISSIONS = {
  // Users
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',

  // Tests / Test Types
  TESTS_READ: 'tests:read',
  TESTS_CREATE: 'tests:create',
  TESTS_UPDATE: 'tests:update',
  TESTS_DELETE: 'tests:delete',

  // Participants
  PARTICIPANTS_READ: 'participants:read',
  PARTICIPANTS_CREATE: 'participants:create',
  PARTICIPANTS_UPDATE: 'participants:update',
  PARTICIPANTS_DELETE: 'participants:delete',

  // Sessions
  SESSIONS_READ: 'sessions:read',
  SESSIONS_MANAGE: 'sessions:manage',

  // Psikograms
  PSIKOGRAMS_READ: 'psikograms:read',
  PSIKOGRAMS_CREATE: 'psikograms:create',
  PSIKOGRAMS_UPDATE: 'psikograms:update',
  PSIKOGRAMS_DELETE: 'psikograms:delete',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',

  // RBAC administration
  RBAC_MANAGE: 'rbac:manage',

  // System setup (superadmin / god mode only)
  SYSTEM_MANAGE: 'system:manage',

  // Activity / audit log
  ACTIVITY_READ: 'activity:read',
}

/** Get all permission keys granted to a role (DB-backed). */
export async function getRolePermissionKeys(role) {
  const db = useDB()
  const rows = await db.select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(roles.name, role))

  return rows.map((r) => r.key)
}

/** Check if a role has a specific permission */
export async function roleHasPermission(role, permission) {
  const db = useDB()
  const rows = await db.select({ id: permissions.id })
    .from(rolePermissions)
    .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(and(eq(roles.name, role), eq(permissions.key, permission)))
    .limit(1)

  return rows.length > 0
}

/** Check if a role has all specified permissions */
export async function roleHasAllPermissions(role, permissionKeys) {
  const granted = await getRolePermissionKeys(role)
  return permissionKeys.every((p) => granted.includes(p))
}

/** Check if a role has any of the specified permissions */
export async function roleHasAnyPermission(role, permissionKeys) {
  const granted = await getRolePermissionKeys(role)
  return permissionKeys.some((p) => granted.includes(p))
}
