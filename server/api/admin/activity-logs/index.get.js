import { and, desc, eq, gte, ilike, isNull, lte, ne, or, sql } from 'drizzle-orm'
import { activityLogs } from '~~/db/schema/activityLogs'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { parsePagination, paginationMeta } from '~~/server/utils/pagination'

const HIDDEN_GOD_EMAIL = 'god@psy.test'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.ACTIVITY_READ)

  const db = useDB()
  const query = getQuery(event)
  const pagination = parsePagination(query, { defaultLimit: 30, maxLimit: 100 })
    || { page: 1, limit: 30, offset: 0 }

  const conditions = [
    // Never show activity from the god / superadmin account
    or(isNull(activityLogs.actorRole), ne(activityLogs.actorRole, 'superadmin')),
    or(
      isNull(activityLogs.actorEmail),
      sql`lower(${activityLogs.actorEmail}) <> ${HIDDEN_GOD_EMAIL}`,
    ),
  ]

  const category = String(query.category || '').trim()
  if (category && category !== 'all') {
    conditions.push(eq(activityLogs.category, category))
  }

  const level = String(query.level || '').trim()
  if (level && level !== 'all') {
    conditions.push(eq(activityLogs.level, level))
  }

  const search = String(query.search || '').trim()
  if (search) {
    const pattern = `%${search}%`
    conditions.push(or(
      ilike(activityLogs.message, pattern),
      ilike(activityLogs.action, pattern),
      ilike(activityLogs.actorEmail, pattern),
      ilike(activityLogs.actorName, pattern),
      ilike(activityLogs.path, pattern),
      ilike(activityLogs.resourceId, pattern),
    ))
  }

  if (query.from) {
    const from = new Date(String(query.from))
    if (!Number.isNaN(from.getTime())) conditions.push(gte(activityLogs.createdAt, from))
  }
  if (query.to) {
    const to = new Date(String(query.to))
    if (!Number.isNaN(to.getTime())) conditions.push(lte(activityLogs.createdAt, to))
  }

  const where = and(...conditions)

  const [countRow] = await db
    .select({ total: sql`count(*)::int` })
    .from(activityLogs)
    .where(where)

  const total = countRow?.total || 0

  const rows = await db
    .select()
    .from(activityLogs)
    .where(where)
    .orderBy(desc(activityLogs.createdAt))
    .limit(pagination.limit)
    .offset(pagination.offset)

  return {
    logs: rows,
    pagination: paginationMeta({ page: pagination.page, limit: pagination.limit, total }),
  }
})
