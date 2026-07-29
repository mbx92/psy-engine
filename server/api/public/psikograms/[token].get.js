import { psikograms } from '~~/db/schema/psikograms'
import { users } from '~~/db/schema/users'
import { psychologySettings } from '~~/db/schema/psychologySettings'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, message: 'Token required' })
  }

  const db = useDB()

  const [row] = await db.select({
    id: psikograms.id,
    examDate: psikograms.examDate,
    participant: psikograms.participant,
    sections: psikograms.sections,
    recommendation: psikograms.recommendation,
    status: psikograms.status,
    publicTokenExpiry: psikograms.publicTokenExpiry,
    createdAt: psikograms.createdAt,
    examinerName: users.name,
  })
    .from(psikograms)
    .innerJoin(users, eq(psikograms.examinerId, users.id))
    .where(and(eq(psikograms.publicToken, token), eq(psikograms.status, 'final')))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, message: 'Psikogram not found or link invalid' })
  }

  if (row.publicTokenExpiry && new Date(row.publicTokenExpiry) < new Date()) {
    throw createError({ statusCode: 410, message: 'Share link has expired' })
  }

  const [settings] = await db.select().from(psychologySettings).limit(1)

  return {
    psikogram: {
      id: row.id,
      examDate: row.examDate,
      participant: row.participant,
      sections: row.sections,
      recommendation: row.recommendation,
      examiner: { name: row.examinerName },
      createdAt: row.createdAt,
    },
    settings: settings || null,
  }
})
