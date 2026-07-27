import { pgTable, serial, varchar } from 'drizzle-orm/pg-core'

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  resource: varchar('resource', { length: 50 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  label: varchar('label', { length: 150 }).notNull(),
})
