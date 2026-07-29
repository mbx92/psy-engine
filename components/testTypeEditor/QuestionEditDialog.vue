<template>
  <UiDialog :open="open" @update:open="(v) => emit('update:open', v)">
    <UiDialogContent class="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
      <UiDialogHeader>
        <UiDialogTitle>{{ isNew ? 'Add Question' : 'Edit Question' }}</UiDialogTitle>
      </UiDialogHeader>

      <div class="space-y-4">
        <div class="space-y-1">
          <UiLabel class="text-xs">Type</UiLabel>
          <UiSelect :model-value="kind" @update:model-value="changeKind">
            <UiSelectTrigger class="h-9 text-sm">
              <UiSelectValue />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem value="instruction">Instruction block</UiSelectItem>
              <UiSelectItem value="image_choice">Image choice</UiSelectItem>
              <UiSelectItem value="paired_choice">Paired / forced choice</UiSelectItem>
              <UiSelectItem value="simple_choice">Simple choice (text options)</UiSelectItem>
            </UiSelectContent>
          </UiSelect>
        </div>

        <component :is="formComponent" v-model="draft" :subtests="subtests" />
      </div>

      <UiDialogFooter>
        <UiButton type="button" variant="outline" @click="emit('update:open', false)">Cancel</UiButton>
        <UiButton type="button" @click="onSave">Save</UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>

<script setup>
import InstructionQuestionForm from '@/components/testTypeEditor/InstructionQuestionForm.vue'
import ImageChoiceQuestionForm from '@/components/testTypeEditor/ImageChoiceQuestionForm.vue'
import PairedChoiceQuestionForm from '@/components/testTypeEditor/PairedChoiceQuestionForm.vue'
import SimpleChoiceQuestionForm from '@/components/testTypeEditor/SimpleChoiceQuestionForm.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  item: { type: Object, default: null },
  subtests: { type: Array, default: () => [] },
  initialKind: { type: String, default: null },
})
const emit = defineEmits(['update:open', 'save'])

const isNew = computed(() => !props.item)

function kindOf(item) {
  if (!item) return props.initialKind || 'instruction'
  if (item.type === 'instruction') return 'instruction'
  if (item.pair?.A || item.textA !== undefined) return 'paired_choice'
  if (item.imagePath || item.type === 'image_choice' || item.type === 'question') return 'image_choice'
  return 'simple_choice'
}

function blankFor(kind, base = {}) {
  const id = base.id || `q-${Date.now().toString(36)}`
  const common = { id, number: base.number ?? null, subtestKey: base.subtestKey, subtest: base.subtest, text: base.text || '' }
  if (kind === 'instruction') {
    return { ...common, type: 'instruction', title: '', subtitle: '', instruction: '', rules: [], warnings: [], examples: [] }
  }
  if (kind === 'image_choice') {
    return {
      ...common,
      type: 'image_choice',
      imagePath: '',
      options: ['A', 'B', 'C', 'D', 'E'].map((l) => ({ id: `${id}_${l}`, label: l, text: '', value: l })),
      answer: '',
    }
  }
  if (kind === 'paired_choice') {
    return {
      ...common,
      type: 'paired_choice',
      text: base.text || 'Pilih pernyataan yang paling menggambarkan diri Anda',
      pair: { A: { text: '', scale: '' }, B: { text: '', scale: '' } },
      scaleA: '',
      scaleB: '',
      options: [
        { id: `${id}_A`, text: '', label: 'A', value: 'A', dimension: '', weight: 1, pairWith: `${id}_B` },
        { id: `${id}_B`, text: '', label: 'B', value: 'B', dimension: '', weight: 1, pairWith: `${id}_A` },
      ],
    }
  }
  return { ...common, type: 'simple_choice', options: [] }
}

const kind = ref(kindOf(props.item))
const draft = ref(props.item ? structuredClone(toRaw(props.item)) : blankFor(kind.value))

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    kind.value = kindOf(props.item)
    draft.value = props.item ? structuredClone(toRaw(props.item)) : blankFor(kind.value)
  }
})

function changeKind(nextKind) {
  const base = draft.value
  kind.value = nextKind
  draft.value = blankFor(nextKind, base)
}

const formComponent = computed(() => ({
  instruction: InstructionQuestionForm,
  image_choice: ImageChoiceQuestionForm,
  paired_choice: PairedChoiceQuestionForm,
  simple_choice: SimpleChoiceQuestionForm,
}[kind.value]))

function onSave() {
  emit('save', draft.value)
  emit('update:open', false)
}
</script>
