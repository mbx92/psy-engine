<template>
  <div class="space-y-4">
    <div v-if="!modelValue.length" class="text-sm text-muted-foreground space-y-3">
      <p>No questions yet. EPPS needs a fixed 225-item grid (9 blocks of 5×5 need comparisons) to match the scoring engine and answer-matrix report.</p>
      <UiButton type="button" size="sm" @click="generate">
        <Icon icon="lucide:grid-3x3" class="size-4 mr-1" /> Generate 225-item EPPS grid
      </UiButton>
    </div>

    <template v-else>
      <p class="text-xs text-muted-foreground">
        {{ modelValue.length }} / 225 items · positions (block/row/col) are fixed and cannot be reordered — only edit the two statement texts.
      </p>
      <details v-for="group in groups" :key="group.group" class="rounded-lg border" :open="group.group === 1">
        <summary class="cursor-pointer select-none px-3 py-2 text-sm font-medium">
          Block {{ group.group }} — {{ group.rowLabel.join('/') }} × {{ group.colLabel.join('/') }}
        </summary>
        <div class="p-3 pt-0 space-y-2">
          <div v-for="row in group.rows" :key="row.number" class="grid grid-cols-[3rem_1fr_1fr] gap-2 items-start py-1 border-t first:border-t-0">
            <div class="pt-2 text-xs text-muted-foreground font-mono">
              #{{ row.number }}
              <div class="text-[10px]">{{ row.rowNeed }}/{{ row.colNeed }}</div>
            </div>
            <UiTextarea
              :model-value="row.textA"
              placeholder="Statement A"
              class="min-h-9 text-xs py-1.5"
              rows="1"
              @update:model-value="(v) => updateText(row.number, 'textA', v)"
            />
            <UiTextarea
              :model-value="row.textB"
              placeholder="Statement B"
              class="min-h-9 text-xs py-1.5"
              rows="1"
              @update:model-value="(v) => updateText(row.number, 'textB', v)"
            />
          </div>
        </div>
      </details>
    </template>
  </div>
</template>

<script setup>
import { getBlockMatrix, EPPS_ROW_GROUP_LABELS } from '@/utils/eppsConstants'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

function positionFor(number) {
  for (let g = 1; g <= 9; g++) {
    const rows = getBlockMatrix(g)
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (rows[r][c] === number) return { matrixGroup: g, rowIdx: r + 1, colIdx: c + 1 }
      }
    }
  }
  return null
}

const byNumber = computed(() => {
  const map = new Map()
  for (const q of props.modelValue) {
    const num = Number(q.number ?? q.id)
    if (Number.isFinite(num)) map.set(num, q)
  }
  return map
})

const groups = computed(() => {
  const list = []
  for (let g = 1; g <= 9; g++) {
    const blockRows = getBlockMatrix(g)
    const rowGroupIndex = Math.floor((g - 1) / 3)
    const colGroupIndex = (g - 1) % 3
    const rows = []
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const number = blockRows[r][c]
        const q = byNumber.value.get(number)
        rows.push({
          number,
          rowNeed: EPPS_ROW_GROUP_LABELS[rowGroupIndex][r],
          colNeed: EPPS_ROW_GROUP_LABELS[colGroupIndex][c],
          textA: q?.textA ?? q?.pair?.A?.text ?? '',
          textB: q?.textB ?? q?.pair?.B?.text ?? '',
        })
      }
    }
    rows.sort((a, b) => a.number - b.number)
    list.push({
      group: g,
      rowLabel: EPPS_ROW_GROUP_LABELS[rowGroupIndex],
      colLabel: EPPS_ROW_GROUP_LABELS[colGroupIndex],
      rows,
    })
  }
  return list
})

function generate() {
  const items = []
  for (let g = 1; g <= 9; g++) {
    const blockRows = getBlockMatrix(g)
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const number = blockRows[r][c]
        items.push(buildItem(number, { matrixGroup: g, rowIdx: r + 1, colIdx: c + 1 }, '', ''))
      }
    }
  }
  items.sort((a, b) => a.number - b.number)
  emit('update:modelValue', items)
}

function buildItem(number, position, textA, textB) {
  const id = String(number)
  return {
    id,
    number,
    type: 'paired_choice',
    text: 'Pilih pernyataan yang paling sesuai dengan diri Anda',
    textA,
    textB,
    rowIdx: position.rowIdx,
    colIdx: position.colIdx,
    matrixGroup: position.matrixGroup,
    options: [
      { id: `${id}_A`, text: textA, label: 'A', value: 'A', pairWith: `${id}_B` },
      { id: `${id}_B`, text: textB, label: 'B', value: 'B', pairWith: `${id}_A` },
    ],
  }
}

function updateText(number, key, value) {
  const existing = byNumber.value.get(number)
  const position = existing
    ? { matrixGroup: existing.matrixGroup, rowIdx: existing.rowIdx, colIdx: existing.colIdx }
    : positionFor(number)
  const textA = key === 'textA' ? value : (existing?.textA ?? existing?.pair?.A?.text ?? '')
  const textB = key === 'textB' ? value : (existing?.textB ?? existing?.pair?.B?.text ?? '')
  const nextItem = buildItem(number, position, textA, textB)

  const next = props.modelValue.filter((q) => Number(q.number ?? q.id) !== number)
  next.push(nextItem)
  next.sort((a, b) => Number(a.number ?? a.id) - Number(b.number ?? b.id))
  emit('update:modelValue', next)
}
</script>
