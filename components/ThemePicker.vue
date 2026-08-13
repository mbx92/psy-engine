<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <button
      v-for="item in themes"
      :key="item.id"
      type="button"
      class="rounded-control border p-4 text-left transition-colors"
      :class="theme === item.id
        ? 'border-primary bg-accent ring-1 ring-primary'
        : 'border-border hover:bg-accent/40'"
      @click="setTheme(item.id)"
    >
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm font-medium">{{ item.label }}</p>
        <UiBadge v-if="theme === item.id" variant="default" class="text-[10px]">Active</UiBadge>
      </div>
      <p class="text-xs text-muted-foreground mt-2 leading-relaxed">{{ item.description }}</p>
    </button>
  </div>
</template>

<script setup>
const { theme, themes, setTheme } = useDesignTheme()
</script>
