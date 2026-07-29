<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <UiButton type="button" variant="ghost" size="sm" class="h-7 text-xs" @click="mode === 'builder' ? showJson() : showBuilder()">
        {{ mode === 'builder' ? 'Advanced: Raw JSON' : 'Back to Builder' }}
      </UiButton>
    </div>

    <div v-if="mode === 'json'" class="space-y-2">
      <UiTextarea v-model="jsonText" class="min-h-40 font-mono text-xs" spellcheck="false" />
      <div class="flex items-center gap-2">
        <UiButton type="button" size="sm" @click="showBuilder">Apply</UiButton>
        <p v-if="jsonError" class="text-xs text-destructive">{{ jsonError }}</p>
      </div>
    </div>

    <div v-else class="space-y-5">
      <div class="space-y-1 max-w-xs">
        <UiLabel class="text-xs">Algorithm</UiLabel>
        <UiSelect v-model="algorithm">
          <UiSelectTrigger class="h-9 text-sm">
            <UiSelectValue placeholder="Select algorithm" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem value="correct_count">Correct count (simple aptitude)</UiSelectItem>
            <UiSelectItem value="raw_to_iq">Raw → IQ (age-normed, CFIT-style)</UiSelectItem>
            <UiSelectItem value="dimension_sum">Dimension sum (0–100 normalized)</UiSelectItem>
            <UiSelectItem value="paired_choice">Paired choice (PAPI-style)</UiSelectItem>
            <UiSelectItem value="likert_average">Likert average</UiSelectItem>
            <UiSelectItem value="epps_matrix">EPPS matrix (BB/BJ/BD/BH/S)</UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>

      <template v-if="algorithm === 'raw_to_iq'">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1">
            <UiLabel class="text-xs">Max raw score</UiLabel>
            <UiInput type="number" v-model="maxRawScore" class="h-9 text-sm" />
          </div>
          <div class="space-y-1">
            <UiLabel class="text-xs">Default age group</UiLabel>
            <UiInput v-model="defaultAgeGroup" placeholder="e.g. 13-9_dewasa" class="h-9 text-sm font-mono" />
          </div>
        </div>
        <label class="flex items-center justify-between gap-2 text-sm rounded-md border px-3 py-2 max-w-xs">
          <span>Use age-based norms (Test Type Norms table)</span>
          <UiSwitch v-model="ageBasedNorms" />
        </label>

        <div class="space-y-2">
          <UiLabel class="text-xs">Subtest / dimension catalog</UiLabel>
          <TestTypeEditorDimensionsEditor v-model="dimensions" :show-max-score="true" />
        </div>

        <div class="space-y-2">
          <UiLabel class="text-xs">Classification ranges (IQ → label)</UiLabel>
          <TestTypeEditorRangesEditor v-model="classificationRanges" />
        </div>
      </template>

      <template v-else-if="algorithm === 'paired_choice'">
        <div class="space-y-1 max-w-xs">
          <UiLabel class="text-xs">Question count</UiLabel>
          <UiInput type="number" v-model="questionCount" class="h-9 text-sm" />
        </div>
        <div class="space-y-2">
          <UiLabel class="text-xs">Scales</UiLabel>
          <TestTypeEditorScalesEditor v-model="scales" />
        </div>
        <div class="space-y-2">
          <UiLabel class="text-xs">Score narratives</UiLabel>
          <TestTypeEditorPairedInterpretationsEditor v-model="interpretations" :scale-codes="scaleCodes" />
        </div>
      </template>

      <template v-else-if="algorithm === 'epps_matrix'">
        <p class="text-xs text-muted-foreground">
          EPPS scoring uses a fixed set of 15 needs and BB/BJ/BD/BH/S consistency checks derived from question position — these rarely need editing.
        </p>
        <div class="flex flex-wrap gap-1.5">
          <UiBadge v-for="n in needs" :key="n" variant="secondary" class="text-[10px] font-mono">{{ n }}</UiBadge>
        </div>
        <UiButton type="button" variant="outline" size="sm" @click="resetEpps">
          <Icon icon="lucide:rotate-ccw" class="size-3.5 mr-1" /> Reset to standard EPPS scoring config
        </UiButton>
      </template>

      <template v-else>
        <div class="space-y-2">
          <UiLabel class="text-xs">Dimensions</UiLabel>
          <TestTypeEditorDimensionsEditor v-model="dimensions" />
        </div>
        <div class="space-y-2">
          <UiLabel class="text-xs">Interpretations (score ranges per dimension)</UiLabel>
          <TestTypeEditorInterpretationsEditor v-model="interpretations" :dimension-keys="dimensionKeys" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { EPPS_NEEDS, EPPS_NEED_LABELS } from '@/utils/eppsConstants'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue'])

function setKey(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const { mode, jsonText, jsonError, showJson, showBuilder } = useJsonBuilderToggle(
  () => props.modelValue,
  (v) => emit('update:modelValue', v),
)

const algorithm = computed({
  get: () => props.modelValue.algorithm || 'correct_count',
  set: (v) => setKey('algorithm', v),
})
const dimensions = computed({
  get: () => (Array.isArray(props.modelValue.dimensions) ? props.modelValue.dimensions : []),
  set: (v) => setKey('dimensions', v),
})
const dimensionKeys = computed(() => dimensions.value.map((d) => d.key).filter(Boolean))
const interpretations = computed({
  get: () => props.modelValue.interpretations || {},
  set: (v) => setKey('interpretations', v),
})
const maxRawScore = computed({
  get: () => props.modelValue.maxRawScore ?? '',
  set: (v) => setKey('maxRawScore', v === '' ? null : Number(v)),
})
const defaultAgeGroup = computed({
  get: () => props.modelValue.defaultAgeGroup || '',
  set: (v) => setKey('defaultAgeGroup', v),
})
const ageBasedNorms = computed({
  get: () => !!props.modelValue.ageBasedNorms,
  set: (v) => setKey('ageBasedNorms', v),
})
const classificationRanges = computed({
  get: () => (Array.isArray(props.modelValue.classificationRanges) ? props.modelValue.classificationRanges : []),
  set: (v) => setKey('classificationRanges', v),
})
const questionCount = computed({
  get: () => props.modelValue.questionCount ?? '',
  set: (v) => setKey('questionCount', v === '' ? null : Number(v)),
})
const scales = computed({
  get: () => (Array.isArray(props.modelValue.scales) ? props.modelValue.scales : []),
  set: (v) => setKey('scales', v),
})
const scaleCodes = computed(() => scales.value.map((s) => s.code).filter(Boolean))
const needs = computed(() => (Array.isArray(props.modelValue.needs) ? props.modelValue.needs : EPPS_NEEDS))

function resetEpps() {
  emit('update:modelValue', {
    ...props.modelValue,
    algorithm: 'epps_matrix',
    needs: [...EPPS_NEEDS],
    consistency: ['BD', 'BH', 'S'],
    dimensions: EPPS_NEEDS.map((key) => ({ key, label: EPPS_NEED_LABELS[key], maxScore: 15 })),
  })
}
</script>
