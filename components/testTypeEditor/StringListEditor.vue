<template>
  <div class="space-y-2">
    <div v-for="(item, i) in modelValue" :key="i" class="flex gap-2">
      <span class="text-xs text-muted-foreground w-5 shrink-0 pt-2 text-right">{{ i + 1 }}.</span>
      <UiTextarea
        :model-value="item"
        class="min-h-9 text-sm py-1.5"
        rows="1"
        @update:model-value="(v) => updateItem(i, v)"
      />
      <UiButton type="button" variant="ghost" size="icon" class="h-9 w-9 shrink-0" @click="removeItem(i)">
        <Icon icon="lucide:x" class="size-4" />
      </UiButton>
    </div>
    <p v-if="!modelValue.length" class="text-xs text-muted-foreground">No {{ itemLabel }}s yet.</p>
    <UiButton type="button" variant="outline" size="sm" @click="addItem">
      <Icon icon="lucide:plus" class="size-4 mr-1" /> Add {{ itemLabel }}
    </UiButton>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  itemLabel: { type: String, default: 'item' },
})
const emit = defineEmits(['update:modelValue'])

function updateItem(i, v) {
  const next = [...props.modelValue]
  next[i] = v
  emit('update:modelValue', next)
}
function addItem() {
  emit('update:modelValue', [...props.modelValue, ''])
}
function removeItem(i) {
  const next = [...props.modelValue]
  next.splice(i, 1)
  emit('update:modelValue', next)
}
</script>
