import { testTypes } from '~~/db/schema/testTypes'
import { eq } from 'drizzle-orm'

export interface ParsedQuestion {
  id: string
  number: number
  text: string
  subtestKey?: string
  options: { id: string; text: string; dimension?: string; weight?: number; pairWith?: string }[]
}

export interface TestDefinition {
  id: string
  name: string
  slug: string
  type: string
  description: string | null
  config: {
    timeLimit: number
    allowSkip: boolean
    randomize: boolean
    questionsPerPage: number
    subtests?: { key: string; label: string; timeLimit: number; questionCount: number }[]
    instructions: string[]
  }
  questions: ParsedQuestion[]
  scoringConfig: {
    algorithm: 'dimension_sum' | 'correct_count' | 'paired_choice' | 'likert_average'
    dimensions: { key: string; label: string; description?: string }[]
    interpretations?: Record<string, { ranges: { min: number; max: number; label: string; description: string }[] }>
  }
}

export async function getTestBySlug(slug: string): Promise<TestDefinition | null> {
  const db = useDB()
  const [result] = await db.select().from(testTypes).where(eq(testTypes.slug, slug)).limit(1)
  if (!result) return null

  return {
    id: result.id,
    name: result.name,
    slug: result.slug,
    type: result.type,
    description: result.description,
    config: result.config as TestDefinition['config'],
    questions: result.questions as ParsedQuestion[],
    scoringConfig: result.scoringConfig as TestDefinition['scoringConfig'],
  }
}

export async function getAllTests(): Promise<TestDefinition[]> {
  const db = useDB()
  const results = await db.select().from(testTypes).where(eq(testTypes.isActive, true))
  return results.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    type: r.type,
    description: r.description,
    config: r.config as TestDefinition['config'],
    questions: r.questions as ParsedQuestion[],
    scoringConfig: r.scoringConfig as TestDefinition['scoringConfig'],
  }))
}
