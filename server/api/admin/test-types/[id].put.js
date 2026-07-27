import { testTypes } from '~~/db/schema/testTypes'
import { eq, ne, and } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { validateBody, testTypeUpdateSchema } from '~~/server/utils/validation'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.TESTS_UPDATE)

  const id = getRouterParam(event, 'id')
  if (!id || !UUID_PATTERN.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid test type ID required' })
  }

  const body = validateBody(testTypeUpdateSchema, await readBody(event))
  const db = useDB()

  const [existing] = await db.select({ id: testTypes.id }).from(testTypes).where(eq(testTypes.id, id)).limit(1)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Test type not found' })
  }

  const updateData = {}

  if (body.name !== undefined) updateData.name = body.name
  if (body.type !== undefined) updateData.type = body.type
  if (body.description !== undefined) updateData.description = body.description
  if (body.isActive !== undefined) updateData.isActive = !!body.isActive
  // Whole-blob replace — admins edit these as complete JSON documents, not partial merges.
  if (body.config !== undefined) updateData.config = body.config
  if (body.questions !== undefined) updateData.questions = body.questions
  if (body.scoringConfig !== undefined) updateData.scoringConfig = body.scoringConfig

  if (body.slug !== undefined) {
    const slugTaken = await db.select({ id: testTypes.id }).from(testTypes)
      .where(and(eq(testTypes.slug, body.slug), ne(testTypes.id, id))).limit(1)
    if (slugTaken.length) {
      throw createError({ statusCode: 409, message: 'A test type with this slug already exists' })
    }
    updateData.slug = body.slug
  }

  updateData.updatedAt = new Date()

  const [updated] = await db.update(testTypes).set(updateData).where(eq(testTypes.id, id)).returning()

  return { testType: updated }
})
