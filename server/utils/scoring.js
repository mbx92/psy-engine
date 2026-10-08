/**
 * Generic scoring engine — processes answers based on test definition
 */
import { isInstructionQuestion } from '~~/utils/question'
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
    if (isInstructionQuestion(q)) continue
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
    if (isInstructionQuestion(q) || !isScoredQuestion(q)) continue
    const selected = answers[q.id] ?? answers[String(q.id)]
    if (selected == null) continue
    answered++

    const key = q.subtestKey || q.subtest || 'total'
    if (subtestScores[key] === undefined) subtestScores[key] = 0
    if (isCorrectChoice(q, selected)) {
      rawScore++
      subtestScores[key]++
    }
  }

  const maxRawScore = test.scoringConfig?.maxRawScore
    || test.questions.filter(q => !isInstructionQuestion(q) && isScoredQuestion(q)).length

  const norms = unwrapIqNorms(context.norms)
  const ageGroup = resolveAgeGroup(
    context.birthDate,
    norms,
    test.scoringConfig?.defaultAgeGroup || '13-9_dewasa',
    context.assessmentDate,
  )
  const { iqScore, classification, normRawScore } = convertRawToIq(rawScore, ageGroup, norms, test.scoringConfig)

  return {
    raw: { rawScore, answered, maxRawScore, ageGroup, ...(normRawScore !== rawScore ? { normRawScore } : {}) },
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

function unwrapIqNorms(norms) {
  if (!norms || typeof norms !== 'object' || Array.isArray(norms)) return null
  const nested = norms.ageGroups
  const source = nested && typeof nested === 'object' && !Array.isArray(nested) ? nested : norms
  const groups = Object.fromEntries(
    Object.entries(source).filter(([, group]) => group && typeof group === 'object' && Number.isFinite(Number(group.ageMonthsStart))),
  )
  return Object.keys(groups).length ? groups : null
}

function isScoredQuestion(q) {
  if (q?.answer != null && String(q.answer).trim() !== '') return true
  return Boolean(q?.options?.some(o => o.weight === 1 || o.isCorrect))
}

function isCorrectChoice(q, selected) {
  const selectedOpt = q.options?.find(o => o.id === selected || String(o.id) === String(selected)
    || o.value === selected || o.label === selected)
  if (q.answer != null && String(q.answer).trim() !== '') {
    const selectedValue = (selectedOpt?.value || selectedOpt?.label || selected || '').toString().toUpperCase()
    return selectedValue === q.answer.toString().toUpperCase()
  }
  const correctOpt = q.options?.find(o => o.weight === 1 || o.isCorrect)
  if (!correctOpt) return false
  return selectedOpt === correctOpt || selected === correctOpt.id || String(selected) === String(correctOpt.id)
}

function resolveAgeGroup(birthDate, norms, defaultAgeGroup = '13-9_dewasa', assessmentDate) {
  if (!birthDate || !norms) throw new Error('IQ norms and participant birth date are required')

  const birth = new Date(birthDate)
  const now = assessmentDate ? new Date(assessmentDate) : new Date()
  if (!Number.isFinite(birth.getTime()) || !Number.isFinite(now.getTime())) throw new Error('Invalid date for IQ norms')

  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months -= 1

  for (const [key, group] of Object.entries(norms)) {
    if (months >= Number(group.ageMonthsStart) && months <= Number(group.ageMonthsEnd)) return key
  }
  if (defaultAgeGroup && norms[defaultAgeGroup]) return defaultAgeGroup
  throw new Error('IQ norms do not cover the participant age')
}

function convertRawToIq(rawScore, ageGroup, norms, scoringConfig = {}) {
  const group = norms?.[ageGroup]
  const table = Array.isArray(group?.norms) ? group.norms.filter(n => n?.iqScore != null && Number.isFinite(Number(n.rawScore))) : []
  if (!table.length) {
    throw new Error(`IQ norms are missing or invalid for the participant age group (${ageGroup || 'unknown'})`)
  }

  const raw = Number(rawScore) || 0
  const exact = table.find(n => Number(n.rawScore) === raw)
  const picked = exact || table.reduce((best, n) => (
    Math.abs(Number(n.rawScore) - raw) < Math.abs(Number(best.rawScore) - raw) ? n : best
  ))

  return {
    iqScore: picked.iqScore,
    classification: picked.classification || classifyIq(picked.iqScore, scoringConfig),
    normRawScore: Number(picked.rawScore),
  }
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
    if (isInstructionQuestion(q)) continue
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
    if (isInstructionQuestion(q)) continue
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
    if (isInstructionQuestion(q)) continue
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
