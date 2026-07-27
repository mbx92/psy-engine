import { participants } from '~~/db/schema/participants'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

// Transport: the client reads the CSV file with the browser File API and
// posts the raw text as { csv: "..." } — avoids multipart parsing in Nitro.
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (!lines.length) return { header: [], rows: [] }

  const header = lines[0].split(',').map((h) => h.trim())
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim())
    const row = {}
    header.forEach((h, i) => { row[h] = cells[i] ?? '' })
    return row
  })
  return { header, rows }
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.PARTICIPANTS_CREATE)

  const body = await readBody(event)
  const csvText = body?.csv
  if (!csvText || typeof csvText !== 'string') {
    throw createError({ statusCode: 400, message: 'csv text is required' })
  }

  const { rows } = parseCsv(csvText)
  if (!rows.length) {
    throw createError({ statusCode: 400, message: 'No data rows found in CSV' })
  }

  const db = useDB()
  const errors = []
  let imported = 0

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2 // +1 for header, +1 for 1-indexing
    const row = rows[i]
    const name = row.name?.trim()
    const birthDate = row.birthDate?.trim()
    const gender = row.gender?.trim()?.toUpperCase()
    const phone = row.phone?.trim() || null
    const email = row.email?.trim() || null
    const nik = row.nik?.trim() || null

    if (!name || !birthDate || !gender) {
      errors.push({ row: rowNum, reason: 'name, birthDate, and gender are required' })
      continue
    }
    if (gender !== 'L' && gender !== 'P') {
      errors.push({ row: rowNum, reason: "gender must be 'L' or 'P'" })
      continue
    }
    if (Number.isNaN(new Date(birthDate).getTime())) {
      errors.push({ row: rowNum, reason: `invalid birthDate "${birthDate}" (expected YYYY-MM-DD)` })
      continue
    }

    try {
      await db.insert(participants).values({ name, birthDate, gender, phone, email, nik })
      imported++
    } catch (err) {
      errors.push({ row: rowNum, reason: err?.message || 'Insert failed' })
    }
  }

  return { imported, errors }
})
