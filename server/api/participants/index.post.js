import { participants } from '~~/db/schema/participants'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { validateBody, participantCreateSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.PARTICIPANTS_CREATE)

  const body = await readBody(event)
  const { name, birthDate, gender, phone, email, nik } = validateBody(participantCreateSchema, body)

  const db = useDB()

  const [participant] = await db.insert(participants).values({
    name,
    birthDate,
    gender,
    phone: phone || null,
    email: email || null,
    nik: nik || null,
  }).returning()

  return { participant }
})
