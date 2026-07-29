import { psikograms } from '~~/db/schema/psikograms'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { validateBody, psikogramUpdateSchema } from '~~/server/utils/validation'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.PSIKOGRAMS_UPDATE)

  const id = getRouterParam(event, 'id')
  if (!id || !UUID_PATTERN.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid psikogram ID required' })
  }

  const body = validateBody(psikogramUpdateSchema, await readBody(event))
  const db = useDB()

  const [existing] = await db.select().from(psikograms).where(eq(psikograms.id, id)).limit(1)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Psikogram not found' })
  }

  const { userId, role } = event.context.auth
  if (existing.status === 'final' && existing.examinerId !== userId && role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Only the examiner or an admin can update a finalized psikogram' })
  }

  const updateData = {}
  if (body.examDate !== undefined) updateData.examDate = body.examDate
  if (body.participant !== undefined) updateData.participant = body.participant
  if (body.sections !== undefined) updateData.sections = body.sections
  if (body.recommendation !== undefined) updateData.recommendation = body.recommendation
  if (body.status !== undefined) updateData.status = body.status
  if (body.notes !== undefined) updateData.notes = body.notes
  updateData.updatedAt = new Date()

  const [updated] = await db.update(psikograms).set(updateData).where(eq(psikograms.id, id)).returning()

  return { psikogram: updated }
})
