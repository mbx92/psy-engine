<template>
  <label class="flex items-center justify-between gap-2 text-sm rounded-md border px-3 py-2">
    <span>{{ label }}</span>
    <UiSwitch :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" />
  </label>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, required: true },
})
defineEmits(['update:modelValue'])
</script>
