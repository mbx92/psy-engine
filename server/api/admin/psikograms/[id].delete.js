import { psikograms } from '~~/db/schema/psikograms'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.PSIKOGRAMS_DELETE)

  const id = getRouterParam(event, 'id')
  if (!id || !UUID_PATTERN.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid psikogram ID required' })
  }

  const db = useDB()
  const [existing] = await db.select({ id: psikograms.id, status: psikograms.status }).from(psikograms).where(eq(psikograms.id, id)).limit(1)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Psikogram not found' })
  }

  if (existing.status === 'final') {
    throw createError({ statusCode: 400, message: 'Finalized psikograms cannot be deleted' })
  }

  await db.delete(psikograms).where(eq(psikograms.id, id))

  return { message: 'Psikogram deleted' }
})
