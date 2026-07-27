import { getEppsCategory } from './eppsThresholds.js'
import {
  EPPS_NEEDS,
  EPPS_NEED_LABELS,
  EPPS_INDEX_TO_NEED,
  EPPS_ROW_GROUP_LABELS,
  EPPS_EXCLUDED_DIAGONAL,
  getBlockMatrix,
} from '~~/utils/eppsConstants'

export { EPPS_NEEDS, EPPS_NEED_LABELS, EPPS_INDEX_TO_NEED, getBlockMatrix }

const NEED_DISPLAY = {
  Ach: 'ach', Def: 'def', Ord: 'ord', Exh: 'exh', Aut: 'aut',
  Aff: 'aff', Int: 'int', Suc: 'suc', Dom: 'dom', Aba: 'aba',
  Nur: 'nur', Chg: 'chg', End: 'end', Het: 'het', Agg: 'agg',
}

function normalizeAnswer(value) {
  if (value == null) return null
  if (typeof value === 'object' && value.answer != null) return normalizeAnswer(value.answer)
  if (typeof value === 'number') return value === 1 ? 'A' : value === 2 ? 'B' : null
  const s = String(value).trim().toUpperCase()
  if (s === 'A' || s === '1') return 'A'
  if (s === 'B' || s === '2') return 'B'
  // option id ending in _A or _B
  if (s.endsWith('_A')) return 'A'
  if (s.endsWith('_B')) return 'B'
  return null
}

function extractChoice(answers, questionId, options = []) {
  const raw = answers[questionId] ?? answers[String(questionId)]
  const direct = normalizeAnswer(raw)
  if (direct) return direct
  if (!raw || !options.length) return null
  const opt = options.find((o) => o.id === raw)
  if (!opt) return null
  const v = (opt.value || opt.label || '').toString().toUpperCase()
  return v === 'A' || v === 'B' ? v : null
}

function getRowGroupRowQuestions(groupIndex, rowIndex) {
  const blocks = [groupIndex * 3 + 1, groupIndex * 3 + 2, groupIndex * 3 + 3]
  return blocks.flatMap((b) => getBlockMatrix(b)[rowIndex] || [])
}

function getColumnGroupColumnQuestions(colGroupIndex, colIndex) {
  const blocks = [1 + colGroupIndex, 4 + colGroupIndex, 7 + colGroupIndex]
  return blocks.flatMap((b) => getBlockMatrix(b).map((row) => row[colIndex]).filter((v) => v != null))
}

function countAnswers(answerMap, questionNumbers, target) {
  return questionNumbers
    .filter((q) => !EPPS_EXCLUDED_DIAGONAL.has(q))
    .reduce((sum, q) => sum + (answerMap[q] === target ? 1 : 0), 0)
}

function computeBD(bj) {
  return bj / 2
}

function computeBH(bb, bd) {
  return bb + bd
}

function resolveSex(gender) {
  if (gender === 'L' || gender === 'l' || gender === 'male') return 'L'
  return 'P'
}

function levelFromCategory(category) {
  if (!category) return 'medium'
  if (/\+ \+ \+|\+ \+|\+/.test(category) && !/^\+?$/.test(category.trim())) return 'high'
  if (/\- \- \-|\- \-|\-/.test(category)) return 'low'
  return 'medium'
}

/**
 * Score EPPS using matrix layout (BB/BJ/BD/BH/S) + raw need tallies.
 */
export function scoreEppsMatrix(test, answers, context = {}) {
  const questions = test.questions || []
  const questionMap = new Map(questions.map((q) => [String(q.id), q]))

  // Answer map keyed by question number (1-225)
  const answerMap = {}
  for (const [qId, val] of Object.entries(answers || {})) {
    const q = questionMap.get(String(qId))
    const num = Number(q?.number ?? q?.id ?? qId)
    answerMap[num] = extractChoice(answers, qId, q?.options)
  }

  // Raw matrix tally: A → row need, B → col need
  const rawNeeds = Object.fromEntries(EPPS_NEEDS.map((n) => [n, 0]))
  for (const q of questions) {
    if (q.type === 'instruction') continue
    const num = Number(q.number ?? q.id)
    const choice = answerMap[num]
    if (!choice) continue
    const needA = EPPS_INDEX_TO_NEED[q.rowIdx]
    const needB = EPPS_INDEX_TO_NEED[q.colIdx]
    if (choice === 'A' && needA) rawNeeds[needA]++
    if (choice === 'B' && needB) rawNeeds[needB]++
  }

  const sex = resolveSex(context.gender ?? context.participantGender)
  const needs = []

  for (let gi = 0; gi < EPPS_ROW_GROUP_LABELS.length; gi++) {
    for (let ri = 0; ri < 5; ri++) {
      const label = EPPS_ROW_GROUP_LABELS[gi][ri]
      const key = NEED_DISPLAY[label]
      const bb = countAnswers(answerMap, getRowGroupRowQuestions(gi, ri), 'A')
      const bj = countAnswers(answerMap, getColumnGroupColumnQuestions(gi, ri), 'B')
      const bd = computeBD(bj)
      const bh = computeBH(bb, bd)
      const s = bd + bh
      const category = getEppsCategory(sex, key, s)
      needs.push({
        key,
        label: EPPS_NEED_LABELS[key] || label,
        bb,
        bj,
        bd,
        bh,
        s,
        raw: rawNeeds[key] ?? 0,
        category: category || '—',
        level: levelFromCategory(category),
      })
    }
  }

  const totalS = needs.reduce((sum, n) => sum + n.s, 0)
  const rawTotal = Object.values(rawNeeds).reduce((sum, n) => sum + n, 0)
  const totalAnswered = Object.values(answerMap).filter(Boolean).length
  const consistency = {
    BD: needs.reduce((sum, n) => sum + n.bd, 0),
    BH: needs.reduce((sum, n) => sum + n.bh, 0),
    S: totalS,
    rawTotal,
    answered: totalAnswered,
    expectedTotal: 225,
    valid: totalAnswered === 225 && rawTotal === 225,
  }

  const dimensions = Object.fromEntries(needs.map((n) => [n.key, n.s]))
  const interpretation = {}
  for (const n of needs) {
    interpretation[n.key] = {
      label: n.category,
      description: `BB ${n.bb} · BJ ${n.bj} · BD ${n.bd} · BH ${n.bh} · S ${n.s}`,
      level: n.level,
    }
  }

  const sorted = [...needs].sort((a, b) => b.s - a.s)

  return {
    raw: {
      needs: rawNeeds,
      matrix: needs.map(({ key, bb, bj, bd, bh, s, raw }) => ({ key, bb, bj, bd, bh, s, raw })),
      consistency,
    },
    dimensions,
    interpretation,
    profile: {
      top5: sorted.slice(0, 5).map((n) => n.key),
      low5: sorted.slice(-5).reverse().map((n) => n.key),
    },
  }
}
