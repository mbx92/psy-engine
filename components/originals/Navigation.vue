<template>
  <nav aria-label="Main navigation" class="space-y-7 px-4 py-6">
    <div v-for="group in groups" :key="group.label">
      <p class="originals-eyebrow mb-3 px-3 text-[hsl(var(--originals-sidebar-muted))]">{{ group.label }}</p>
      <div class="space-y-1">
        <NuxtLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="originals-nav-link"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          @click="$emit('navigate')"
        >
          <OriginalsIcon :icon="item.icon" class="size-[18px] shrink-0" />
          <span>{{ item.label }}</span>
          <span v-if="isActive(item.to)" class="ml-auto size-1.5 rounded-full bg-current" aria-hidden="true" />
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup>
defineEmits(['navigate'])
const { navItems, isActive } = useAppNavigation()
const groups = computed(() => ['Workspace', 'Insights', 'Management']
  .map(label => ({ label, items: navItems.value.filter(item => item.group === label) }))
  .filter(group => group.items.length))
</script>
