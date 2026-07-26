import type { Permission } from './permissions'
import { roleHasPermission } from './permissions'

/**
 * Require a specific permission for the current request.
 * Call inside API event handlers after auth middleware has run.
 */
export function requirePermission(event: any, permission: Permission) {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (!roleHasPermission(auth.role, permission)) {
    throw createError({ statusCode: 403, message: 'Forbidden: insufficient permissions' })
  }
}

/**
 * Require that the user belongs to one of the specified roles.
 */
export function requireRole(event: any, roles: string[]) {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (!roles.includes(auth.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden: insufficient role' })
  }
}
