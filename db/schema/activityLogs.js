import { pgTable, serial, integer, varchar, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'

/**
 * System-wide activity / audit log.
 * Captures API mutations and important auth events.
 */
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),

  action: varchar('action', { length: 100 }).notNull(),
  category: varchar('category', { length: 40 }).notNull().default('other'),
  level: varchar('level', { length: 20 }).notNull().default('info'), // info | warning | error
  message: text('message'),

  method: varchar('method', { length: 10 }),
  path: text('path'),
  statusCode: integer('status_code'),

  actorUserId: integer('actor_user_id'),
  actorEmail: varchar('actor_email', { length: 255 }),
  actorName: varchar('actor_name', { length: 255 }),
  actorRole: varchar('actor_role', { length: 50 }),

  resourceType: varchar('resource_type', { length: 50 }),
  resourceId: varchar('resource_id', { length: 100 }),

  ip: varchar('ip', { length: 64 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata').default({}),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index('activity_logs_created_at_idx').on(table.createdAt),
  categoryIdx: index('activity_logs_category_idx').on(table.category),
  actionIdx: index('activity_logs_action_idx').on(table.action),
  actorEmailIdx: index('activity_logs_actor_email_idx').on(table.actorEmail),
}))
