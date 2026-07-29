import { psikograms } from '~~/db/schema/psikograms'
import { participants } from '~~/db/schema/participants'
import { users } from '~~/db/schema/users'
import { eq, and, desc, ilike } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.PSIKOGRAMS_READ)

  const query = getQuery(event)
  const conditions = []
  if (query.status) conditions.push(eq(psikograms.status, query.status))
  if (query.participantId) conditions.push(eq(psikograms.participantId, query.participantId))
  const search = (query.search || '').trim()
  if (search) conditions.push(ilike(participants.name, `%${search}%`))

  const db = useDB()

  const rows = await db.select({
    id: psikograms.id,
    participantId: psikograms.participantId,
    sessionId: psikograms.sessionId,
    examDate: psikograms.examDate,
    participant: psikograms.participant,
    recommendation: psikograms.recommendation,
    status: psikograms.status,
    createdAt: psikograms.createdAt,
    updatedAt: psikograms.updatedAt,
    examinerId: users.id,
    examinerName: users.name,
  })
    .from(psikograms)
    .innerJoin(participants, eq(psikograms.participantId, participants.id))
    .innerJoin(users, eq(psikograms.examinerId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(psikograms.createdAt))

  return {
    psikograms: rows.map((r) => ({
      id: r.id,
      participantId: r.participantId,
      sessionId: r.sessionId,
      examDate: r.examDate,
      participant: r.participant,
      recommendation: r.recommendation,
      status: r.status,
      examiner: { id: r.examinerId, name: r.examinerName },
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
  }
})
