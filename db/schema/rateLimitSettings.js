import { pgTable, integer, jsonb, uuid, timestamp, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
export const rateLimitSettings = pgTable('rate_limit_settings', {
  id: integer('id').primaryKey().default(1),
  policies: jsonb('policies').notNull(),
  revision: uuid('revision').notNull().defaultRandom(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({ singleton: check('rate_limit_settings_singleton', sql`${table.id} = 1`) }))
