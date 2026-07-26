<template>
  <div class="space-y-4 md:space-y-6">
    <div>
      <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-sm md:text-base text-muted-foreground">Welcome, {{ user?.name }}</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <UiCard v-for="stat in stats" :key="stat.label" class="py-3 md:py-4">
        <UiCardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-4">
          <UiCardTitle class="text-xs md:text-sm font-medium">{{ stat.label }}</UiCardTitle>
          <Icon :icon="stat.icon" class="size-3 md:size-4 text-muted-foreground shrink-0" />
        </UiCardHeader>
        <UiCardContent class="px-3 md:px-4">
          <div class="text-xl md:text-2xl font-bold">{{ stat.value }}</div>
          <p class="text-xs text-muted-foreground truncate">{{ stat.description }}</p>
        </UiCardContent>
      </UiCard>
    </div>

    <!-- Quick Actions -->
    <div>
      <h2 class="text-lg md:text-xl font-semibold mb-3 md:mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <UiCard class="hover:bg-accent/50 cursor-pointer transition-colors" @click="navigateTo('/admin/test-types')">
          <UiCardHeader class="py-3 md:py-4">
            <UiCardTitle class="flex items-center gap-2 text-sm md:text-base">
              <Icon icon="lucide:clipboard-list" class="size-4 shrink-0" />
              Manage Test Types
            </UiCardTitle>
          </UiCardHeader>
          <UiCardContent class="py-0 pb-3 md:pb-4">
            <p class="text-xs md:text-sm text-muted-foreground">Configure test definitions, add new test types</p>
          </UiCardContent>
        </UiCard>

        <UiCard class="hover:bg-accent/50 cursor-pointer transition-colors" @click="navigateTo('/admin/participants')">
          <UiCardHeader class="py-3 md:py-4">
            <UiCardTitle class="flex items-center gap-2 text-sm md:text-base">
              <Icon icon="lucide:users" class="size-4 shrink-0" />
              Manage Participants
            </UiCardTitle>
          </UiCardHeader>
          <UiCardContent class="py-0 pb-3 md:pb-4">
            <p class="text-xs md:text-sm text-muted-foreground">Add and manage test participants</p>
          </UiCardContent>
        </UiCard>

        <UiCard class="hover:bg-accent/50 cursor-pointer transition-colors" @click="navigateTo('/admin/sessions')">
          <UiCardHeader class="py-3 md:py-4">
            <UiCardTitle class="flex items-center gap-2 text-sm md:text-base">
              <Icon icon="lucide:play-circle" class="size-4 shrink-0" />
              View Sessions
            </UiCardTitle>
          </UiCardHeader>
          <UiCardContent class="py-0 pb-3 md:pb-4">
            <p class="text-xs md:text-sm text-muted-foreground">Monitor ongoing and completed test sessions</p>
          </UiCardContent>
        </UiCard>
      </div>
    </div>

    <!-- Recent Activity -->
    <UiCard>
      <UiCardHeader class="py-3 md:py-4">
        <UiCardTitle class="text-base md:text-lg">Recent Activity</UiCardTitle>
        <UiCardDescription class="text-xs md:text-sm">Latest test sessions and registrations</UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <p class="text-xs md:text-sm text-muted-foreground py-4 text-center">No recent activity</p>
      </UiCardContent>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { user } = useAuth()
const { data: tests } = await useFetch('/api/tests')

const stats = computed(() => [
  {
    label: 'Test Types',
    value: tests.value?.length || 0,
    description: 'Available test definitions',
    icon: 'lucide:clipboard-list',
  },
  {
    label: 'Participants',
    value: '—',
    description: 'Registered participants',
    icon: 'lucide:users',
  },
  {
    label: 'Sessions',
    value: '—',
    description: 'Test sessions created',
    icon: 'lucide:play-circle',
  },
  {
    label: 'Completed',
    value: '—',
    description: 'Completed test sessions',
    icon: 'lucide:check-circle',
  },
])
</script>
