import { pgTable, serial, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core'

// Singleton table (single-tenant app) — always exactly one row.
export const psychologySettings = pgTable('psychology_settings', {
  id: serial('id').primaryKey(),

  // Logo & Branding (data URLs, stored inline — no file storage service in this app)
  logo: text('logo'),
  footer: text('footer'),
  primaryColor: varchar('primary_color', { length: 7 }).default('#16a34a'),
  secondaryColor: varchar('secondary_color', { length: 7 }).default('#6b7280'),

  // Psychologist Info
  psychologistName: varchar('psychologist_name', { length: 255 }),
  licenseNumber: varchar('license_number', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),

  // Institution Info
  institutionName: varchar('institution_name', { length: 255 }),
  tagline: varchar('tagline', { length: 255 }),
  address: text('address'),
  institutionWebsite: varchar('institution_website', { length: 255 }),
  institutionEmail: varchar('institution_email', { length: 255 }),
  institutionPhone: varchar('institution_phone', { length: 50 }),
  instagram: varchar('instagram', { length: 100 }),

  // Report Settings
  reportTitle: varchar('report_title', { length: 100 }).default('PSIKOGRAM'),
  reportSubtitle: varchar('report_subtitle', { length: 255 }).default('Hasil Pemeriksaan Psikologis'),
  reportFooter: text('report_footer'),

  // Display Options
  showLogo: boolean('show_logo').notNull().default(true),
  showSignature: boolean('show_signature').notNull().default(true),
  showWatermark: boolean('show_watermark').notNull().default(false),

  // Signature (data URL — drawn or uploaded)
  signature: text('signature'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})
