import { requirePermission } from '~~/server/utils/access'
import { PERMISSIONS } from '~~/server/utils/permissions'
export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.TESTS_READ)
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Test slug required' })
  }

  const test = await getTestBySlug(slug)
  if (!test) {
    throw createError({ statusCode: 404, message: 'Test not found' })
  }

  return {
    id: test.id,
    name: test.name,
    slug: test.slug,
    type: test.type,
    description: test.description,
    config: test.config,
    questions: test.questions,
    scoringConfig: {
      algorithm: test.scoringConfig.algorithm,
      dimensions: test.scoringConfig.dimensions,
    },
  }
})
