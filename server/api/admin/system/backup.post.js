import { spawn } from 'node:child_process'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

function parseDatabaseUrl(url) {
  const u = new URL(url)
  return {
    host: u.hostname || '127.0.0.1',
    port: u.port || '5432',
    user: decodeURIComponent(u.username || ''),
    password: decodeURIComponent(u.password || ''),
    database: (u.pathname || '/').replace(/^\//, '') || 'postgres',
  }
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SYSTEM_MANAGE)

  const connectionString = process.env.DATABASE_URL || 'postgres://mbx@127.0.0.1:5432/psy_engine'
  const db = parseDatabaseUrl(connectionString)
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `psy-engine-backup-${stamp}.sql`

  setHeader(event, 'Content-Type', 'application/sql')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

  const env = { ...process.env }
  if (db.password) env.PGPASSWORD = db.password

  const args = [
    '-h', db.host,
    '-p', String(db.port),
    '-U', db.user || 'postgres',
    '-d', db.database,
    '--no-owner',
    '--no-acl',
    '--clean',
    '--if-exists',
  ]

  const child = spawn('pg_dump', args, { env })

  const chunks = []
  let stderr = ''

  child.stdout.on('data', (chunk) => chunks.push(chunk))
  child.stderr.on('data', (chunk) => { stderr += chunk.toString() })

  const code = await new Promise((resolve, reject) => {
    child.on('error', (err) => reject(err))
    child.on('close', resolve)
  })

  if (code !== 0) {
    throw createError({
      statusCode: 500,
      message: stderr.trim() || `pg_dump failed with exit code ${code}. Pastikan pg_dump terpasang di server.`,
    })
  }

  return Buffer.concat(chunks)
})
