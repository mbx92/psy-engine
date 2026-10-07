import { pgTable, uuid, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users.js'
export const authSessions = pgTable('auth_sessions', {
  id: uuid('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => ({ userIdx: index('auth_sessions_user_id_idx').on(table.userId) }))
