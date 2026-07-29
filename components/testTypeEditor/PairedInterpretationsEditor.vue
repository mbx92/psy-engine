<template>
  <div class="space-y-2">
    <p v-if="!scaleCodes.length" class="text-xs text-muted-foreground">Add scales above to write score narratives for each.</p>
    <details v-for="code in scaleCodes" :key="code" class="rounded-lg border">
      <summary class="cursor-pointer select-none px-3 py-2 text-sm font-medium font-mono">{{ code }}</summary>
      <div class="p-3 pt-0 space-y-3">
        <div class="flex gap-1.5">
          <UiButton
            type="button"
            size="sm"
            :variant="modeFor(code) === 'levels' ? 'default' : 'outline'"
            class="h-7 text-xs"
            @click="setMode(code, 'levels')"
          >
            Low / Medium / High
          </UiButton>
          <UiButton
            type="button"
            size="sm"
            :variant="modeFor(code) === 'ranges' ? 'default' : 'outline'"
            class="h-7 text-xs"
            @click="setMode(code, 'ranges')"
          >
            Score ranges
          </UiButton>
        </div>

        <template v-if="modeFor(code) === 'levels'">
          <div class="space-y-2">
            <div v-for="band in ['low', 'medium', 'high']" :key="band" class="space-y-1">
              <UiLabel class="text-xs capitalize">{{ band }}</UiLabel>
              <UiTextarea
                :model-value="entryFor(code).levels?.[band] || ''"
                class="min-h-9 text-sm py-1.5"
                rows="1"
                @update:model-value="(v) => updateLevel(code, band, v)"
              />
            </div>
          </div>
        </template>
        <template v-else>
          <TestTypeEditorRangesEditor
            :model-value="Array.isArray(entryFor(code).levels) ? entryFor(code).levels : []"
            @update:model-value="(v) => updateRanges(code, v)"
          />
        </template>
      </div>
    </details>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  scaleCodes: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

function entryFor(code) {
  return props.modelValue[code] || {}
}
function modeFor(code) {
  return Array.isArray(entryFor(code).levels) ? 'ranges' : 'levels'
}
function setMode(code, mode) {
  const entry = entryFor(code)
  const levels = mode === 'ranges' ? [] : { low: '', medium: '', high: '' }
  emit('update:modelValue', { ...props.modelValue, [code]: { ...entry, levels } })
}
function updateLevel(code, band, value) {
  const entry = entryFor(code)
  const levels = { ...(entry.levels && !Array.isArray(entry.levels) ? entry.levels : {}), [band]: value }
  emit('update:modelValue', { ...props.modelValue, [code]: { ...entry, levels } })
}
function updateRanges(code, ranges) {
  const entry = entryFor(code)
  emit('update:modelValue', { ...props.modelValue, [code]: { ...entry, levels: ranges } })
}
</script>
