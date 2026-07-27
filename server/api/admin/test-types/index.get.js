import { testTypes } from '~~/db/schema/testTypes'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

// Some legacy seed data stored questions/config double-encoded (a JSON
// string inside the jsonb column instead of a real array/object) — parse
// defensively so a malformed row can't break the whole list response.
function questionCountOf(questions) {
  const value = typeof questions === 'string' ? safeParse(questions) : questions
  return Array.isArray(value) ? value.length : 0
}

function safeParse(str) {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.TESTS_READ)
  const db = useDB()

  // Full config/scoringConfig are omitted here (can be large) — use
  // GET /api/admin/test-types/[id] for the complete record.
  const all = await db.select({
    id: testTypes.id,
    name: testTypes.name,
    slug: testTypes.slug,
    type: testTypes.type,
    description: testTypes.description,
    isActive: testTypes.isActive,
    createdAt: testTypes.createdAt,
    updatedAt: testTypes.updatedAt,
    questions: testTypes.questions,
  }).from(testTypes).orderBy(testTypes.createdAt)

  return {
    testTypes: all.map(({ questions, ...rest }) => ({ ...rest, questionCount: questionCountOf(questions) })),
  }
})
