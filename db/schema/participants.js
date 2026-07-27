import { pgTable, uuid, varchar, date, timestamp } from 'drizzle-orm/pg-core'

export const participants = pgTable('participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  birthDate: date('birth_date').notNull(),
  gender: varchar('gender', { length: 1 }).notNull(), // 'L' | 'P'
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  nik: varchar('nik', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
