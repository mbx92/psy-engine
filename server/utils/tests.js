import { testTypes } from '~~/db/schema/testTypes'
import { eq } from 'drizzle-orm'

export async function getTestBySlug(slug) {
  const db = useDB()
  const [result] = await db.select().from(testTypes).where(eq(testTypes.slug, slug)).limit(1)
  if (!result) return null

  return {
    id: result.id,
    name: result.name,
    slug: result.slug,
    type: result.type,
    description: result.description,
    config: result.config,
    questions: result.questions,
    scoringConfig: result.scoringConfig,
  }
}

export async function getTestById(id) {
  const db = useDB()
  const [result] = await db.select().from(testTypes).where(eq(testTypes.id, id)).limit(1)
  if (!result) return null

  return {
    id: result.id,
    name: result.name,
    slug: result.slug,
    type: result.type,
    description: result.description,
    config: result.config,
    questions: result.questions,
    scoringConfig: result.scoringConfig,
  }
}

export async function getAllTests() {
  const db = useDB()
  const results = await db.select().from(testTypes).where(eq(testTypes.isActive, true))
  return results.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    type: r.type,
    description: r.description,
    config: r.config,
    questions: r.questions,
    scoringConfig: r.scoringConfig,
  }))
}
