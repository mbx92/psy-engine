import { pgTable, uuid, varchar, jsonb, date, text, timestamp, integer, index } from 'drizzle-orm/pg-core'
import { participants } from './participants.js'
import { sessions } from './sessions.js'
import { users } from './users.js'

export const psikograms = pgTable('psikograms', {
  id: uuid('id').defaultRandom().primaryKey(),
  participantId: uuid('participant_id').references(() => participants.id).notNull(),
  sessionId: uuid('session_id').references(() => sessions.id),
  examinerId: integer('examiner_id').references(() => users.id).notNull(),

  examDate: date('exam_date').notNull(),
  // Snapshot of participant data at the time of creation: name, birthDate, education, corporate, etc.
  participant: jsonb('participant').notNull().default({}),
  // { kecerdasan: { items: [{title, description, rating}], conclusion }, sikapKerja: {...}, kepribadian: {...}, kemampuanBelajar: {...} }
  sections: jsonb('sections').default({}),
  recommendation: varchar('recommendation', { length: 20 }), // 'recommended' | 'not_recommended'
  status: varchar('status', { length: 20 }).notNull().default('draft'), // 'draft' | 'final'
  notes: text('notes'),

  publicToken: varchar('public_token', { length: 64 }).unique(),
  publicTokenExpiry: timestamp('public_token_expiry', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  participantIdx: index('psikograms_participant_id_idx').on(table.participantId),
  sessionIdx: index('psikograms_session_id_idx').on(table.sessionId),
  examinerIdx: index('psikograms_examiner_id_idx').on(table.examinerId),
  statusIdx: index('psikograms_status_idx').on(table.status),
}))
