import { testTypes } from '~~/db/schema/testTypes'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.TESTS_READ)

  const id = getRouterParam(event, 'id')
  if (!id || !UUID_PATTERN.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid test type ID required' })
  }

  const db = useDB()
  const [testType] = await db.select().from(testTypes).where(eq(testTypes.id, id)).limit(1)

  if (!testType) {
    throw createError({ statusCode: 404, message: 'Test type not found' })
  }

  return { testType }
})
