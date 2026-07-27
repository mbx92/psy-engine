import { pgTable, uuid, varchar, jsonb, timestamp, text } from 'drizzle-orm/pg-core'
import { testTypes } from './testTypes'
import { participants } from './participants'

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  testTypeId: uuid('test_type_id').references(() => testTypes.id).notNull(),
  participantId: uuid('participant_id').references(() => participants.id).notNull(),
  invitationId: uuid('invitation_id'),
  token: varchar('token', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  // 'pending' | 'in_progress' | 'completed' | 'verified' | 'abandoned'

  answers: jsonb('answers').default({}),
  scores: jsonb('scores').default({}),
  interpretation: jsonb('interpretation').default({}),
  metadata: jsonb('metadata').default({}),

  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by'),
  verifiedNotes: text('verified_notes'),
  lastActivity: timestamp('last_activity'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
