/**
 * Generic scoring engine — processes answers based on test definition
 */
import { scoreEppsMatrix } from './scoring/epps.js'

export function calculateScore(test, answers, context = {}) {
  switch (test.scoringConfig?.algorithm) {
    case 'correct_count':
      return scoreCorrectCount(test, answers)
    case 'dimension_sum':
      return scoreDimensionSum(test, answers)
    case 'paired_choice':
      return scorePairedChoice(test, answers)
    case 'likert_average':
      return scoreLikertAverage(test, answers)
    case 'raw_to_iq':
      return scoreRawToIq(test, answers, context)
    case 'epps_matrix':
      return scoreEppsMatrix(test, answers, context)
    default:
      throw new Error(`Unknown algorithm: ${test.scoringConfig?.algorithm}`)
  }
}

/** Correct count: for aptitude tests like CFIT (seed format) */
function scoreCorrectCount(test, answers) {
  let correct = 0
  let total = 0
  const subtestScores = {}

  for (const q of test.questions) {
    if (q.type === 'instruction') continue
    const answer = answers[q.id]
    if (answer == null) continue

    total++
    const correctOption = q.options?.find(o => o.weight === 1)
    if (correctOption && answer === correctOption.id) {
      correct++
      if (q.subtestKey) {
        subtestScores[q.subtestKey] = (subtestScores[q.subtestKey] || 0) + 1
      }
    }
  }

  return {
    raw: { correct, total, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 },
    dimensions: { aptitude: correct, ...subtestScores },
    interpretation: buildInterpretation(test, 'aptitude', correct),
  }
}

/** CFIT-style: count correct letters, convert raw → IQ via age norms */
function scoreRawToIq(test, answers, context = {}) {
  const subtestScores = {}
  for (const dim of test.scoringConfig?.dimensions || []) {
    if (dim.key && dim.key !== 'rawScore' && dim.key !== 'iqScore') {
      subtestScores[dim.key] = 0
    }
  }
  for (const st of test.config?.subtests || []) {
    const key = st.key || st.code
    if (key && subtestScores[key] === undefined) subtestScores[key] = 0
  }

  let rawScore = 0
  let answered = 0

  for (const q of test.questions) {
    if (q.type === 'instruction' || !q.answer) continue
    const selected = answers[q.id]
    if (selected == null) continue
    answered++

    const selectedOpt = q.options?.find(o => o.id === selected)
    const selectedValue = (selectedOpt?.value || selectedOpt?.label || selected || '').toString().toUpperCase()
    const correct = q.answer.toString().toUpperCase()
    const key = q.subtestKey || q.subtest || 'total'
    if (subtestScores[key] === undefined) subtestScores[key] = 0
    if (selectedValue === correct) {
      rawScore++
      subtestScores[key]++
    }
  }

  const maxRawScore = test.scoringConfig?.maxRawScore
    || test.questions.filter(q => q.type !== 'instruction' && q.answer).length

  const ageGroup = resolveAgeGroup(
    context.birthDate,
    context.norms,
    test.scoringConfig?.defaultAgeGroup || '13-9_dewasa',
    context.assessmentDate,
  )
  const { iqScore, classification } = convertRawToIq(rawScore, ageGroup, context.norms, test.scoringConfig)

  return {
    raw: { rawScore, answered, maxRawScore, ageGroup },
    dimensions: {
      ...subtestScores,
      rawScore,
      iqScore,
    },
    interpretation: {
      iq: {
        label: classification || String(iqScore),
        description: `IQ ${iqScore} (${classification || '—'}) · raw ${rawScore}/${maxRawScore}`,
      },
    },
  }
}

function resolveAgeGroup(birthDate, norms, defaultAgeGroup = '13-9_dewasa', assessmentDate) {
  if (!birthDate || !norms) throw new Error('IQ norms and participant birth date are required')

  const birth = new Date(birthDate)
  const now = assessmentDate ? new Date(assessmentDate) : new Date()
  if (!Number.isFinite(birth.getTime()) || !Number.isFinite(now.getTime())) throw new Error('Invalid date for IQ norms')

  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months -= 1

  for (const [key, group] of Object.entries(norms)) {
    if (months >= group.ageMonthsStart && months <= group.ageMonthsEnd) return key
  }
  throw new Error('IQ norms do not cover the participant age')
}

function convertRawToIq(rawScore, ageGroup, norms, scoringConfig = {}) {
  const group = norms?.[ageGroup]
  if (group?.norms?.length) {
    const exact = group.norms.find(n => n.rawScore === rawScore)
    if (exact?.iqScore != null) {
      return {
        iqScore: exact.iqScore,
        classification: exact.classification || classifyIq(exact.iqScore, scoringConfig),
      }
    }
  }

  throw new Error('IQ norms are missing or invalid for the participant age group')
}

