<template>
  <div class="text-center py-12 px-4">
    <div class="mx-auto size-12 rounded-control bg-muted flex items-center justify-center mb-3">
      <Icon :icon="icon" class="size-6 text-muted-foreground" />
    </div>
    <p class="text-sm font-medium">{{ title }}</p>
    <p v-if="description" class="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{{ description }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'lucide:inbox' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>
