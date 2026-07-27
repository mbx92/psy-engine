import { pgTable, uuid, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { testTypes } from './testTypes.js'

export const testTypeNorms = pgTable('test_type_norms', {
  id: uuid('id').defaultRandom().primaryKey(),
  testTypeId: uuid('test_type_id').notNull().references(() => testTypes.id),
  /** Norm identifier, e.g. 'cfit_iq', 'papi_sten', 'epps_percentile' */
  code: varchar('code', { length: 50 }).notNull(),
  /** Label for display */
  label: varchar('label', { length: 255 }),
  /** Norm type: 'raw_to_iq', 'raw_to_percentile', 'raw_to_sten', 'raw_to_stanine', 'age_based' */
  normType: varchar('norm_type', { length: 50 }).notNull(),
  /** The actual norm table data (JSON) */
  data: jsonb('data').notNull(),
  /** Metadata about the norm (population, source, etc.) */
  metadata: jsonb('metadata').default({}),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})
