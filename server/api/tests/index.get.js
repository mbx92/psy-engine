import { requirePermission } from '~~/server/utils/access'
import { PERMISSIONS } from '~~/server/utils/permissions'
export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.TESTS_READ)
  const tests = await getAllTests()
  return tests.map(t => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    type: t.type,
    description: t.description,
    config: {
      timeLimit: t.config.timeLimit,
      instructions: t.config.instructions,
      questionsPerPage: t.config.questionsPerPage,
      subtests: t.config.subtests,
    },
    // Don't expose questions here — only on demand
  }))
})
