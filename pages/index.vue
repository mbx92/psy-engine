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

    <!-- Sessions by Status -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UiCard>
        <UiCardHeader class="py-3 md:py-4">
          <UiCardTitle class="text-base md:text-lg">Sessions by Status</UiCardTitle>
        </UiCardHeader>
        <UiCardContent>
          <p v-if="loading" class="text-xs md:text-sm text-muted-foreground py-4 text-center">Loading...</p>
          <p v-else-if="!statusChartData.length" class="text-xs md:text-sm text-muted-foreground py-4 text-center">No sessions yet</p>
          <DashboardSessionsStatusChart v-else :items="statusChartData" />
        </UiCardContent>
      </UiCard>

      <!-- Recent Activity -->
      <UiCard>
        <UiCardHeader class="py-3 md:py-4">
          <UiCardTitle class="text-base md:text-lg">Recent Activity</UiCardTitle>
          <UiCardDescription class="text-xs md:text-sm">Latest test sessions</UiCardDescription>
        </UiCardHeader>
        <UiCardContent>
          <p v-if="loading" class="text-xs md:text-sm text-muted-foreground py-4 text-center">Loading...</p>
          <p v-else-if="!recentSessions.length" class="text-xs md:text-sm text-muted-foreground py-4 text-center">No recent activity</p>
          <ul v-else class="space-y-2">
            <li v-for="s in recentSessions" :key="s.id" class="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
              <div class="min-w-0">
                <p class="font-medium truncate">{{ s.participantName }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ s.testTypeName }}</p>
              </div>
              <UiBadge :variant="statusVariant(s.status)" class="text-xs shrink-0">
                {{ statusLabel(s.status) }}
              </UiBadge>
            </li>
          </ul>
        </UiCardContent>
      </UiCard>
    </div>
  </div>
</template>

<script setup>
import { statusLabel, statusVariant, STATUS_LABELS } from '~~/utils/sessionStatus'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { user, getAuthHeaders } = useAuth()
const { data: tests } = await useFetch('/api/tests')

const loading = ref(true)
const participantsData = ref([])
const sessionsData = ref([])
const testTypesData = ref([])

async function loadDashboard() {
  loading.value = true
  try {
    const [partRes, sessRes, ttRes] = await Promise.all([
      $fetch('/api/participants', { headers: getAuthHeaders() }).catch(() => ({ participants: [] })),
      $fetch('/api/sessions', { headers: getAuthHeaders() }).catch(() => ({ sessions: [] })),
      $fetch('/api/admin/test-types', { headers: getAuthHeaders() }).catch(() => ({ testTypes: [] })),
    ])
    participantsData.value = partRes.participants || []
    sessionsData.value = sessRes.sessions || []
    testTypesData.value = ttRes.testTypes || []
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)

const completedCount = computed(() => sessionsData.value.filter((s) => ['completed', 'verified'].includes(s.status)).length)

const stats = computed(() => [
  {
    label: 'Test Types',
    value: testTypesData.value.length || tests.value?.length || 0,
    description: 'Available test definitions',
    icon: 'lucide:clipboard-list',
  },
  {
    label: 'Participants',
    value: participantsData.value.length,
    description: 'Registered participants',
    icon: 'lucide:users',
  },
  {
    label: 'Sessions',
    value: sessionsData.value.length,
    description: 'Test sessions created',
    icon: 'lucide:play-circle',
  },
  {
    label: 'Completed',
    value: completedCount.value,
    description: 'Completed test sessions',
    icon: 'lucide:check-circle',
  },
])

const STATUS_ORDER = ['pending', 'in_progress', 'completed', 'verified', 'abandoned']

const statusChartData = computed(() => {
  const counts = {}
  for (const s of sessionsData.value) counts[s.status] = (counts[s.status] || 0) + 1
  return STATUS_ORDER
    .filter((status) => counts[status])
    .map((status) => ({
      key: status,
      label: STATUS_LABELS[status] || status,
      value: counts[status],
    }))
})

const recentSessions = computed(() =>
  [...sessionsData.value]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5),
)
</script>
