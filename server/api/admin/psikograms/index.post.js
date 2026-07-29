import { psikograms } from '~~/db/schema/psikograms'
import { participants } from '~~/db/schema/participants'
import { sessions } from '~~/db/schema/sessions'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { validateBody, psikogramCreateSchema } from '~~/server/utils/validation'
import { getDefaultSections } from '~~/server/utils/psikogramAnalyzer'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.PSIKOGRAMS_CREATE)

  const body = validateBody(psikogramCreateSchema, await readBody(event))
  const db = useDB()

  const [participant] = await db.select().from(participants).where(eq(participants.id, body.participantId)).limit(1)
  if (!participant) {
    throw createError({ statusCode: 404, message: 'Participant not found' })
  }

  if (body.sessionId) {
    const [session] = await db.select({ id: sessions.id, participantId: sessions.participantId, status: sessions.status })
      .from(sessions).where(eq(sessions.id, body.sessionId)).limit(1)
    if (!session) {
      throw createError({ statusCode: 404, message: 'Session not found' })
    }
    if (session.participantId !== body.participantId) {
      throw createError({ statusCode: 400, message: 'Session does not belong to the specified participant' })
    }
    if (!['completed', 'verified'].includes(session.status)) {
      throw createError({ statusCode: 400, message: 'Session must be completed before creating a psikogram' })
    }
  }

  const participantSnapshot = {
    name: participant.name,
    birthDate: participant.birthDate,
    gender: participant.gender,
    email: participant.email,
    phone: participant.phone,
    ...body.participant,
  }

  const [created] = await db.insert(psikograms).values({
    participantId: body.participantId,
    sessionId: body.sessionId || null,
    examinerId: event.context.auth.userId,
    examDate: body.examDate,
    participant: participantSnapshot,
    sections: body.sections || getDefaultSections(),
    recommendation: body.recommendation || null,
    status: body.status || 'draft',
    notes: body.notes || null,
  }).returning()

  return { psikogram: created }
})
