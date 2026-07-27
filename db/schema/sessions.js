import { pgTable, uuid, varchar, jsonb, timestamp, text, integer, index } from 'drizzle-orm/pg-core'
import { testTypes } from './testTypes.js'
import { participants } from './participants.js'
import { users } from './users.js'

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  testTypeId: uuid('test_type_id').references(() => testTypes.id).notNull(),
  participantId: uuid('participant_id').references(() => participants.id).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  // 'pending' | 'in_progress' | 'completed' | 'verified' | 'abandoned'

  answers: jsonb('answers').default({}),
  scores: jsonb('scores').default({}),
  interpretation: jsonb('interpretation').default({}),
  metadata: jsonb('metadata').default({}),

  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: integer('verified_by').references(() => users.id),
  verifiedNotes: text('verified_notes'),
  lastActivity: timestamp('last_activity', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  statusIdx: index('sessions_status_idx').on(table.status),
  testTypeIdx: index('sessions_test_type_id_idx').on(table.testTypeId),
  participantIdx: index('sessions_participant_id_idx').on(table.participantId),
  createdAtIdx: index('sessions_created_at_idx').on(table.createdAt),
}))