function classifyIq(iq, scoringConfig = {}) {
  const ranges = scoringConfig.classificationRanges || []
  const match = ranges.find((r) => {
    const min = r.min ?? r.minIQ ?? 0
    const max = r.max ?? r.maxIQ ?? 999
    return iq >= min && iq <= max
  })
  return match?.label || match?.classification || '—'
}

/** Dimension sum: count weighted choices per dimension (EPPS, Likert) */
function scoreDimensionSum(test, answers) {
  const raw = {}
  const counts = {}

  for (const q of test.questions) {
    if (q.type === 'instruction') continue
    const answer = answers[q.id]
    if (answer == null) continue

    const option = q.options?.find(o => o.id === answer)
    if (!option) continue

    const dim = option.dimension
    if (dim) {
      raw[dim] = (raw[dim] || 0) + (option.weight ?? 1)
      counts[dim] = (counts[dim] || 0) + 1
    }
  }

  const dimensions = {}
  for (const [dim, score] of Object.entries(raw)) {
    const max = (counts[dim] || 1)
    dimensions[dim] = Math.round((score / max) * 100)
  }

  return {
    raw,
    dimensions,
    interpretation: buildAllInterpretations(test, dimensions),
  }
}

/** Paired choice: PAPI Kostick style (A or B, pick one) */
function scorePairedChoice(test, answers) {
  const raw = {}

  for (const q of test.questions) {
    if (q.type === 'instruction') continue
    const answer = answers[q.id]
    if (answer == null) continue

    const option = q.options?.find(o => o.id === answer)
    if (!option) continue

    const dim = option.dimension
    if (dim) {
      raw[dim] = (raw[dim] || 0) + (option.weight ?? 1)
    }
  }

  return {
    raw,
    dimensions: raw,
    interpretation: buildPairedInterpretations(test, raw),
  }
}

/** Likert average: 1-5 scale */
function scoreLikertAverage(test, answers) {
  const raw = {}
  const counts = {}

  for (const q of test.questions) {
    if (q.type === 'instruction') continue
    const answer = answers[q.id]
    if (answer == null) continue

    const option = q.options?.find(o => o.id === answer)
    if (!option) continue

    const dim = option.dimension || 'general'
    raw[dim] = (raw[dim] || 0) + (option.weight ?? 3)
    counts[dim] = (counts[dim] || 0) + 1
  }

  const dimensions = {}
  for (const [dim, total] of Object.entries(raw)) {
    dimensions[dim] = Math.round((total / (counts[dim] || 1)) * 20)
  }

  return {
    raw,
    dimensions,
    interpretation: buildAllInterpretations(test, dimensions),
  }
}

function buildInterpretation(test, dimensionKey, score) {
  const result = {}

  const dimInterpretation = test.scoringConfig?.interpretations?.[dimensionKey]
  if (dimInterpretation?.ranges) {
    const matched = dimInterpretation.ranges.find(r => score >= r.min && score <= r.max)
    if (matched) {
      result[dimensionKey] = { label: matched.label, description: matched.description }
    }
  }

  return result
}

function buildAllInterpretations(test, scores) {
  const result = {}

  for (const [dim, score] of Object.entries(scores)) {
    const interpretation = buildInterpretation(test, dim, score)
    Object.assign(result, interpretation)
  }

  return result
}

/** PAPI narratives may use levels[] (min/max) or levels{ low, medium, high } */
function matchPapiLevel(narrative, score) {
  const levels = narrative?.levels
  if (!levels) return null
  if (Array.isArray(levels)) {
    return levels.find((l) => score >= l.min && score <= l.max) || null
  }
  if (typeof levels === 'object') {
    const key = score <= 3 ? 'low' : score >= 7 ? 'high' : 'medium'
    return {
      label: key.charAt(0).toUpperCase() + key.slice(1),
      description: levels[key] || levels.medium || '',
    }
  }
  return null
}

/** PAPI narratives use levels[] with min/max, or { low, medium, high } object */
function buildPairedInterpretations(test, scores) {
  const result = {}
  const narratives = test.scoringConfig?.interpretations || {}
  const scales = test.scoringConfig?.scales || []

  for (const [dim, score] of Object.entries(scores)) {
    const scale = scales.find(s => s.code === dim)
    const narrative = narratives[dim] || scale
    const matched = matchPapiLevel(narrative, score)
    result[dim] = {
      label: matched?.label || String(score),
      description: matched?.description || narrative?.description || narrative?.name || '',
      level: matched?.label?.toLowerCase?.() || (score <= 3 ? 'low' : score >= 7 ? 'high' : 'medium'),
    }
  }

  return result
}
