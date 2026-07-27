export const EPPS_NEEDS = [
  'ach', 'def', 'ord', 'exh', 'aut',
  'aff', 'int', 'suc', 'dom', 'aba',
  'nur', 'chg', 'end', 'het', 'agg',
]

export const EPPS_NEED_LABELS = {
  ach: 'Achievement',
  def: 'Deference',
  ord: 'Order',
  exh: 'Exhibition',
  aut: 'Autonomy',
  aff: 'Affiliation',
  int: 'Intraception',
  suc: 'Succorance',
  dom: 'Dominance',
  aba: 'Abasement',
  nur: 'Nurturance',
  chg: 'Change',
  end: 'Endurance',
  het: 'Heterosexuality',
  agg: 'Aggression',
}

/** Short display codes (Ach, Def, …) */
export const EPPS_NEED_CODES = {
  ach: 'Ach', def: 'Def', ord: 'Ord', exh: 'Exh', aut: 'Aut',
  aff: 'Aff', int: 'Int', suc: 'Suc', dom: 'Dom', aba: 'Aba',
  nur: 'Nur', chg: 'Chg', end: 'End', het: 'Het', agg: 'Agg',
}

export const EPPS_INDEX_TO_NEED = {
  1: 'ach', 2: 'def', 3: 'ord', 4: 'exh', 5: 'aut',
  6: 'aff', 7: 'int', 8: 'suc', 9: 'dom', 10: 'aba',
  11: 'nur', 12: 'chg', 13: 'end', 14: 'het', 15: 'agg',
}

/** Row/col group labels for the 9×(5×5) EPPS answer matrix (from legacy system). */
export const EPPS_ROW_GROUP_LABELS = [
  ['Ach', 'Def', 'Ord', 'Exh', 'Aut'],
  ['Aff', 'Int', 'Suc', 'Dom', 'Aba'],
  ['Nur', 'Chg', 'End', 'Het', 'Agg'],
]

/** Build 5×5 block matrix of question numbers (1–225). Blocks 1–9. */
export function getBlockMatrix(blockNumber) {
  const normalizedBlock = blockNumber - 1
  const rowGroupIndex = Math.floor(normalizedBlock / 3)
  const colGroupIndex = normalizedBlock % 3
  const colStart = colGroupIndex * 5 + 1
  const rows = []
  for (let rowOffset = 0; rowOffset < 5; rowOffset++) {
    const rowInGroup = rowOffset + 1
    const rowCells = []
    for (let colOffset = 0; colOffset < 5; colOffset++) {
      const colIdx = colStart + colOffset
      rowCells.push(rowGroupIndex * 75 + (colIdx - 1) * 5 + rowInGroup)
    }
    rows.push(rowCells)
  }
  return rows
}

function getBlockDiagonalQuestions(blockNumber) {
  const m = getBlockMatrix(blockNumber)
  return [0, 1, 2, 3, 4].map((i) => m[i]?.[i]).filter(Boolean)
}

/** Consistency diagonals excluded from BB/BJ (blocks 1, 5, 9). */
export const EPPS_EXCLUDED_DIAGONAL = new Set(
  [1, 5, 9].flatMap((b) => getBlockDiagonalQuestions(b)),
)

function normalizeEppsChoice(value) {
  if (value == null) return null
  if (typeof value === 'object' && value.answer != null) return normalizeEppsChoice(value.answer)
  if (typeof value === 'number') return value === 1 ? 'A' : value === 2 ? 'B' : null
  const s = String(value).trim().toUpperCase()
  if (s === 'A' || s === '1') return 'A'
  if (s === 'B' || s === '2') return 'B'
  if (s.endsWith('_A')) return 'A'
  if (s.endsWith('_B')) return 'B'
  return null
}

/**
 * Build 9 answer matrices (5×5) from session answers — legacy EPPS sheet layout.
 * @returns {{ block: number, rowLabels: string[], colLabels: string[], cells: { q: number, choice: string|null, diagonal: boolean }[][] }[]}
 */
export function buildEppsAnswerBlocks(session) {
  const questions = session?.testType?.questions || []
  const answers = session?.answers || {}
  const byNumber = new Map()

  for (const q of questions) {
    if (q.type === 'instruction') continue
    const num = Number(q.number ?? q.id)
    if (!Number.isFinite(num)) continue
    const raw = answers[q.id] ?? answers[String(q.id)] ?? answers[num] ?? answers[String(num)]
    let choice = normalizeEppsChoice(raw)
    if (!choice && raw != null && q.options?.length) {
      const opt = q.options.find((o) => o.id === raw)
      choice = normalizeEppsChoice(opt?.value || opt?.label || opt?.id)
    }
    byNumber.set(num, choice)
  }

  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((block) => {
    const rowGroupIndex = Math.floor((block - 1) / 3)
    const colGroupIndex = (block - 1) % 3
    const numbers = getBlockMatrix(block)
    return {
      block,
      rowLabels: EPPS_ROW_GROUP_LABELS[rowGroupIndex],
      colLabels: EPPS_ROW_GROUP_LABELS[colGroupIndex],
      cells: numbers.map((row, ri) =>
        row.map((q, ci) => ({
          q,
          choice: byNumber.get(q) || null,
          diagonal: ri === ci && EPPS_EXCLUDED_DIAGONAL.has(q),
        })),
      ),
    }
  })
}
