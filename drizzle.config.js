import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './db/schema/index.js',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://localhost:5432/psy_engine',
  },
})
