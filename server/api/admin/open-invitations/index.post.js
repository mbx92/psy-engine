import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { openInvitations } from '~~/db/schema/openInvitations'
import { testTypes } from '~~/db/schema/testTypes'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { validateBody, openInvitationCreateSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_MANAGE)

  const body = await readBody(event)
  const data = validateBody(openInvitationCreateSchema, body)

  const testTypeIds = Array.from(new Set(
    (Array.isArray(data.testTypeIds) && data.testTypeIds.length
      ? data.testTypeIds
      : [data.testTypeId]
    ).filter(Boolean),
  ))

  const db = useDB()
  const tests = await db.select({ id: testTypes.id, name: testTypes.name, isActive: testTypes.isActive })
    .from(testTypes)
    .where(inArray(testTypes.id, testTypeIds))

  if (tests.length !== testTypeIds.length) {
    throw createError({ statusCode: 404, message: 'Satu atau lebih jenis tes tidak ditemukan' })
  }
  const inactive = tests.find((t) => !t.isActive)
  if (inactive) {
    throw createError({ statusCode: 400, message: `Tidak bisa membuat link untuk tes nonaktif: ${inactive.name}` })
  }

  // Preserve admin-selected order
  const orderedIds = testTypeIds.filter((id) => tests.some((t) => t.id === id))

  let expiresAt = null
  if (data.expiresAt) {
    expiresAt = data.expiresAt.length === 10
      ? new Date(`${data.expiresAt}T23:59:59.999Z`)
      : new Date(data.expiresAt)
  }

  const token = randomUUID()
  const [invitation] = await db.insert(openInvitations).values({
    testTypeId: orderedIds[0],
    testTypeIds: orderedIds,
    token,
    label: data.label || null,
    maxUses: data.maxUses ?? null,
    expiresAt,
    createdBy: event.context.auth?.userId ?? null,
  }).returning()

  return {
    invitation,
    invitationPath: `/join/${token}`,
  }
})
