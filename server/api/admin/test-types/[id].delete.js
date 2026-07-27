import { testTypes } from '~~/db/schema/testTypes'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Deactivates rather than hard-deletes: existing sessions reference
// testTypeId, and hard-deleting would orphan historical session data.
export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.TESTS_DELETE)

  const id = getRouterParam(event, 'id')
  if (!id || !UUID_PATTERN.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid test type ID required' })
  }

  const db = useDB()
  const [updated] = await db.update(testTypes)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(testTypes.id, id))
    .returning({ id: testTypes.id, name: testTypes.name, isActive: testTypes.isActive })

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Test type not found' })
  }

  return { testType: updated, message: 'Test type deactivated (soft-delete — existing sessions remain valid)' }
})
