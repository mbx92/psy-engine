<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div class="space-y-1">
        <UiLabel class="text-xs">Title</UiLabel>
        <UiInput v-model="title" class="h-9 text-sm" />
      </div>
      <div class="space-y-1">
        <UiLabel class="text-xs">Subtitle</UiLabel>
        <UiInput v-model="subtitle" class="h-9 text-sm" />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      <div class="space-y-1">
        <UiLabel class="text-xs">Time limit (seconds, optional)</UiLabel>
        <UiInput type="number" v-model="timeLimit" placeholder="Inherit from subtest" class="h-9 text-sm" />
      </div>
    </div>

    <div class="space-y-1">
      <UiLabel class="text-xs">Instruction text</UiLabel>
      <UiTextarea v-model="instruction" class="min-h-24 text-sm" />
    </div>

    <div class="space-y-2">
      <UiLabel class="text-xs">Rules</UiLabel>
      <TestTypeEditorStringListEditor v-model="rules" item-label="rule" />
    </div>

    <div class="space-y-2">
      <UiLabel class="text-xs">Warnings</UiLabel>
      <TestTypeEditorStringListEditor v-model="warnings" item-label="warning" />
    </div>

    <div class="space-y-2">
      <UiLabel class="text-xs">Worked examples</UiLabel>
      <TestTypeEditorExamplesEditor v-model="examples" />
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

const title = computed({ get: () => props.modelValue.title || '', set: (v) => setKey('title', v) })
const subtitle = computed({ get: () => props.modelValue.subtitle || '', set: (v) => setKey('subtitle', v) })
const subtestKey = computed({
  get: () => props.modelValue.subtestKey || props.modelValue.subtest || '',
  set: (v) => emit('update:modelValue', { ...props.modelValue, subtestKey: v, subtest: v }),
})
const timeLimit = computed({
  get: () => props.modelValue.timeLimit ?? '',
  set: (v) => setKey('timeLimit', v === '' ? null : Number(v)),
})
const instruction = computed({
  get: () => props.modelValue.instruction || props.modelValue.text || '',
  set: (v) => emit('update:modelValue', { ...props.modelValue, instruction: v, text: v }),
})
const rules = computed({
  get: () => (Array.isArray(props.modelValue.rules) ? props.modelValue.rules : []),
  set: (v) => setKey('rules', v),
})
const warnings = computed({
  get: () => (Array.isArray(props.modelValue.warnings) ? props.modelValue.warnings : []),
  set: (v) => setKey('warnings', v),
})
const examples = computed({
  get: () => (Array.isArray(props.modelValue.examples) ? props.modelValue.examples : []),
  set: (v) => setKey('examples', v),
})
</script>
