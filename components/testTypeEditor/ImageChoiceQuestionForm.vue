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
      <UiLabel class="text-xs">Question text (optional — image-choice questions usually rely on the image)</UiLabel>
      <UiTextarea v-model="text" class="min-h-9 text-sm py-1.5" rows="1" />
    </div>

    <div class="space-y-1">
      <UiLabel class="text-xs">Image path/URL</UiLabel>
      <UiInput v-model="imagePath" placeholder="/images/cfit/q1.png" class="h-9 text-sm" />
      <img v-if="imagePath" :src="imagePath" alt="Preview" class="max-h-32 rounded-md border bg-white mt-1">
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <UiLabel class="text-xs">Options — pick the correct one</UiLabel>
        <UiButton type="button" variant="outline" size="sm" class="h-7 text-xs" @click="addOption">
          <Icon icon="lucide:plus" class="size-3.5 mr-1" /> Add Option
        </UiButton>
      </div>
      <div v-for="(opt, i) in options" :key="i" class="flex items-center gap-2">
        <input
          type="radio"
          name="correct-answer"
          class="size-4 shrink-0"
          :checked="isCorrect(opt)"
          @change="setCorrect(opt)"
        >
        <UiInput
          :model-value="opt.label"
          placeholder="A"
          class="h-9 text-sm w-14 shrink-0 font-mono text-center"
          @update:model-value="(v) => updateOption(i, { label: v, value: v })"
        />
        <UiInput
          :model-value="opt.text"
          placeholder="Option text (optional)"
          class="h-9 text-sm"
          @update:model-value="(v) => updateOption(i, { text: v })"
        />
        <UiButton type="button" variant="ghost" size="icon" class="h-9 w-9 shrink-0" @click="removeOption(i)">
          <Icon icon="lucide:x" class="size-4" />
        </UiButton>
      </div>
      <p v-if="!options.length" class="text-xs text-muted-foreground">No options yet.</p>
      <p class="text-xs text-muted-foreground">The selected radio marks the correct answer ({{ answer || 'none set' }}).</p>
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
const imagePath = computed({ get: () => props.modelValue.imagePath || '', set: (v) => setKey('imagePath', v) })
const options = computed(() => (Array.isArray(props.modelValue.options) ? props.modelValue.options : []))
const answer = computed(() => props.modelValue.answer || '')

function optionKey(opt) {
  return (opt.label || opt.value || opt.id || '').toString().toUpperCase()
}
function isCorrect(opt) {
  return optionKey(opt) === answer.value.toString().toUpperCase()
}

function updateOption(i, patch) {
  const next = options.value.map((o, idx) => (idx === i ? { ...o, ...patch } : o))
  emit('update:modelValue', { ...props.modelValue, options: next })
}
function addOption() {
  const nextLetter = String.fromCharCode(65 + options.value.length)
  const qid = props.modelValue.id || props.modelValue.number || 'q'
  const next = [...options.value, { id: `${qid}_${nextLetter}`, label: nextLetter, text: '', value: nextLetter }]
  emit('update:modelValue', { ...props.modelValue, options: next })
}
function removeOption(i) {
  const next = [...options.value]
  next.splice(i, 1)
  emit('update:modelValue', { ...props.modelValue, options: next })
}
function setCorrect(opt) {
  const key = optionKey(opt)
  const next = options.value.map((o) => ({ ...o, weight: optionKey(o) === key ? 1 : 0 }))
  emit('update:modelValue', { ...props.modelValue, answer: key, options: next })
}
</script>
