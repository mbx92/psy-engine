<template>
  <div class="space-y-4 md:space-y-6">
    <div class="min-w-0">
      <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Activity Log</h1>
      <p class="text-sm md:text-base text-muted-foreground">
        Catatan aktivitas sistem: login, perubahan data, sesi, dan pengaturan
      </p>
    </div>

    <div class="flex flex-col gap-3">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="relative w-full sm:max-w-xs shrink-0">
          <Icon icon="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <UiInput
            v-model="search"
            placeholder="Cari pesan, user, path..."
            class="h-10 pl-9"
          />
        </div>

        <UiTabs v-model="category" class="w-full sm:w-auto overflow-x-auto">
          <UiTabsList class="w-max sm:w-auto">
            <UiTabsTrigger v-for="tab in categoryTabs" :key="tab.value" :value="tab.value" class="text-sm">
              {{ tab.label }}
            </UiTabsTrigger>
          </UiTabsList>
        </UiTabs>
      </div>

      <UiTabs v-model="level" class="w-full sm:w-auto">
        <UiTabsList class="w-full sm:w-auto">
          <UiTabsTrigger value="all" class="text-sm">All levels</UiTabsTrigger>
          <UiTabsTrigger value="info" class="text-sm">Info</UiTabsTrigger>
          <UiTabsTrigger value="warning" class="text-sm">Warning</UiTabsTrigger>
          <UiTabsTrigger value="error" class="text-sm">Error</UiTabsTrigger>
        </UiTabsList>
      </UiTabs>
    </div>

    <div v-if="loading" class="space-y-2">
      <UiSkeleton v-for="i in 8" :key="i" class="h-14 w-full rounded-md" />
    </div>

    <div v-else-if="listError" class="text-sm text-destructive">{{ listError }}</div>

    <template v-else>
      <div v-if="!logs.length" class="py-12">
        <EmptyState
          icon="lucide:scroll-text"
          title="Belum ada aktivitas"
          description="Aktivitas sistem akan muncul di sini setelah ada perubahan data atau login."
        />
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="row in logs"
          :key="row.id"
          class="border rounded-lg p-3 md:p-4 flex gap-3"
        >
          <div
            class="mt-0.5 size-8 rounded-full flex items-center justify-center shrink-0"
            :class="levelTone(row.level).wrap"
          >
            <Icon :icon="levelTone(row.level).icon" class="size-4" />
          </div>

          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-sm font-medium truncate">{{ row.message || row.action }}</p>
              <UiBadge variant="secondary" class="text-[10px] shrink-0">{{ row.category }}</UiBadge>
              <UiBadge :variant="levelTone(row.level).badge" class="text-[10px] shrink-0">{{ row.level }}</UiBadge>
            </div>

            <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span class="tabular-nums">{{ formatDateTime(row.createdAt) }}</span>
              <span v-if="row.actorName || row.actorEmail">
                {{ row.actorName || row.actorEmail }}
                <span v-if="row.actorRole" class="opacity-70">({{ row.actorRole }})</span>
              </span>
              <span v-else class="opacity-70">System / anonymous</span>
              <span v-if="row.method" class="font-mono">
                {{ row.method }}
                <span v-if="row.statusCode">· {{ row.statusCode }}</span>
              </span>
            </div>

            <p v-if="row.path" class="text-[11px] font-mono text-muted-foreground truncate" :title="row.path">
              {{ row.action }} · {{ row.path }}
            </p>
          </div>
        </div>
      </div>

      <PaginationBar
        :page="page"
        :limit="pageSize"
        :total="pageMeta.total"
        @update:page="page = $event"
      />
    </template>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { can, getAuthHeaders } = useAuth()

const categoryTabs = [
  { value: 'all', label: 'All' },
  { value: 'auth', label: 'Auth' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'participants', label: 'Participants' },
  { value: 'tests', label: 'Tests' },
  { value: 'psikograms', label: 'Psikogram' },
  { value: 'users', label: 'Users' },
  { value: 'settings', label: 'Settings' },
  { value: 'system', label: 'System' },
  { value: 'invitations', label: 'Invites' },
]

const search = ref('')
const category = ref('all')
const level = ref('all')
const page = ref(1)
const pageSize = 30
const logs = ref([])
const pageMeta = ref({ total: 0, totalPages: 1 })
const loading = ref(false)
const listError = ref('')

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function levelTone(lvl) {
  if (lvl === 'error') {
    return {
      wrap: 'bg-destructive/10 text-destructive',
      icon: 'lucide:circle-alert',
      badge: 'destructive',
    }
  }
  if (lvl === 'warning') {
    return {
      wrap: 'bg-amber-500/10 text-amber-700',
      icon: 'lucide:triangle-alert',
      badge: 'pending',
    }
  }
  return {
    wrap: 'bg-muted text-muted-foreground',
    icon: 'lucide:info',
    badge: 'secondary',
  }
}

async function loadLogs() {
  if (!can('activity:read')) return
  loading.value = true
  listError.value = ''
  try {
    const data = await $fetch('/api/admin/activity-logs', {
      query: {
        page: page.value,
        limit: pageSize,
        search: search.value || undefined,
        category: category.value,
        level: level.value,
      },
      headers: getAuthHeaders(),
    })
    logs.value = data.logs || []
    pageMeta.value = data.pagination || { total: 0, totalPages: 1 }
  } catch (err) {
    listError.value = err?.data?.message || err?.message || 'Gagal memuat activity log'
    logs.value = []
  } finally {
    loading.value = false
  }
}

let searchTimer = null
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadLogs()
  }, 300)
})

watch([category, level], () => {
  page.value = 1
  loadLogs()
})

watch(page, () => loadLogs())

onMounted(() => {
  if (!can('activity:read')) {
    navigateTo('/')
    return
  }
  loadLogs()
})
</script>
