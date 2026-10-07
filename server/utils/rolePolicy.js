import { createError } from 'h3'
export function assertRoleEdit(actorRole, targetRole, permissionKeys, actorPermissions = []) {
  if (actorRole === 'superadmin') return
  if (targetRole === 'superadmin' || targetRole === actorRole) throw createError({ statusCode: 403, message: 'Only superadmin can modify this role' })
  if (permissionKeys?.some(key => key === 'system:manage' || !actorPermissions.includes(key))) throw createError({ statusCode: 403, message: 'Cannot delegate permissions you do not hold or system permissions' })
}
