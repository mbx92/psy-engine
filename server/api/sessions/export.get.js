import { eq, and, gte, lte } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { participants } from '~~/db/schema/participants'
import { testTypes } from '~~/db/schema/testTypes'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

function csvEscape(value) {
  const str = value == null ? '' : String(value)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_READ)

  const query = getQuery(event)
  const format = (query.format || 'json').toLowerCase()
  const conditions = []

  if (query.status) conditions.push(eq(sessions.status, query.status))
  if (query.testTypeId) conditions.push(eq(sessions.testTypeId, query.testTypeId))
  if (query.dateFrom) conditions.push(gte(sessions.createdAt, new Date(query.dateFrom)))
  if (query.dateTo) conditions.push(lte(sessions.createdAt, new Date(query.dateTo)))

  const db = useDB()
  const rows = await db.select({
    id: sessions.id,
    status: sessions.status,
    createdAt: sessions.createdAt,
    completedAt: sessions.completedAt,
    verifiedAt: sessions.verifiedAt,
    participantName: participants.name,
    participantEmail: participants.email,
    testTypeName: testTypes.name,
    scores: sessions.scores,
  })
    .from(sessions)
    .innerJoin(participants, eq(sessions.participantId, participants.id))
    .innerJoin(testTypes, eq(sessions.testTypeId, testTypes.id))
    .where(conditions.length ? and(...conditions) : undefined)

  if (format !== 'csv') {
    return { sessions: rows }
  }

  // Flatten: union every dimension key seen across the result set into its own
  // column. Simpler per-row alternative (single JSON-blob column) would be
  // less useful for spreadsheet analysis, which is the point of a CSV export.
  const dimensionKeys = [...new Set(rows.flatMap((r) => Object.keys(r.scores?.dimensions || {})))]

  const header = ['id', 'status', 'participantName', 'participantEmail', 'testTypeName', 'createdAt', 'completedAt', 'verifiedAt', ...dimensionKeys]
  const lines = [header.join(',')]

  for (const r of rows) {
    const dims = r.scores?.dimensions || {}
    const line = [
      r.id, r.status, r.participantName, r.participantEmail || '', r.testTypeName,
      r.createdAt?.toISOString() || '', r.completedAt?.toISOString() || '', r.verifiedAt?.toISOString() || '',
      ...dimensionKeys.map((k) => dims[k] ?? ''),
    ].map(csvEscape)
    lines.push(line.join(','))
  }

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="sessions-export-${Date.now()}.csv"`)
  return lines.join('\n')
})
