import { pgTable, uuid, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { sessions } from './sessions.js'

export const sessionLogs = pgTable('session_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  level: varchar('level', { length: 20 }).notNull(), // 'info' | 'warning' | 'critical'
  eventType: varchar('event_type', { length: 50 }).notNull(),
  message: text('message'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
