import { randomBytes } from 'node:crypto'
import { psikograms } from '~~/db/schema/psikograms'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.PSIKOGRAMS_UPDATE)

  const id = getRouterParam(event, 'id')
  if (!id || !UUID_PATTERN.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid psikogram ID required' })
  }

  const body = await readBody(event).catch(() => ({}))
  const expiryDays = Number(body?.expiryDays) > 0 ? Number(body.expiryDays) : 30

  const db = useDB()
  const [existing] = await db.select().from(psikograms).where(eq(psikograms.id, id)).limit(1)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Psikogram not found' })
  }
  if (existing.status !== 'final') {
    throw createError({ statusCode: 400, message: 'Only finalized psikograms can be shared' })
  }

  let token = existing.publicToken
  const stillValid = token && existing.publicTokenExpiry && new Date(existing.publicTokenExpiry) > new Date()

  if (!stillValid) {
    token = randomBytes(32).toString('hex')
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + expiryDays)
    await db.update(psikograms).set({ publicToken: token, publicTokenExpiry: expiry }).where(eq(psikograms.id, id))
  }

  const [updated] = await db.select({ publicTokenExpiry: psikograms.publicTokenExpiry }).from(psikograms).where(eq(psikograms.id, id)).limit(1)

  return { token, expiresAt: updated.publicTokenExpiry }
})
