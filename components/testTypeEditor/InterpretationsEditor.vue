<template>
  <div class="space-y-2">
    <p v-if="!dimensionKeys.length" class="text-xs text-muted-foreground">Add dimensions above to define score-range interpretations for each.</p>
    <details v-for="key in dimensionKeys" :key="key" class="rounded-lg border">
      <summary class="cursor-pointer select-none px-3 py-2 text-sm font-medium font-mono">{{ key }}</summary>
      <div class="p-3 pt-0">
        <TestTypeEditorRangesEditor
          :model-value="modelValue[key]?.ranges || []"
          @update:model-value="(v) => updateRanges(key, v)"
        />
      </div>
    </details>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  dimensionKeys: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

function updateRanges(key, ranges) {
  emit('update:modelValue', { ...props.modelValue, [key]: { ...props.modelValue[key], ranges } })
}
</script>
