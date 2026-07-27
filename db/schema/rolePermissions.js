import { pgTable, serial, integer, unique } from 'drizzle-orm/pg-core'
import { roles } from './roles.js'
import { permissions } from './permissions.js'

export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: integer('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => ({
  roleXPermission: unique().on(table.roleId, table.permissionId),
}))
