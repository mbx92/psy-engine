<template>
  <div class="space-y-3">
    <UiCard v-for="(ex, i) in modelValue" :key="i" class="border-dashed">
      <UiCardContent class="pt-4 space-y-2">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div class="space-y-1">
            <UiLabel class="text-xs">Number</UiLabel>
            <UiInput
              type="number"
              :model-value="ex.number"
              class="h-9 text-sm"
              @update:model-value="(v) => updateRow(i, 'number', v === '' ? null : Number(v))"
            />
          </div>
          <div class="space-y-1">
            <UiLabel class="text-xs">Image path/URL</UiLabel>
            <UiInput
              :model-value="ex.imagePath"
              class="h-9 text-sm"
              @update:model-value="(v) => updateRow(i, 'imagePath', v)"
            />
          </div>
        </div>
        <div class="space-y-1">
          <UiLabel class="text-xs">Description</UiLabel>
          <UiTextarea :model-value="ex.description" class="min-h-9 text-sm py-1.5" rows="1" @update:model-value="(v) => updateRow(i, 'description', v)" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div class="space-y-1">
            <UiLabel class="text-xs">Answer</UiLabel>
            <UiInput :model-value="ex.answer" class="h-9 text-sm" @update:model-value="(v) => updateRow(i, 'answer', v)" />
          </div>
          <div class="space-y-1">
            <UiLabel class="text-xs">Explanation</UiLabel>
            <UiInput :model-value="ex.explanation" class="h-9 text-sm" @update:model-value="(v) => updateRow(i, 'explanation', v)" />
          </div>
        </div>
        <div class="flex justify-end">
          <UiButton type="button" variant="ghost" size="sm" class="text-destructive h-7" @click="removeRow(i)">
            <Icon icon="lucide:trash-2" class="size-3.5 mr-1" /> Remove
          </UiButton>
        </div>
      </UiCardContent>
    </UiCard>
    <p v-if="!modelValue.length" class="text-xs text-muted-foreground">No worked examples yet.</p>
    <UiButton type="button" variant="outline" size="sm" @click="addRow">
      <Icon icon="lucide:plus" class="size-4 mr-1" /> Add Example
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
  emit('update:modelValue', [
    ...props.modelValue,
    { number: props.modelValue.length + 1, imagePath: '', description: '', answer: '', explanation: '' },
  ])
}
function removeRow(i) {
  const next = [...props.modelValue]
  next.splice(i, 1)
  emit('update:modelValue', next)
}
</script>
