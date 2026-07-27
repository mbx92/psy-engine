import { testTypes } from '~~/db/schema/testTypes'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { validateBody, testTypeCreateSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.TESTS_CREATE)

  const body = await readBody(event)
  const { name, slug, type, description, config, questions, scoringConfig, isActive } = validateBody(testTypeCreateSchema, body)

  const db = useDB()

  const existing = await db.select({ id: testTypes.id }).from(testTypes).where(eq(testTypes.slug, slug)).limit(1)
  if (existing.length) {
    throw createError({ statusCode: 409, message: 'A test type with this slug already exists' })
  }

  const [created] = await db.insert(testTypes).values({
    name,
    slug,
    type,
    description: description || null,
    config: config ?? {},
    questions: questions ?? [],
    scoringConfig: scoringConfig ?? {},
    isActive: isActive !== undefined ? !!isActive : true,
  }).returning()

  return { testType: created }
})
