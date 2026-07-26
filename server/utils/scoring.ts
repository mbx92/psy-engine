import type { TestDefinition, ParsedQuestion } from './tests'

interface ScoreResult {
  dimensions: Record<string, number>
  raw: Record<string, number>
  interpretation?: Record<string, { label: string; description: string }>
}

/**
 * Generic scoring engine — processes answers based on test definition
 */
export function calculateScore(
  test: TestDefinition,
  answers: Record<string, string | string[]>
): ScoreResult {
  switch (test.scoringConfig.algorithm) {
    case 'correct_count':
      return scoreCorrectCount(test, answers)
    case 'dimension_sum':
      return scoreDimensionSum(test, answers)
    case 'paired_choice':
      return scorePairedChoice(test, answers)
    case 'likert_average':
      return scoreLikertAverage(test, answers)
    default:
      throw new Error(`Unknown algorithm: ${test.scoringConfig.algorithm}`)
  }
}

/** Correct count: for aptitude tests like CFIT */
function scoreCorrectCount(test: TestDefinition, answers: Record<string, string>): ScoreResult {
  let correct = 0
  let total = 0
  const subtestScores: Record<string, number> = {}

  for (const q of test.questions) {
    const answer = answers[q.id]
    if (answer == null) continue

    total++
    const correctOption = q.options.find(o => o.weight === 1)
    if (correctOption && answer === correctOption.id) {
      correct++
      if (q.subtestKey) {
        subtestScores[q.subtestKey] = (subtestScores[q.subtestKey] || 0) + 1
      }
    }
  }

  return {
    raw: { correct, total, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 },
    dimensions: { aptitude: correct },
    interpretation: buildInterpretation(test, 'aptitude', correct),
  }
}

/** Dimension sum: count weighted choices per dimension (EPPS, Likert) */
function scoreDimensionSum(test: TestDefinition, answers: Record<string, string>): ScoreResult {
  const raw: Record<string, number> = {}
  const counts: Record<string, number> = {}

  for (const q of test.questions) {
    const answer = answers[q.id]
    if (answer == null) continue

    const option = q.options.find(o => o.id === answer)
    if (!option) continue

    const dim = option.dimension
    if (dim) {
      raw[dim] = (raw[dim] || 0) + (option.weight || 1)
      counts[dim] = (counts[dim] || 0) + 1
    }
  }

  // Normalize scores (percentage)
  const dimensions: Record<string, number> = {}
  for (const [dim, score] of Object.entries(raw)) {
    const max = (counts[dim] || 1) // each option contributes max weight
    dimensions[dim] = Math.round((score / max) * 100)
  }

  return {
    raw,
    dimensions,
    interpretation: buildAllInterpretations(test, dimensions),
  }
}

/** Paired choice: PAPI Kostick style (A or B, pick one) */
function scorePairedChoice(test: TestDefinition, answers: Record<string, string>): ScoreResult {
  const raw: Record<string, number> = {}

  for (const q of test.questions) {
    const answer = answers[q.id]
    if (answer == null) continue

    const option = q.options.find(o => o.id === answer)
    if (!option) continue

    const dim = option.dimension
    if (dim) {
      raw[dim] = (raw[dim] || 0) + (option.weight || 1)
    }
  }

  return {
    raw,
    dimensions: raw,
    interpretation: buildAllInterpretations(test, raw),
  }
}

/** Likert average: 1-5 scale */
function scoreLikertAverage(test: TestDefinition, answers: Record<string, string>): ScoreResult {
  const raw: Record<string, number> = {}
  const counts: Record<string, number> = {}

  for (const q of test.questions) {
    const answer = answers[q.id]
    if (answer == null) continue

    const option = q.options.find(o => o.id === answer)
    if (!option) continue

    const dim = option.dimension || 'general'
    raw[dim] = (raw[dim] || 0) + (option.weight || 3)
    counts[dim] = (counts[dim] || 0) + 1
  }

  const dimensions: Record<string, number> = {}
  for (const [dim, total] of Object.entries(raw)) {
    dimensions[dim] = Math.round((total / (counts[dim] || 1)) * 20) // normalize to 0-100
  }

  return {
    raw,
    dimensions,
    interpretation: buildAllInterpretations(test, dimensions),
  }
}

function buildInterpretation(
  test: TestDefinition,
  dimensionKey: string,
  score: number
): Record<string, { label: string; description: string }> {
  const result: Record<string, { label: string; description: string }> = {}

  const dimInterpretation = test.scoringConfig.interpretations?.[dimensionKey]
  if (dimInterpretation) {
    const matched = dimInterpretation.ranges.find(r => score >= r.min && score <= r.max)
    if (matched) {
      result[dimensionKey] = { label: matched.label, description: matched.description }
    }
  }

  return result
}

function buildAllInterpretations(
  test: TestDefinition,
  scores: Record<string, number>
): Record<string, { label: string; description: string }> {
  const result: Record<string, { label: string; description: string }> = {}

  for (const [dim, score] of Object.entries(scores)) {
    const interpretation = buildInterpretation(test, dim, score)
    Object.assign(result, interpretation)
  }

  return result
}
