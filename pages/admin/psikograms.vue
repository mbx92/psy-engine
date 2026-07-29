<template>
  <NuxtPage v-if="route.matched.length > 1" />
  <div v-else class="space-y-4 md:space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Psikogram</h1>
        <p class="text-sm md:text-base text-muted-foreground">Buat dan kelola hasil pemeriksaan psikologis peserta</p>
      </div>
      <UiButton v-if="can('psikograms:create')" @click="navigateTo('/admin/psikograms/create')" class="shrink-0">
        <Icon icon="lucide:plus" class="size-4 md:mr-2" />
        <span class="hidden md:inline">Buat Psikogram</span>
      </UiButton>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
      <div class="relative w-full sm:max-w-xs shrink-0">
        <Icon icon="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <UiInput
          v-model="search"
          placeholder="Cari nama peserta..."
          class="h-10 pl-9"
        />
      </div>

      <UiTabs v-model="statusFilter" class="w-full sm:w-auto">
        <UiTabsList class="w-full sm:w-auto">
          <UiTabsTrigger value="all" class="flex-1 sm:flex-none text-sm">Semua</UiTabsTrigger>
          <UiTabsTrigger value="draft" class="flex-1 sm:flex-none text-sm">Draft</UiTabsTrigger>
          <UiTabsTrigger value="final" class="flex-1 sm:flex-none text-sm">Final</UiTabsTrigger>
        </UiTabsList>
      </UiTabs>
    </div>

    <UiResponsiveTable
      :columns="columns"
      :data="filteredPsikograms"
      item-key="id"
      @select="(row) => navigateTo(`/admin/psikograms/${row.id}`)"
    >
      <template #empty>
        <EmptyState
          icon="lucide:file-text"
          title="Belum ada psikogram"
          description="Buat psikogram baru untuk peserta yang sudah menyelesaikan tes."
        />
      </template>

      <template #cell-name="{ row }">
        <div class="min-w-0">
          <p class="font-medium text-sm truncate">{{ row.participant?.name }}</p>
          <p v-if="row.participant?.corporate" class="text-xs text-muted-foreground truncate">{{ row.participant.corporate }}</p>
        </div>
      </template>

      <template #cell-examDate="{ row }">
        <span class="text-sm">{{ formatDate(row.examDate) }}</span>
      </template>

      <template #cell-examiner="{ row }">
        <span class="text-sm">{{ row.examiner?.name || '—' }}</span>
      </template>

      <template #cell-recommendation="{ row }">
        <UiBadge
          v-if="row.recommendation"
          :variant="psikogramRecommendationVariant(row.recommendation)"
          class="text-xs"
        >
          {{ psikogramRecommendationLabel(row.recommendation) }}
        </UiBadge>
        <span v-else class="text-xs text-muted-foreground">—</span>
      </template>

      <template #cell-status="{ row }">
        <UiBadge :variant="psikogramStatusVariant(row.status)" class="text-xs">
          {{ psikogramStatusLabel(row.status) }}
        </UiBadge>
      </template>

      <template #cell-actions="{ row }">
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton variant="ghost" size="icon" class="size-8" @click.stop>
              <Icon icon="lucide:more-horizontal" class="size-4" />
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end">
            <UiDropdownMenuItem @click="navigateTo(`/admin/psikograms/${row.id}`)">
              <Icon icon="lucide:eye" class="size-4 mr-2" />
              Lihat
            </UiDropdownMenuItem>
            <UiDropdownMenuItem v-if="can('psikograms:update')" @click="navigateTo(`/admin/psikograms/${row.id}/edit`)">
              <Icon icon="lucide:pencil" class="size-4 mr-2" />
              Edit
            </UiDropdownMenuItem>
            <UiDropdownMenuItem @click="navigateTo(`/admin/psikograms/${row.id}/print`)">
              <Icon icon="lucide:printer" class="size-4 mr-2" />
              Cetak
            </UiDropdownMenuItem>
            <UiDropdownMenuItem
              v-if="can('psikograms:delete') && row.status === 'draft'"
              class="text-destructive"
              @click="handleDelete(row)"
            >
              <Icon icon="lucide:trash-2" class="size-4 mr-2" />
              Hapus
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </template>
    </UiResponsiveTable>

    <div v-if="loadError" class="text-xs text-destructive">{{ loadError }}</div>
  </div>
</template>

<script setup>
import {
  psikogramStatusVariant,
  psikogramStatusLabel,
  psikogramRecommendationVariant,
  psikogramRecommendationLabel,
} from '~~/utils/psikogramStatus'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const { can, getAuthHeaders } = useAuth()
const toast = useToast()
const { confirm } = useConfirm()

const columns = [
  { key: 'name', label: 'Peserta' },
  { key: 'examDate', label: 'Tanggal Pemeriksaan', headClass: 'hidden sm:table-cell' },
  { key: 'examiner', label: 'Pemeriksa', headClass: 'hidden sm:table-cell' },
  { key: 'recommendation', label: 'Rekomendasi' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', headClass: 'w-20', mobileLabel: '' },
]

const psikograms = ref([])
const loadError = ref('')
const search = ref('')
const statusFilter = ref('all')

const filteredPsikograms = computed(() => {
  let list = psikograms.value
  if (statusFilter.value && statusFilter.value !== 'all') {
    list = list.filter((p) => p.status === statusFilter.value)
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter((p) => (p.participant?.name || '').toLowerCase().includes(q))
  }
  return list
})

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function loadPsikograms() {
  loadError.value = ''
  try {
    const data = await $fetch('/api/admin/psikograms', { headers: getAuthHeaders() })
    psikograms.value = data.psikograms || []
  } catch (err) {
    loadError.value = err?.data?.message || 'Failed to load psikograms'
    toast.error(loadError.value)
  }
}

async function handleDelete(row) {
  const ok = await confirm({
    title: `Hapus psikogram "${row.participant?.name}"?`,
    description: 'Tindakan ini tidak dapat dibatalkan.',
    confirmLabel: 'Hapus',
    variant: 'destructive',
  })
  if (!ok) return

  try {
    await $fetch(`/api/admin/psikograms/${row.id}`, { method: 'DELETE', headers: getAuthHeaders() })
    psikograms.value = psikograms.value.filter((p) => p.id !== row.id)
    toast.success('Psikogram dihapus')
  } catch (err) {
    toast.error(err?.data?.message || 'Failed to delete psikogram')
  }
}

if (route.matched.length === 1) {
  await loadPsikograms()
}
</script>
