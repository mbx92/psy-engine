<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div class="space-y-1">
        <UiLabel class="text-xs">Question number</UiLabel>
        <UiInput type="number" v-model="number" class="h-9 text-sm" />
      </div>
      <div v-if="subtests.length" class="space-y-1">
        <UiLabel class="text-xs">Subtest</UiLabel>
        <UiSelect v-model="subtestKey">
          <UiSelectTrigger class="h-9 text-sm">
            <UiSelectValue placeholder="Select subtest" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem v-for="st in subtests" :key="st.key" :value="st.key">{{ st.label || st.key }}</UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>
    </div>

    <div class="space-y-1">
      <UiLabel class="text-xs">Question text</UiLabel>
      <UiTextarea v-model="text" class="min-h-16 text-sm" />
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <UiLabel class="text-xs">Options</UiLabel>
        <UiButton type="button" variant="outline" size="sm" class="h-7 text-xs" @click="addOption">
          <Icon icon="lucide:plus" class="size-3.5 mr-1" /> Add Option
        </UiButton>
      </div>
      <div v-for="(opt, i) in options" :key="i" class="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center">
        <UiInput
          :model-value="opt.text"
          placeholder="Option text"
          class="h-9 text-sm"
          @update:model-value="(v) => updateOption(i, { text: v })"
        />
        <UiInput
          :model-value="opt.dimension"
          placeholder="Dimension"
          class="h-9 text-sm font-mono"
          @update:model-value="(v) => updateOption(i, { dimension: v || null })"
        />
        <UiInput
          type="number"
          :model-value="opt.weight"
          placeholder="Weight"
          class="h-9 text-sm"
          @update:model-value="(v) => updateOption(i, { weight: v === '' ? undefined : Number(v) })"
        />
        <UiButton type="button" variant="ghost" size="icon" class="h-9 w-9 shrink-0" @click="removeOption(i)">
          <Icon icon="lucide:x" class="size-4" />
        </UiButton>
      </div>
      <p v-if="!options.length" class="text-xs text-muted-foreground">No options yet.</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Object, required: true },
  subtests: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

function setKey(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const number = computed({
  get: () => props.modelValue.number ?? '',
  set: (v) => setKey('number', v === '' ? null : Number(v)),
})
const subtestKey = computed({
  get: () => props.modelValue.subtestKey || props.modelValue.subtest || '',
  set: (v) => emit('update:modelValue', { ...props.modelValue, subtestKey: v, subtest: v }),
})
const text = computed({ get: () => props.modelValue.text || '', set: (v) => setKey('text', v) })
const options = computed(() => (Array.isArray(props.modelValue.options) ? props.modelValue.options : []))

function updateOption(i, patch) {
  const next = options.value.map((o, idx) => (idx === i ? { ...o, ...patch } : o))
  emit('update:modelValue', { ...props.modelValue, options: next })
}
function addOption() {
  const qid = props.modelValue.id || props.modelValue.number || 'q'
  const next = [...options.value, { id: `${qid}_${options.value.length + 1}`, text: '', dimension: null, weight: 1 }]
  emit('update:modelValue', { ...props.modelValue, options: next })
}
function removeOption(i) {
  const next = [...options.value]
  next.splice(i, 1)
  emit('update:modelValue', { ...props.modelValue, options: next })
}
</script>
