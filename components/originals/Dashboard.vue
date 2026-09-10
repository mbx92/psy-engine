<template>
  <div class="space-y-7">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="originals-eyebrow mb-2 text-primary">Your workspace, at a glance</p>
        <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back{{ firstName ? `, ${firstName}` : '' }}.</h1>
        <p class="mt-2 text-sm text-muted-foreground">A little clarity for every step of your assessments.</p>
      </div>
      <UiButton variant="outline" :disabled="loading" @click="$emit('refresh')">
        <OriginalsIcon icon="lucide:refresh-cw" :class="{ 'motion-safe:animate-spin': loading }" />
        {{ loading ? 'Refreshing…' : 'Refresh overview' }}
      </UiButton>
    </div>

    <div v-if="error" role="alert" class="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <OriginalsIcon icon="lucide:circle-alert" class="mt-0.5 size-4 shrink-0 text-destructive" />
      <p>{{ error }} Use Refresh overview to try again.</p>
    </div>

    <section aria-labelledby="overview-title" class="grid overflow-hidden rounded-2xl border bg-secondary/50 sm:grid-cols-[1fr_auto]">
      <div class="flex flex-col justify-center p-6 sm:p-8">
        <p class="originals-eyebrow text-primary">Make room for understanding</p>
        <h2 id="overview-title" class="mt-3 max-w-md text-2xl font-medium leading-tight tracking-tight sm:text-3xl">Meaningful insights.<br />Thoughtful decisions.</h2>
        <p class="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">Manage participants, follow each session, and turn assessment results into a clearer picture.</p>
        <div v-if="can('sessions:read')" class="mt-5">
          <UiButton as-child><NuxtLink to="/admin/sessions">Open sessions <OriginalsIcon icon="lucide:arrow-up-right" /></NuxtLink></UiButton>
        </div>
      </div>
      <div class="originals-sidebar hidden w-64 items-center justify-center p-7 sm:flex xl:w-72"><OriginalsBrandArt /></div>
    </section>

    <section aria-label="Assessment statistics" :aria-busy="loading" class="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
      <UiCard v-for="stat in visibleStats" :key="stat.label" class="p-4 sm:p-5">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-medium text-muted-foreground">{{ stat.label }}</span>
          <span class="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><OriginalsIcon :icon="stat.icon" class="size-4" /></span>
        </div>
        <UiSkeleton v-if="loading" class="my-3 h-9 w-16" />
        <p v-else class="mb-2 mt-3 text-3xl font-medium tracking-tight tabular-nums">{{ stat.value }}</p>
        <p class="text-xs leading-relaxed text-muted-foreground">{{ stat.description }}</p>
      </UiCard>
    </section>

    <section v-if="actions.length" aria-labelledby="actions-title">
      <div class="mb-3 flex items-center gap-3"><h2 id="actions-title" class="text-base font-semibold">Where would you like to start?</h2><span class="h-px flex-1 bg-border" /></div>
      <div class="grid gap-3 xl:grid-cols-3">
        <NuxtLink v-for="action in actions" :key="action.to" :to="action.to" class="originals-action group">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><OriginalsIcon :icon="action.icon" class="size-5" /></span>
          <span class="min-w-0 flex-1"><span class="block text-sm font-medium">{{ action.label }}</span><span class="mt-1 block text-xs text-muted-foreground">{{ action.description }}</span></span>
          <OriginalsIcon icon="lucide:arrow-up-right" class="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
        </NuxtLink>
      </div>
    </section>

    <div v-if="can('sessions:read')" class="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <UiCard class="min-w-0 overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 pt-5">
          <div><h2 class="text-base font-semibold">Recent sessions</h2><p class="mt-1 text-xs text-muted-foreground">Stay close to every participant's progress.</p></div>
          <NuxtLink to="/admin/sessions" class="flex min-h-9 items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">View all <OriginalsIcon icon="lucide:arrow-right" class="size-3.5" /></NuxtLink>
        </div>
        <div class="flex gap-1 border-b px-5 pb-4" role="group" aria-label="Filter recent sessions">
          <button v-for="filter in filters" :key="filter.value" type="button" :aria-pressed="sessionFilter === filter.value" class="min-h-9 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" :class="sessionFilter === filter.value ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted'" @click="sessionFilter = filter.value">{{ filter.label }}</button>
        </div>
        <div :aria-busy="loading" aria-live="polite">
          <div v-if="loading" class="space-y-5 p-5" role="status">
            <span class="sr-only">Loading recent sessions</span>
            <UiSkeleton v-for="row in 3" :key="row" class="h-11 w-full" />
          </div>
          <div v-else-if="!filteredSessions.length" class="px-6 py-10 text-center">
            <span class="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground"><OriginalsIcon icon="lucide:inbox" class="size-5" /></span>
            <p class="text-sm font-medium">{{ sessionFilter === 'all' ? 'Your next insight starts here' : 'No sessions in this view' }}</p>
            <p class="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">{{ sessionFilter === 'all' ? 'Once a test session is created, you can follow its progress here.' : 'Choose another filter to see more sessions.' }}</p>
          </div>
          <ul v-else class="divide-y">
            <li v-for="session in filteredSessions" :key="session.id">
              <NuxtLink :to="`/admin/sessions/${session.id}`" class="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground" aria-hidden="true">{{ session.participantName?.charAt(0)?.toUpperCase() || 'P' }}</span>
                <span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">{{ session.participantName || 'Participant' }}</span><span class="mt-0.5 block truncate text-xs text-muted-foreground">{{ session.testTypeName }}</span></span>
                <UiBadge :variant="statusVariant(session.status)" class="shrink-0 text-[10px]">{{ statusLabel(session.status) }}</UiBadge>
                <OriginalsIcon icon="lucide:chevron-right" class="hidden size-4 shrink-0 text-muted-foreground sm:block" />
              </NuxtLink>
            </li>
          </ul>
        </div>
      </UiCard>

      <UiCard class="min-w-0 p-5">
        <h2 class="text-base font-semibold">Assessment progress</h2>
        <p class="mt-1 text-xs text-muted-foreground">The full picture of your sessions.</p>
        <div v-if="loading" class="py-8" role="status"><span class="sr-only">Loading assessment progress</span><UiSkeleton class="mx-auto size-36 rounded-full" /></div>
        <template v-else-if="statusItems.length">
          <div class="py-6"><DashboardSessionsStatusChart :items="statusItems" class="!flex-col" /></div>
          <div class="rounded-md bg-secondary/70 p-3 text-xs leading-relaxed text-secondary-foreground"><span class="font-semibold">{{ completionRate }}% complete.</span> {{ completedCount }} of {{ sessions.length }} sessions have been completed or verified.</div>
        </template>
        <div v-else class="py-10 text-center">
          <div class="mx-auto flex size-28 items-center justify-center rounded-full border-[12px] border-muted"><OriginalsIcon icon="lucide:chart-pie" class="size-6 text-muted-foreground" /></div>
          <p class="mt-5 text-xs text-muted-foreground">Your session breakdown will appear here.</p>
        </div>
      </UiCard>
    </div>
    <p class="text-center text-[11px] text-muted-foreground">A thoughtful space for understanding people.</p>
  </div>
