import { pgTable, uuid, varchar, boolean, integer, timestamp, index, jsonb } from 'drizzle-orm/pg-core'
import { testTypes } from './testTypes.js'
import { users } from './users.js'

/** Reusable public invite link: biodata is collected on claim, then session(s) are minted. */
export const openInvitations = pgTable('open_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  testTypeId: uuid('test_type_id').references(() => testTypes.id).notNull(),
  /** Ordered list of test type IDs for multi-test packages. Falls back to [testTypeId]. */
  testTypeIds: jsonb('test_type_ids'),
  token: varchar('token', { length: 255 }).notNull().unique(),
  label: varchar('label', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  maxUses: integer('max_uses'),
  useCount: integer('use_count').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tokenIdx: index('open_invitations_token_idx').on(table.token),
  testTypeIdx: index('open_invitations_test_type_id_idx').on(table.testTypeId),
}))

export function resolveInvitationTestTypeIds(invitation) {
  const ids = Array.isArray(invitation?.testTypeIds) ? invitation.testTypeIds.filter(Boolean) : []
  if (ids.length) return ids
  return invitation?.testTypeId ? [invitation.testTypeId] : []
}
