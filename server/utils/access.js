import { roleHasPermission, roleHasAnyPermission } from './permissions.js'

/**
 * Require a specific permission for the current request.
 * Call inside API event handlers after auth middleware has run.
 */
export async function requirePermission(event, permission) {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (permission === 'system:manage' && auth.role !== 'superadmin') {
    throw createError({ statusCode: 403, message: 'Only superadmin can manage the system' })
  }

  if (!(await roleHasPermission(auth.role, permission))) {
    throw createError({ statusCode: 403, message: 'Forbidden: insufficient permissions' })
  }
}

/**
 * Require at least one of the specified permissions for the current request.
 */
export async function requireAnyPermission(event, permissionList) {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (!(await roleHasAnyPermission(auth.role, permissionList))) {
    throw createError({ statusCode: 403, message: 'Forbidden: insufficient permissions' })
  }
}

/**
 * Require that the user belongs to one of the specified roles.
 */
export function requireRole(event, roles) {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (!roles.includes(auth.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden: insufficient role' })
  }
}
