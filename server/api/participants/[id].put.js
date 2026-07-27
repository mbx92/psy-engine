import { participants } from '~~/db/schema/participants'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { validateBody, participantUpdateSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.PARTICIPANTS_UPDATE)

  const id = getRouterParam(event, 'id')
  const body = validateBody(participantUpdateSchema, await readBody(event))

  const db = useDB()

  const updateData = { updatedAt: new Date() }
  if (body.name !== undefined) updateData.name = body.name
  if (body.birthDate !== undefined) updateData.birthDate = body.birthDate
  if (body.gender !== undefined) updateData.gender = body.gender
  if (body.phone !== undefined) updateData.phone = body.phone || null
  if (body.email !== undefined) updateData.email = body.email || null
  if (body.nik !== undefined) updateData.nik = body.nik || null

  const [updated] = await db.update(participants)
    .set(updateData)
    .where(eq(participants.id, id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Participant not found' })
  }

  return { participant: updated }
})
