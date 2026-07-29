<template>
  <div class="space-y-2">
    <div v-for="(row, i) in modelValue" :key="i" class="grid grid-cols-[5rem_1fr_2fr_auto] gap-2 items-start">
      <UiInput
        placeholder="Code"
        :model-value="row.code"
        class="h-9 text-sm font-mono"
        @update:model-value="(v) => updateRow(i, 'code', v)"
      />
      <UiInput
        placeholder="Name"
        :model-value="row.name"
        class="h-9 text-sm"
        @update:model-value="(v) => updateRow(i, 'name', v)"
      />
      <UiInput
        placeholder="Description"
        :model-value="row.description"
        class="h-9 text-sm"
        @update:model-value="(v) => updateRow(i, 'description', v)"
      />
      <UiButton type="button" variant="ghost" size="icon" class="h-9 w-9 shrink-0" @click="removeRow(i)">
        <Icon icon="lucide:x" class="size-4" />
      </UiButton>
    </div>
    <p v-if="!modelValue.length" class="text-xs text-muted-foreground">No scales yet.</p>
    <UiButton type="button" variant="outline" size="sm" @click="addRow">
      <Icon icon="lucide:plus" class="size-4 mr-1" /> Add Scale
    </UiButton>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

function updateRow(i, key, value) {
  const next = props.modelValue.map((r, idx) => (idx === i ? { ...r, [key]: value } : r))
  emit('update:modelValue', next)
}
function addRow() {
  emit('update:modelValue', [...props.modelValue, { code: '', name: '', description: '', levels: [] }])
}
function removeRow(i) {
  const next = [...props.modelValue]
  next.splice(i, 1)
  emit('update:modelValue', next)
}
</script>
