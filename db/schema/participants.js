import { pgTable, uuid, varchar, date, timestamp, index } from 'drizzle-orm/pg-core'

export const participants = pgTable('participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  birthDate: date('birth_date').notNull(),
  gender: varchar('gender', { length: 1 }).notNull(), // 'L' | 'P'
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  nik: varchar('nik', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  emailIdx: index('participants_email_idx').on(table.email),
  nikIdx: index('participants_nik_idx').on(table.nik),
}))
