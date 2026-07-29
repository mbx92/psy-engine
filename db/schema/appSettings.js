import { pgTable, serial, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core'

// Singleton table — always exactly one row for system-wide prefs.
export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),

  systemName: varchar('system_name', { length: 100 }).default('PsyEngine'),
  tagline: varchar('tagline', { length: 255 }).default('Psychology Test System'),
  timezone: varchar('timezone', { length: 64 }).default('Asia/Jakarta'),
  logo: text('logo'), // data URL

  // System setup (superadmin only)
  maintenanceMode: boolean('maintenance_mode').notNull().default(false),
  maintenanceMessage: text('maintenance_message'),
  systemLocked: boolean('system_locked').notNull().default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})
