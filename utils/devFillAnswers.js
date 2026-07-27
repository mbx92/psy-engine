/**
 * Dev-only helpers to auto-fill test answers (CFIT, PAPI, EPPS, etc.)
 */

function normalizeOptionId(option, questionId, index) {
  if (!option) return null
  if (typeof option === 'string') return `${questionId}_${option}`
  return option.id ?? `${questionId}_${option.value || option.label || index}`
}

function normalizeOptions(question) {
  const raw = question?.options
  if (!Array.isArray(raw) || !raw.length) return []

  return raw.map((o, i) => {
    if (typeof o === 'string') {
      return { id: `${question.id}_${o}`, label: o, text: o, value: o }
    }
    return {
      ...o,
      id: normalizeOptionId(o, question.id, i),
      text: o.text || o.label || o.value || String.fromCharCode(65 + i),
      label: o.label || o.text || o.value,
      value: o.value ?? o.label ?? o.text,
    }
  })
}

/** Resolve answerable question list (skip instructions). */
export function getAnswerableQuestions(questions) {
  return (questions || []).filter((q) => q && q.type !== 'instruction')
}

/**
 * Pick one option id for a question.
 * @param {'first'|'random'|'correct'} mode
 */
export function pickDevAnswer(question, mode = 'first') {
  if (!question || question.type === 'instruction') return null

  let options = question.options
  if (!Array.isArray(options) || !options.length) {
    if (question.pair?.A && question.pair?.B) {
      options = [
        { id: `${question.id}_A`, value: 'A', label: 'A', weight: 1 },
        { id: `${question.id}_B`, value: 'B', label: 'B', weight: 1 },
      ]
    } else if (question.textA && question.textB) {
      options = [
        { id: `${question.id}_A`, value: 'A', label: 'A' },
        { id: `${question.id}_B`, value: 'B', label: 'B' },
      ]
    } else {
      return null
    }
  } else {
    options = normalizeOptions(question)
  }

  if (!options.length) return null

  if (mode === 'correct') {
    if (question.answer != null && question.answer !== '') {
      const target = question.answer.toString().toUpperCase()
      const match = options.find((o) => {
        const v = (o.value ?? o.label ?? o.text ?? '').toString().toUpperCase()
        return v === target
      })
      if (match) return match.id
    }
    const weighted = options.find((o) => o.weight === 1 || o.isCorrect === true)
    if (weighted) return weighted.id
    // Personality / forced-choice (EPPS, PAPI): no keyed answer → randomize
    return options[Math.floor(Math.random() * options.length)].id
  }

  if (mode === 'random') {
    return options[Math.floor(Math.random() * options.length)].id
  }

  return options[0].id
}

/** Build a full answers map for all answerable questions. */
export function buildDevAnswers(questions, mode = 'first') {
  const answers = {}
  for (const q of getAnswerableQuestions(questions)) {
    const optionId = pickDevAnswer(q, mode)
    if (optionId != null) answers[q.id] = optionId
  }
  return answers
}

/** Merge dev answers into an existing answers object (only fills gaps unless overwrite). */
export function mergeDevAnswers(existing, questions, mode = 'first', { overwrite = false } = {}) {
  const built = buildDevAnswers(questions, mode)
  const next = { ...existing }
  for (const [qid, optionId] of Object.entries(built)) {
    if (overwrite || next[qid] == null) next[qid] = optionId
  }
  return next
}