</template>

<script setup>
import { statusLabel, statusVariant } from '~~/utils/sessionStatus'

const props = defineProps({
  stats: { type: Array, required: true },
  sessions: { type: Array, required: true },
  statusItems: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
defineEmits(['refresh'])
const { user, can } = useAuth()
const firstName = computed(() => user.value?.name?.trim().split(/\s+/)[0] || '')
const statPermissions = { 'Test Types': 'tests:read', Participants: 'participants:read', Sessions: 'sessions:read', Completed: 'sessions:read' }
const visibleStats = computed(() => props.stats.filter(stat => can(statPermissions[stat.label])))
const actions = computed(() => [
  { label: 'Manage participants', description: 'The people behind each assessment', icon: 'lucide:users', to: '/admin/participants', permission: 'participants:read' },
  { label: 'Explore test types', description: 'Find the right tools for your assessment', icon: 'lucide:clipboard-list', to: '/admin/test-types', permission: 'tests:read' },
  { label: 'Review reports', description: 'Bring results into perspective', icon: 'lucide:chart-no-axes-combined', to: '/admin/reports', permission: 'reports:read' },
].filter(action => can(action.permission)))
const sessionFilter = ref('all')
const filters = [{ label: 'All sessions', value: 'all' }, { label: 'Active', value: 'active' }, { label: 'Completed', value: 'completed' }]
const filteredSessions = computed(() => [...props.sessions]
  .filter(session => sessionFilter.value === 'all' || (sessionFilter.value === 'active'
    ? ['pending', 'in_progress'].includes(session.status)
    : ['completed', 'verified'].includes(session.status)))
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  .slice(0, 5))
const completedCount = computed(() => props.sessions.filter(session => ['completed', 'verified'].includes(session.status)).length)
const completionRate = computed(() => props.sessions.length ? Math.round(completedCount.value / props.sessions.length * 100) : 0)
</script>
