import { participants } from '~~/db/schema/participants'
import { desc, or, ilike } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.PARTICIPANTS_READ)

  const query = getQuery(event)
  const search = (query.search || '').trim()

  const db = useDB()

  const whereClause = search
    ? or(
        ilike(participants.name, `%${search}%`),
        ilike(participants.email, `%${search}%`),
        ilike(participants.nik, `%${search}%`),
      )
    : undefined

  const allParticipants = await db.select().from(participants)
    .where(whereClause)
    .orderBy(desc(participants.createdAt))

  return { participants: allParticipants }
})
