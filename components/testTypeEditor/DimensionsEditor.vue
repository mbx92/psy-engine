<template>
  <div class="space-y-2">
    <div
      v-for="(row, i) in modelValue"
      :key="i"
      class="grid gap-2 items-start"
      :class="showMaxScore ? 'grid-cols-[1fr_1.4fr_2fr_5rem_auto]' : 'grid-cols-[1fr_1.4fr_2fr_auto]'"
    >
      <UiInput
        placeholder="key"
        :model-value="row.key"
        class="h-9 text-sm font-mono"
        @update:model-value="(v) => updateRow(i, 'key', v)"
      />
      <UiInput
        placeholder="Label"
        :model-value="row.label"
        class="h-9 text-sm"
        @update:model-value="(v) => updateRow(i, 'label', v)"
      />
      <UiInput
        placeholder="Description"
        :model-value="row.description"
        class="h-9 text-sm"
        @update:model-value="(v) => updateRow(i, 'description', v)"
      />
      <UiInput
        v-if="showMaxScore"
        type="number"
        placeholder="Max"
        :model-value="row.maxScore"
        class="h-9 text-sm"
        @update:model-value="(v) => updateRow(i, 'maxScore', v === '' ? null : Number(v))"
      />
      <UiButton type="button" variant="ghost" size="icon" class="h-9 w-9 shrink-0" @click="removeRow(i)">
        <Icon icon="lucide:x" class="size-4" />
      </UiButton>
    </div>
    <p v-if="!modelValue.length" class="text-xs text-muted-foreground">No dimensions yet.</p>
    <UiButton type="button" variant="outline" size="sm" @click="addRow">
      <Icon icon="lucide:plus" class="size-4 mr-1" /> Add Dimension
    </UiButton>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  showMaxScore: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

function updateRow(i, key, value) {
  const next = props.modelValue.map((r, idx) => (idx === i ? { ...r, [key]: value } : r))
  emit('update:modelValue', next)
}
function addRow() {
  emit('update:modelValue', [...props.modelValue, { key: '', label: '', description: '', maxScore: null }])
}
function removeRow(i) {
  const next = [...props.modelValue]
  next.splice(i, 1)
  emit('update:modelValue', next)
}
</script>
