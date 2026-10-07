const INSTRUCTION_TYPES = new Set(['instruction', 'intro', 'petunjuk'])

function nestedContent(q) {
  return q?.content && typeof q.content === 'object' && !Array.isArray(q.content) ? q.content : {}
}

/**
 * Flatten instruction copy from either the top-level fields or a nested
 * `content` object (legacy CFIT exports).
 */
export function instructionDisplayFields(q) {
  const content = nestedContent(q)
  const examples = Array.isArray(q?.examples) && q.examples.length
    ? q.examples
    : (Array.isArray(content.examples) ? content.examples : [])
  const rules = Array.isArray(q?.rules) && q.rules.length ? q.rules : (content.rules || [])
  const warnings = Array.isArray(q?.warnings) && q.warnings.length ? q.warnings : (content.warnings || [])
  return {
    title: q?.title || content.title || '',
    subtitle: q?.subtitle || content.subtitle || '',
    instruction: String(q?.instruction || content.intro || content.instruction || '').trim(),
    timeLimit: q?.timeLimit ?? content.timeLimit ?? null,
    rules: Array.isArray(rules) ? rules : [],
    warnings: Array.isArray(warnings) ? warnings : [],
    examples,
    imagePath: q?.imagePath || content.imagePath || '',
  }
}

/**
 * CFIT (and similar) instruction screens are often stored as type "question"
 * with examples/title/instruction and no scored answer. Treat those as
 * instructions so participants are not asked to answer them.
 */
export function isInstructionQuestion(q) {
  if (!q || typeof q !== 'object') return false
  const type = String(q.type || '').toLowerCase()
  if (INSTRUCTION_TYPES.has(type)) return true
  if (q.isInstruction === true || q.instructionOnly === true) return true
  const display = instructionDisplayFields(q)
  if (display.examples.length > 0) return true
  const id = String(q.id || '').toLowerCase()
  if (/(instruk|petunjuk|intro|contoh)/.test(id)) return true
  const hasCopy = !!(display.instruction || display.rules.length || display.warnings.length || display.title)
  const scored = !!(q.answer || q.pair || q.textA || q.textB)
  return hasCopy && !scored
}

export function isAnswerableQuestion(q) {
  return !!q && !isInstructionQuestion(q)
}
