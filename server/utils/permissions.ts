/**
 * RBAC (Role-Based Access Control) — Permission definitions
 *
 * Permission format: `<resource>:<action>`
 * Example: `tests:create`, `users:delete`
 */

export const ROLES = {
  admin: 'admin',
  operator: 'operator',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

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

  // Sessions
  SESSIONS_READ: 'sessions:read',
  SESSIONS_MANAGE: 'sessions:manage',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/** Role → Permission mapping */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [ROLES.admin]: Object.values(PERMISSIONS),

  [ROLES.operator]: [
    PERMISSIONS.TESTS_READ,
    PERMISSIONS.TESTS_CREATE,
    PERMISSIONS.TESTS_UPDATE,
    PERMISSIONS.PARTICIPANTS_READ,
    PERMISSIONS.PARTICIPANTS_CREATE,
    PERMISSIONS.PARTICIPANTS_UPDATE,
    PERMISSIONS.SESSIONS_READ,
    PERMISSIONS.SESSIONS_MANAGE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
  ],
}

/** Check if a role has a specific permission */
export function roleHasPermission(role: string, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role]
  if (!perms) return false
  return perms.includes(permission)
}

/** Check if a role has all specified permissions */
export function roleHasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every((p) => roleHasPermission(role, p))
}

/** Check if a role has any of the specified permissions */
export function roleHasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some((p) => roleHasPermission(role, p))
}
