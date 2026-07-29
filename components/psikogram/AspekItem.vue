<template>
  <div class="border rounded-lg p-3 flex items-start justify-between gap-3">
    <div class="min-w-0">
      <p class="font-medium text-sm">{{ title }}</p>
      <p v-if="description" class="text-xs text-muted-foreground mt-0.5">{{ description }}</p>
    </div>
    <div class="flex gap-1 shrink-0">
      <button
        v-for="r in ratings"
        :key="r.value"
        type="button"
        class="size-8 rounded flex items-center justify-center text-xs font-semibold border transition-colors"
        :class="rating === r.value ? r.activeClass : 'bg-background border-border hover:bg-muted text-muted-foreground'"
        @click="$emit('update:rating', r.value)"
      >
        {{ r.value }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  rating: { type: String, default: '' },
})
defineEmits(['update:rating'])

// R = Rendah, K = Kurang, C = Cukup, B = Baik, T = Tinggi
const ratings = [
  { value: 'R', activeClass: 'bg-red-600 border-red-600 text-white' },
  { value: 'K', activeClass: 'bg-amber-500 border-amber-500 text-white' },
  { value: 'C', activeClass: 'bg-blue-500 border-blue-500 text-white' },
  { value: 'B', activeClass: 'bg-emerald-600 border-emerald-600 text-white' },
  { value: 'T', activeClass: 'bg-primary border-primary text-primary-foreground' },
]
</script>
