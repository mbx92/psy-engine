<template>
  <div class="space-y-4 md:space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div class="min-w-0">
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Reports</h1>
        <p class="text-sm md:text-base text-muted-foreground">
          Analisis operasional, asesmen, dan aktivitas sistem
        </p>
      </div>
      <UiButton variant="outline" :disabled="loading || !reports" @click="exportCurrent">
        <Icon icon="lucide:download" class="size-4 mr-2" />
        Export CSV
      </UiButton>
    </div>

    <div class="grid grid-cols-2 md:flex md:flex-wrap gap-3 items-end">
      <div class="space-y-1.5 md:w-[140px]">
        <UiLabel class="text-xs">Dari</UiLabel>
        <UiInput v-model="from" type="date" class="h-10 w-full" />
      </div>
      <div class="space-y-1.5 md:w-[140px]">
        <UiLabel class="text-xs">Sampai</UiLabel>
        <UiInput v-model="to" type="date" class="h-10 w-full" />
      </div>

      
      <div class="space-y-1.5 col-span-2 md:w-[292px]">
        <UiLabel class="text-xs">Jenis tes</UiLabel>
        <UiSelect v-model="testTypeId">
          <UiSelectTrigger class="h-10 w-full">
            <UiSelectValue placeholder="Semua tes" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem value="all">Semua tes</UiSelectItem>
            <UiSelectItem v-for="t in testTypes" :key="t.id" :value="t.id">{{ t.name }}</UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>
      <div class="col-span-2 md:w-[140px]">
        <UiButton class="h-10 w-full" :disabled="loading" @click="loadReports">
          <Icon icon="lucide:refresh-cw" class="size-4 mr-2" :class="{ 'animate-spin': loading }" />
          Terapkan
        </UiButton>
      </div>
    </div>

    <UiTabs v-model="activeTab" class="w-full overflow-x-auto">
      <UiTabsList class="w-max h-auto flex-wrap justify-start">
        <UiTabsTrigger v-for="tab in tabs" :key="tab.value" :value="tab.value" class="text-sm">
          {{ tab.label }}
        </UiTabsTrigger>
      </UiTabsList>
    </UiTabs>

    <div v-if="loading" class="space-y-3">
      <UiSkeleton v-for="i in 4" :key="i" class="h-24 w-full rounded-md" />
    </div>
    <div v-else-if="error" class="text-sm text-destructive">{{ error }}</div>

    <template v-else-if="reports">
      <div v-if="activeTab === 'period'" class="space-y-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <UiCard v-for="s in periodStats" :key="s.label" class="py-3">
            <UiCardHeader class="py-0 px-4 pb-1">
              <UiCardTitle class="text-xs font-medium text-muted-foreground">{{ s.label }}</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="px-4">
              <div class="text-2xl font-bold tabular-nums">{{ s.value }}</div>
            </UiCardContent>
          </UiCard>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <UiCard>
            <UiCardHeader class="py-3">
              <UiCardTitle class="text-base">Per hari</UiCardTitle>
            </UiCardHeader>
            <UiCardContent>
              <div v-if="periodBars.length" class="flex items-end gap-1 h-36">
                <div
                  v-for="(item, idx) in periodBars"
                  :key="idx"
                  class="flex-1 min-w-0 flex flex-col items-center gap-1 h-full justify-end"
                >
                  <span class="text-[10px] tabular-nums text-muted-foreground">{{ item.value }}</span>
                  <div
                    class="w-full rounded-t bg-primary/80"
                    :style="{ height: `${item.pct}%` }"
                    :title="`${item.label}: ${item.value}`"
                  />
                  <span class="text-[9px] text-muted-foreground truncate w-full text-center">{{ item.label }}</span>
                </div>
              </div>
              <p v-else class="text-sm text-muted-foreground text-center py-6">Tidak ada data</p>
            </UiCardContent>
          </UiCard>

          <UiCard>
            <UiCardHeader class="py-3">
              <UiCardTitle class="text-base">Per jenis tes</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="space-y-2">
              <div
                v-for="row in reports.periodSummary.byTest"
                :key="row.testTypeId"
                class="flex items-center justify-between gap-3 text-sm border-b last:border-0 py-2"
              >
                <span class="truncate">{{ row.testTypeName }}</span>
                <span class="tabular-nums shrink-0 text-muted-foreground">
                  {{ row.completed }}/{{ row.total }} selesai
                </span>
              </div>
              <p v-if="!reports.periodSummary.byTest.length" class="text-sm text-muted-foreground text-center py-6">Tidak ada data</p>
            </UiCardContent>
          </UiCard>
        </div>
      </div>

      <div v-else-if="activeTab === 'completion'" class="space-y-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <UiCard v-for="s in completionStats" :key="s.label" class="py-3">
            <UiCardHeader class="py-0 px-4 pb-1">
              <UiCardTitle class="text-xs font-medium text-muted-foreground">{{ s.label }}</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="px-4">
              <div class="text-2xl font-bold tabular-nums">{{ s.value }}</div>
            </UiCardContent>
          </UiCard>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <UiCard>
            <UiCardHeader class="py-3">
              <UiCardTitle class="text-base">Status breakdown</UiCardTitle>
            </UiCardHeader>
            <UiCardContent>
              <DashboardSessionsStatusChart v-if="completionChart.length" :items="completionChart" />
              <p v-else class="text-sm text-muted-foreground text-center py-6">Tidak ada data</p>
            </UiCardContent>
          </UiCard>

          <UiCard>
            <UiCardHeader class="py-3">
              <UiCardTitle class="text-base">Durasi pengerjaan (menit)</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="space-y-2">
              <div
                v-for="row in reports.completion.durationByStatus"
                :key="row.status"
                class="flex items-center justify-between text-sm border-b last:border-0 py-2"
              >
                <span>{{ statusLabel(row.status) }}</span>
                <span class="tabular-nums text-muted-foreground">
                  avg {{ row.avgMinutes ?? '—' }} · median {{ row.medianMinutes ?? '—' }}
                </span>
              </div>
              <p v-if="!reports.completion.durationByStatus.length" class="text-sm text-muted-foreground text-center py-6">Belum ada data durasi</p>
            </UiCardContent>
          </UiCard>
        </div>
      </div>

      <div v-else-if="activeTab === 'corporate'" class="space-y-4">
        <UiCard>
          <UiCardHeader class="py-3">
            <UiCardTitle class="text-base">Rekap per perusahaan</UiCardTitle>
            <UiCardDescription>Berdasarkan snapshot perusahaan di psikogram</UiCardDescription>
          </UiCardHeader>
          <UiCardContent class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b text-left text-muted-foreground">
                  <th class="py-2 pr-3 font-medium">Perusahaan</th>
                  <th class="py-2 px-2 font-medium text-right">Total</th>
                  <th class="py-2 px-2 font-medium text-right">Final</th>
                  <th class="py-2 px-2 font-medium text-right">Draft</th>
                  <th class="py-2 px-2 font-medium text-right">Disarankan</th>
                  <th class="py-2 pl-2 font-medium text-right">Tidak</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in reports.corporate.rows" :key="row.corporate" class="border-b last:border-0">
                  <td class="py-2 pr-3">{{ row.corporate }}</td>
                  <td class="py-2 px-2 text-right tabular-nums">{{ row.total }}</td>
                  <td class="py-2 px-2 text-right tabular-nums">{{ row.final }}</td>
                  <td class="py-2 px-2 text-right tabular-nums">{{ row.draft }}</td>
                  <td class="py-2 px-2 text-right tabular-nums">{{ row.recommended }}</td>
                  <td class="py-2 pl-2 text-right tabular-nums">{{ row.notRecommended }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="!reports.corporate.rows.length" class="text-sm text-muted-foreground text-center py-6">Tidak ada data psikogram</p>
          </UiCardContent>
        </UiCard>
      </div>

      <div v-else-if="activeTab === 'psikogram'" class="space-y-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <UiCard v-for="s in psikogramStats" :key="s.label" class="py-3">
            <UiCardHeader class="py-0 px-4 pb-1">
              <UiCardTitle class="text-xs font-medium text-muted-foreground">{{ s.label }}</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="px-4">
              <div class="text-2xl font-bold tabular-nums">{{ s.value }}</div>
            </UiCardContent>
          </UiCard>
        </div>

        <UiCard>
          <UiCardHeader class="py-3">
            <UiCardTitle class="text-base">Draft terbaru</UiCardTitle>
          </UiCardHeader>
          <UiCardContent class="space-y-2">
            <button
              v-for="row in reports.psikogramPipeline.recentDrafts"
              :key="row.id"
              type="button"
              class="w-full flex items-center justify-between gap-3 text-left text-sm border rounded-md px-3 py-2 hover:bg-accent/40"
              @click="navigateTo(`/admin/psikograms/${row.id}`)"
            >
              <div class="min-w-0">
                <p class="font-medium truncate">{{ row.participantName }}</p>
                <p class="text-xs text-muted-foreground truncate">
                  {{ row.corporate || '—' }} · {{ row.examinerName }}
                </p>
              </div>
              <span class="text-xs text-muted-foreground shrink-0">{{ formatDate(row.examDate) }}</span>
            </button>
            <p v-if="!reports.psikogramPipeline.recentDrafts.length" class="text-sm text-muted-foreground text-center py-6">Tidak ada draft</p>
          </UiCardContent>
        </UiCard>
      </div>

      <div v-else-if="activeTab === 'scores'" class="space-y-4">
        <UiCard v-for="test in reports.scoreDistribution.tests" :key="test.testTypeId">
          <UiCardHeader class="py-3">
            <UiCardTitle class="text-base">{{ test.testTypeName }}</UiCardTitle>
            <UiCardDescription>Sample {{ test.sampleSize }} sesi selesai</UiCardDescription>
          </UiCardHeader>
          <UiCardContent class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b text-left text-muted-foreground">
                  <th class="py-2 pr-3 font-medium">Dimensi</th>
                  <th class="py-2 px-2 font-medium text-right">Avg</th>
                  <th class="py-2 px-2 font-medium text-right">Median</th>
                  <th class="py-2 px-2 font-medium text-right">Min</th>
                  <th class="py-2 pl-2 font-medium text-right">Max</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(stats, dim) in test.dimensions" :key="dim" class="border-b last:border-0">
                  <td class="py-2 pr-3 font-medium">{{ dim }}</td>
                  <td class="py-2 px-2 text-right tabular-nums">{{ stats.avg }}</td>
                  <td class="py-2 px-2 text-right tabular-nums">{{ stats.median }}</td>
                  <td class="py-2 px-2 text-right tabular-nums">{{ stats.min }}</td>
                  <td class="py-2 pl-2 text-right tabular-nums">{{ stats.max }}</td>
                </tr>
              </tbody>
            </table>
          </UiCardContent>
        </UiCard>
        <p v-if="!reports.scoreDistribution.tests.length" class="text-sm text-muted-foreground text-center py-8">
          Belum ada skor selesai pada periode ini
        </p>
      </div>



      <div v-else-if="activeTab === 'invites'" class="space-y-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <UiCard v-for="s in inviteStats" :key="s.label" class="py-3">
            <UiCardHeader class="py-0 px-4 pb-1">
              <UiCardTitle class="text-xs font-medium text-muted-foreground">{{ s.label }}</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="px-4">
              <div class="text-2xl font-bold tabular-nums">{{ s.value }}</div>
            </UiCardContent>
          </UiCard>
        </div>
        <UiCard>
          <UiCardHeader class="py-3">
            <UiCardTitle class="text-base">Detail public links</UiCardTitle>
          </UiCardHeader>
          <UiCardContent class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b text-left text-muted-foreground">
                  <th class="py-2 pr-3 font-medium">Label / Tes</th>
                  <th class="py-2 px-2 font-medium">Status</th>
                  <th class="py-2 px-2 font-medium text-right">Used</th>
                  <th class="py-2 pl-2 font-medium text-right">Sisa</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="link in reports.publicLinks.links" :key="link.id" class="border-b last:border-0">
                  <td class="py-2 pr-3">
                    <p class="font-medium">{{ link.label || 'Tanpa label' }}</p>
                    <p class="text-xs text-muted-foreground">{{ link.testTypeName }}</p>
                  </td>
                  <td class="py-2 px-2">
                    <UiBadge :variant="link.isActive ? 'completed' : 'abandoned'" class="text-xs">
                      {{ link.isActive ? 'Active' : 'Off' }}
                    </UiBadge>
                  </td>
                  <td class="py-2 px-2 text-right tabular-nums">
                    {{ link.useCount }}{{ link.maxUses != null ? ` / ${link.maxUses}` : '' }}
                  </td>
                  <td class="py-2 pl-2 text-right tabular-nums">{{ link.remainingUses ?? '∞' }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="!reports.publicLinks.links.length" class="text-sm text-muted-foreground text-center py-6">Belum ada public link</p>
          </UiCardContent>
        </UiCard>
      </div>

      <div v-else-if="activeTab === 'activity'" class="space-y-4">
        <div class="grid grid-cols-3 gap-3">
          <UiCard v-for="s in activityStats" :key="s.label" class="py-3">
            <UiCardHeader class="py-0 px-4 pb-1">
              <UiCardTitle class="text-xs font-medium text-muted-foreground">{{ s.label }}</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="px-4">
              <div class="text-2xl font-bold tabular-nums">{{ s.value }}</div>
            </UiCardContent>
          </UiCard>
        </div>
        <div class="grid md:grid-cols-2 gap-4">
          <UiCard>
            <UiCardHeader class="py-3">
              <UiCardTitle class="text-base">Per kategori</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="space-y-2">
              <div
                v-for="row in reports.adminActivity.byCategory"
                :key="row.category"
                class="flex items-center justify-between text-sm border-b last:border-0 py-2"
              >
                <span>{{ row.category }}</span>
                <span class="tabular-nums text-muted-foreground">{{ row.total }}</span>
              </div>
            </UiCardContent>
          </UiCard>
          <UiCard>
            <UiCardHeader class="py-3">
              <UiCardTitle class="text-base">Top aktor</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="space-y-2">
              <div
                v-for="row in reports.adminActivity.byActor"
                :key="row.actorEmail"
                class="flex items-center justify-between text-sm border-b last:border-0 py-2"
              >
                <div class="min-w-0">
                  <p class="truncate font-medium">{{ row.actorName }}</p>
                  <p class="text-xs text-muted-foreground truncate">{{ row.actorRole || '—' }}</p>
                </div>
                <span class="tabular-nums shrink-0">{{ row.total }}</span>
              </div>
            </UiCardContent>
          </UiCard>
        </div>
      </div>

      <div v-else-if="activeTab === 'workload'" class="space-y-4">
        <div class="grid md:grid-cols-2 gap-4">
          <UiCard>
            <UiCardHeader class="py-3">
              <UiCardTitle class="text-base">Workload pemeriksa psikogram</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b text-left text-muted-foreground">
                    <th class="py-2 pr-3 font-medium">Pemeriksa</th>
                    <th class="py-2 px-2 font-medium text-right">Total</th>
                    <th class="py-2 px-2 font-medium text-right">Final</th>
                    <th class="py-2 pl-2 font-medium text-right">Draft</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in reports.examinerWorkload.examiners" :key="row.examinerId" class="border-b last:border-0">
                    <td class="py-2 pr-3">
                      <p class="font-medium">{{ row.examinerName }}</p>
                      <p class="text-xs text-muted-foreground">{{ row.examinerEmail }}</p>
                    </td>
                    <td class="py-2 px-2 text-right tabular-nums">{{ row.total }}</td>
                    <td class="py-2 px-2 text-right tabular-nums">{{ row.final }}</td>
                    <td class="py-2 pl-2 text-right tabular-nums">{{ row.draft }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-if="!reports.examinerWorkload.examiners.length" class="text-sm text-muted-foreground text-center py-6">Tidak ada data</p>
            </UiCardContent>
          </UiCard>

          <UiCard>
            <UiCardHeader class="py-3">
              <UiCardTitle class="text-base">Verifikasi sesi</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="space-y-2">
              <div
                v-for="row in reports.examinerWorkload.verifiers"
                :key="row.userId"
                class="flex items-center justify-between text-sm border-b last:border-0 py-2"
              >
                <div class="min-w-0">
                  <p class="font-medium truncate">{{ row.userName }}</p>
                  <p class="text-xs text-muted-foreground truncate">{{ row.userEmail }}</p>
                </div>
                <span class="tabular-nums shrink-0">{{ row.total }}</span>
              </div>
              <p v-if="!reports.examinerWorkload.verifiers.length" class="text-sm text-muted-foreground text-center py-6">Belum ada verifikasi</p>
            </UiCardContent>
          </UiCard>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { statusLabel, STATUS_LABELS } from '~~/utils/sessionStatus'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { can, getAuthHeaders } = useAuth()
const toast = useToast()

const tabs = [
  { value: 'period', label: 'Periode', exportType: 'period' },
  { value: 'completion', label: 'Completion', exportType: 'completion' },
  { value: 'corporate', label: 'Perusahaan', exportType: 'corporate' },
  { value: 'psikogram', label: 'Psikogram', exportType: 'psikogram' },
  { value: 'scores', label: 'Skor', exportType: 'scores' },

  { value: 'invites', label: 'Public Links', exportType: 'invites' },
  { value: 'activity', label: 'Aktivitas', exportType: 'activity' },
  { value: 'workload', label: 'Workload', exportType: 'workload' },
]

const activeTab = ref('period')
const loading = ref(false)
const error = ref('')
const reports = ref(null)
const testTypes = ref([])

function toInputDate(d) {
  const x = new Date(d)
  const yyyy = x.getFullYear()
  const mm = String(x.getMonth() + 1).padStart(2, '0')
  const dd = String(x.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const today = new Date()
const monthAgo = new Date(today.getTime() - 30 * 86400000)

const from = ref(toInputDate(monthAgo))
const to = ref(toInputDate(today))
const testTypeId = ref('all')

const periodStats = computed(() => {
  const t = reports.value?.periodSummary?.totals || {}
  return [
    { label: 'Sesi', value: t.sessions || 0 },
    { label: 'Peserta unik', value: t.participants || 0 },
    { label: 'Selesai', value: t.completed || 0 },
    { label: 'Psikogram', value: t.psikograms || 0 },
  ]
})

const completionStats = computed(() => {
  const c = reports.value?.completion || {}
  return [
    { label: 'Total sesi', value: c.total || 0 },
    { label: 'Completion rate', value: `${c.completionRate || 0}%` },
    { label: 'Abandoned', value: c.abandoned || 0 },
    { label: 'Abandon rate', value: `${c.abandonRate || 0}%` },
  ]
})

const psikogramStats = computed(() => {
  const t = reports.value?.psikogramPipeline?.totals || {}
  return [
    { label: 'Total', value: t.total || 0 },
    { label: 'Draft', value: t.draft || 0 },
    { label: 'Final', value: t.final || 0 },
    { label: 'Sudah dishare', value: t.shared || 0 },
    { label: 'Disarankan', value: t.recommended || 0 },
    { label: 'Tidak disarankan', value: t.notRecommended || 0 },
    { label: 'Belum rekomendasi', value: t.noRecommendation || 0 },
  ]
})

const inviteStats = computed(() => {
  const s = reports.value?.publicLinks?.summary || {}
  return [
    { label: 'Total link', value: s.totalLinks || 0 },
    { label: 'Aktif', value: s.activeLinks || 0 },
    { label: 'Claim periode ini', value: s.claimedInPeriod || 0 },
    { label: 'Claim → selesai', value: `${s.claimCompletionRate || 0}%` },
  ]
})

const activityStats = computed(() => {
  const t = reports.value?.adminActivity?.totals || {}
  return [
    { label: 'Total event', value: t.total || 0 },
    { label: 'Warning', value: t.warnings || 0 },
    { label: 'Error', value: t.errors || 0 },
  ]
})

const periodBars = computed(() => {
  const items = reports.value?.periodSummary?.byDay || []
  const max = Math.max(...items.map((i) => Number(i.total) || 0), 1)
  return items.map((r) => ({
    label: r.day ? toInputDate(r.day).slice(5) : '',
    value: r.total,
    pct: Math.max(4, ((Number(r.total) || 0) / max) * 100),
  }))
})

const completionChart = computed(() =>
  (reports.value?.completion?.byStatus || []).map((r) => ({
    key: r.status,
    label: STATUS_LABELS[r.status] || r.status,
    value: r.total,
  })),
)

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function queryParams() {
  return {
    from: from.value,
    to: to.value,
    testTypeId: testTypeId.value !== 'all' ? testTypeId.value : undefined,
  }
}

async function loadReports() {
  if (!can('reports:read')) {
    error.value = 'Anda tidak memiliki akses reports'
    return
  }
  loading.value = true
  error.value = ''
  try {
    reports.value = await $fetch('/api/admin/reports', {
      query: queryParams(),
      headers: getAuthHeaders(),
    })
  } catch (err) {
    error.value = err?.data?.message || err?.message || 'Gagal memuat reports'
    reports.value = null
  } finally {
    loading.value = false
  }
}

async function exportCurrent() {
  const tab = tabs.find((t) => t.value === activeTab.value)
  if (!tab) return
  try {
    const blob = await $fetch('/api/admin/reports/export', {
      query: { ...queryParams(), type: tab.exportType },
      headers: getAuthHeaders(),
      responseType: 'blob',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${tab.exportType}-${toInputDate(new Date())}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV diunduh')
  } catch (err) {
    toast.error(err?.data?.message || 'Gagal export CSV')
  }
}

async function loadTestTypes() {
  try {
    const data = await $fetch('/api/admin/test-types', { headers: getAuthHeaders() })
    testTypes.value = data.testTypes || []
  } catch {
    testTypes.value = []
  }
}

onMounted(async () => {
  if (!can('reports:read')) {
    await navigateTo('/')
    return
  }
  await loadTestTypes()
  await loadReports()
})
</script>
