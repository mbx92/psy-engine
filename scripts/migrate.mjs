/**
 * Apply Drizzle SQL migrations (idempotent).
 * Used by Docker / Coolify entrypoint before starting Nitro.
 *
 * Run: node scripts/migrate.mjs
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('[migrate] DATABASE_URL is required')
  process.exit(1)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsFolder = join(__dirname, '../db/migrations')

const client = postgres(connectionString, { max: 1 })
const db = drizzle(client)

try {
  console.log('[migrate] Applying migrations from', migrationsFolder)
  await migrate(db, { migrationsFolder })
  console.log('[migrate] Done')
} catch (err) {
  console.error('[migrate] Failed:', err)
  process.exit(1)
} finally {
  await client.end({ timeout: 5 })
}
