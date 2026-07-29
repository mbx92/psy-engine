import { participants } from '~~/db/schema/participants'
import { desc, or, ilike, sql } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { parsePagination, paginationMeta } from '~~/server/utils/pagination'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.PARTICIPANTS_READ)

  const query = getQuery(event)
  const search = (query.search || '').trim()
  const pagination = parsePagination(query)

  const db = useDB()

  const whereClause = search
    ? or(
        ilike(participants.name, `%${search}%`),
        ilike(participants.email, `%${search}%`),
        ilike(participants.nik, `%${search}%`),
      )
    : undefined

  if (!pagination) {
    const allParticipants = await db.select().from(participants)
      .where(whereClause)
      .orderBy(desc(participants.createdAt))
    return { participants: allParticipants }
  }

  const [{ total }] = await db.select({ total: sql`count(*)`.mapWith(Number) })
    .from(participants)
    .where(whereClause)

  const rows = await db.select().from(participants)
    .where(whereClause)
    .orderBy(desc(participants.createdAt))
    .limit(pagination.limit)
    .offset(pagination.offset)

  return {
    participants: rows,
    pagination: paginationMeta({ page: pagination.page, limit: pagination.limit, total }),
  }
})
