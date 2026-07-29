<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div class="space-y-1">
        <UiLabel class="text-xs">Question number</UiLabel>
        <UiInput type="number" v-model="number" class="h-9 text-sm" />
      </div>
      <div class="space-y-1">
        <UiLabel class="text-xs">Prompt text</UiLabel>
        <UiInput v-model="text" class="h-9 text-sm" />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <UiCard class="border-dashed">
        <UiCardContent class="pt-4 space-y-2">
          <p class="text-xs font-medium text-muted-foreground">Statement A</p>
          <UiTextarea v-model="statementA" class="min-h-16 text-sm" placeholder="Statement text" />
          <div class="space-y-1">
            <UiLabel class="text-xs">Dimension / scale code</UiLabel>
            <UiInput v-model="scaleA" placeholder="e.g. G" class="h-9 text-sm font-mono" />
          </div>
        </UiCardContent>
      </UiCard>
      <UiCard class="border-dashed">
        <UiCardContent class="pt-4 space-y-2">
          <p class="text-xs font-medium text-muted-foreground">Statement B</p>
          <UiTextarea v-model="statementB" class="min-h-16 text-sm" placeholder="Statement text" />
          <div class="space-y-1">
            <UiLabel class="text-xs">Dimension / scale code</UiLabel>
            <UiInput v-model="scaleB" placeholder="e.g. E" class="h-9 text-sm font-mono" />
          </div>
        </UiCardContent>
      </UiCard>
    </div>

    <div class="space-y-1 max-w-xs">
      <UiLabel class="text-xs">Weight (per statement chosen)</UiLabel>
      <UiInput type="number" v-model="weight" class="h-9 text-sm" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Object, required: true },
})
const emit = defineEmits(['update:modelValue'])

const optA = computed(() => props.modelValue.options?.[0] || {})
const optB = computed(() => props.modelValue.options?.[1] || {})

const number = computed({
  get: () => props.modelValue.number ?? '',
  set: (v) => emit('update:modelValue', { ...props.modelValue, number: v === '' ? null : Number(v) }),
})
const text = computed({
  get: () => props.modelValue.text || '',
  set: (v) => emit('update:modelValue', { ...props.modelValue, text: v }),
})
const statementA = computed({
  get: () => props.modelValue.pair?.A?.text ?? optA.value.text ?? '',
  set: (v) => rebuild({ textA: v }),
})
const statementB = computed({
  get: () => props.modelValue.pair?.B?.text ?? optB.value.text ?? '',
  set: (v) => rebuild({ textB: v }),
})
const scaleA = computed({
  get: () => props.modelValue.scaleA ?? props.modelValue.pair?.A?.scale ?? optA.value.dimension ?? '',
  set: (v) => rebuild({ scaleA: v }),
})
const scaleB = computed({
  get: () => props.modelValue.scaleB ?? props.modelValue.pair?.B?.scale ?? optB.value.dimension ?? '',
  set: (v) => rebuild({ scaleB: v }),
})
const weight = computed({
  get: () => optA.value.weight ?? 1,
  set: (v) => rebuild({ weight: v === '' ? 1 : Number(v) }),
})

function rebuild(patch) {
  const id = props.modelValue.id || props.modelValue.number || 'q'
  const textA = patch.textA ?? statementA.value
  const textB = patch.textB ?? statementB.value
  const scaleAVal = patch.scaleA ?? scaleA.value
  const scaleBVal = patch.scaleB ?? scaleB.value
  const w = patch.weight ?? weight.value

  emit('update:modelValue', {
    ...props.modelValue,
    pair: { A: { text: textA, scale: scaleAVal }, B: { text: textB, scale: scaleBVal } },
    scaleA: scaleAVal,
    scaleB: scaleBVal,
    options: [
      { id: `${id}_A`, text: textA, label: 'A', value: 'A', dimension: scaleAVal, weight: w, pairWith: `${id}_B` },
      { id: `${id}_B`, text: textB, label: 'B', value: 'B', dimension: scaleBVal, weight: w, pairWith: `${id}_A` },
    ],
  })
}
</script>
