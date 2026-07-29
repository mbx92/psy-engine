<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <UiButton type="button" variant="ghost" size="sm" class="h-7 text-xs" @click="mode === 'builder' ? showJson() : showBuilder()">
        {{ mode === 'builder' ? 'Advanced: Raw JSON' : 'Back to Builder' }}
      </UiButton>
    </div>

    <div v-if="mode === 'json'" class="space-y-2">
      <UiTextarea v-model="jsonText" class="min-h-60 font-mono text-xs" spellcheck="false" />
      <div class="flex items-center gap-2">
        <UiButton type="button" size="sm" @click="showBuilder">Apply</UiButton>
        <p v-if="jsonError" class="text-xs text-destructive">{{ jsonError }}</p>
      </div>
    </div>

    <template v-else-if="isEppsShape">
      <TestTypeEditorEppsMatrixEditor v-model="items" />
    </template>

    <template v-else>
      <div class="flex items-center justify-between">
        <p class="text-xs text-muted-foreground">{{ items.length }} question{{ items.length === 1 ? '' : 's' }}</p>
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton type="button" size="sm">
              <Icon icon="lucide:plus" class="size-4 mr-1" /> Add Question
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end">
            <UiDropdownMenuItem @click="openNew('instruction')">Instruction block</UiDropdownMenuItem>
            <UiDropdownMenuItem @click="openNew('image_choice')">Image choice</UiDropdownMenuItem>
            <UiDropdownMenuItem @click="openNew('paired_choice')">Paired / forced choice</UiDropdownMenuItem>
            <UiDropdownMenuItem @click="openNew('simple_choice')">Simple choice</UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </div>

      <div v-if="!items.length" class="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
        No questions yet. Add one above.
      </div>

      <div v-for="(q, i) in items" :key="q.id || i" class="flex items-center gap-2 rounded-lg border px-3 py-2">
        <div class="flex flex-col shrink-0">
          <UiButton type="button" variant="ghost" size="icon" class="h-6 w-6" :disabled="i === 0" @click="move(i, -1)">
            <Icon icon="lucide:chevron-up" class="size-3.5" />
          </UiButton>
          <UiButton type="button" variant="ghost" size="icon" class="h-6 w-6" :disabled="i === items.length - 1" @click="move(i, 1)">
            <Icon icon="lucide:chevron-down" class="size-3.5" />
          </UiButton>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-xs text-muted-foreground shrink-0">#{{ i + 1 }}</span>
            <UiBadge variant="secondary" class="text-[10px]">{{ q.type || 'question' }}</UiBadge>
            <UiBadge v-if="q.subtestKey || q.subtest" variant="outline" class="text-[10px]">{{ q.subtestKey || q.subtest }}</UiBadge>
          </div>
          <p class="text-sm truncate mt-0.5">{{ summarize(q) }}</p>
        </div>
        <UiButton type="button" variant="ghost" size="icon" class="h-8 w-8 shrink-0" @click="openEdit(i)">
          <Icon icon="lucide:pencil" class="size-4" />
        </UiButton>
        <UiButton type="button" variant="ghost" size="icon" class="h-8 w-8 shrink-0 text-destructive" @click="remove(i)">
          <Icon icon="lucide:trash-2" class="size-4" />
        </UiButton>
      </div>
    </template>

    <TestTypeEditorQuestionEditDialog
      v-model:open="dialogOpen"
      :item="editingItem"
      :subtests="subtests"
      :initial-kind="newKind"
      @save="onSave"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  subtests: { type: Array, default: () => [] },
  testType: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const items = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const { mode, jsonText, jsonError, showJson, showBuilder } = useJsonBuilderToggle(
  () => props.modelValue,
  (v) => emit('update:modelValue', v),
  { isArray: true },
)

const isEppsShape = computed(() => (
  (props.testType || '').toLowerCase().includes('epps')
  || props.modelValue.some((q) => q.textA !== undefined || q.rowIdx !== undefined)
))

function summarize(q) {
  if (q.type === 'instruction') return q.title || q.instruction || q.text || 'Instruction'
  if (q.pair?.A || q.textA !== undefined) {
    const a = q.pair?.A?.text || q.textA || ''
    const b = q.pair?.B?.text || q.textB || ''
    return `${a.slice(0, 40) || '(A)'} / ${b.slice(0, 40) || '(B)'}`
  }
  if (q.imagePath || q.type === 'image_choice') return `${q.text || 'Image question'} — answer ${q.answer || '—'}`
  return q.text || 'Untitled question'
}

function renumber(list) {
  let n = 1
  return list.map((q) => (q.type === 'instruction' ? q : { ...q, number: n++ }))
}

const dialogOpen = ref(false)
const editingIndex = ref(-1)
const editingItem = ref(null)
const newKind = ref(null)

function openNew(kind) {
  newKind.value = kind
  editingIndex.value = -1
  editingItem.value = null
  dialogOpen.value = true
}
function openEdit(i) {
  newKind.value = null
  editingIndex.value = i
  editingItem.value = items.value[i]
  dialogOpen.value = true
}
function onSave(draft) {
  const next = [...items.value]
  if (editingIndex.value >= 0) {
    next[editingIndex.value] = draft
  } else {
    next.push(draft)
  }
  items.value = renumber(next)
}
function remove(i) {
  const next = [...items.value]
  next.splice(i, 1)
  items.value = renumber(next)
}
function move(i, dir) {
  const next = [...items.value]
  const j = i + dir
  if (j < 0 || j >= next.length) return
  ;[next[i], next[j]] = [next[j], next[i]]
  items.value = renumber(next)
}
</script>
