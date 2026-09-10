<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" role="group" aria-label="Design theme">
    <button
      v-for="item in themes"
      :key="item.id"
      type="button"
      class="min-w-0 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
      :aria-pressed="theme === item.id"
      :class="theme === item.id
        ? 'border-primary bg-accent ring-1 ring-primary'
        : 'border-border hover:bg-accent/40'"
      @click="setTheme(item.id)"
    >
      <ThemePreview :theme="item.id" />
      <div class="mt-4 flex items-center justify-between gap-2">
        <p class="text-sm font-medium">{{ item.label }}</p>
        <UiBadge v-if="theme === item.id" variant="default" class="text-[10px]">Active</UiBadge>
      </div>
      <p class="text-xs text-muted-foreground mt-2 leading-relaxed">{{ item.description }}</p>
    </button>
  </div>
  <p class="mt-4 text-xs text-muted-foreground" role="status">{{ currentMeta.label }} is active. Your preference is saved automatically.</p>
</template>

<script setup>
const { theme, currentMeta, themes, setTheme } = useDesignTheme()
</script>
