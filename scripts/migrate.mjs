/**
 * Apply Drizzle SQL migrations without drizzle-orm/migrator
 * (Nitro prunes migrator.js from the production bundle).
 *
 * Mirrors drizzle-orm/pg-core dialect.migrate():
 * - schema/table: drizzle.__drizzle_migrations
 * - skip rule: last created_at >= journal "when"
 *
 * Run: node scripts/migrate.mjs
 */
import postgres from 'postgres'
import { readFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createHash } from 'node:crypto'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('[migrate] DATABASE_URL is required')
  process.exit(1)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsFolder = join(__dirname, '../db/migrations')
const journalPath = join(migrationsFolder, 'meta/_journal.json')
const migrationsSchema = 'drizzle'
const migrationsTable = '__drizzle_migrations'

async function fileExists(path) {
  try {
    await access(path, constants.R_OK)
    return true
  } catch {
    return false
  }
}

const client = postgres(connectionString, { max: 1 })

try {
  if (!(await fileExists(journalPath))) {
    throw new Error(`Missing migration journal: ${journalPath}`)
  }

  const journal = JSON.parse(await readFile(journalPath, 'utf8'))
  const entries = journal.entries || []

  await client.unsafe(`CREATE SCHEMA IF NOT EXISTS "${migrationsSchema}"`)
  await client.unsafe(`
    CREATE TABLE IF NOT EXISTS "${migrationsSchema}"."${migrationsTable}" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `)

  const lastRows = await client.unsafe(
    `SELECT id, hash, created_at FROM "${migrationsSchema}"."${migrationsTable}" ORDER BY created_at DESC LIMIT 1`,
  )
  const lastCreatedAt = lastRows[0] ? Number(lastRows[0].created_at) : null

  console.log(
    `[migrate] ${entries.length} journal entries; last applied created_at=${lastCreatedAt ?? 'none'}`,
  )

  await client.begin(async (sql) => {
    for (const entry of entries) {
      const sqlPath = join(migrationsFolder, `${entry.tag}.sql`)
      if (!(await fileExists(sqlPath))) {
        throw new Error(`Missing migration file: ${sqlPath}`)
      }

      const query = await readFile(sqlPath, 'utf8')
      const hash = createHash('sha256').update(query).digest('hex')
      const folderMillis = entry.when

      if (lastCreatedAt !== null && !(lastCreatedAt < folderMillis)) {
        console.log(`[migrate] skip ${entry.tag}`)
        continue
      }

      const statements = query.split('--> statement-breakpoint')
      console.log(`[migrate] apply ${entry.tag} (${statements.length} statements)`)

      for (const statement of statements) {
        const trimmed = statement.trim()
        if (!trimmed) continue
        await sql.unsafe(trimmed)
      }

      await sql.unsafe(
        `INSERT INTO "${migrationsSchema}"."${migrationsTable}" ("hash", "created_at") VALUES ($1, $2)`,
        [hash, folderMillis],
      )
    }
  })

  console.log('[migrate] Done')
} catch (err) {
  console.error('[migrate] Failed:', err)
  process.exit(1)
} finally {
  await client.end({ timeout: 5 })
}
