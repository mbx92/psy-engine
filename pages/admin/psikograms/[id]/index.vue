<template>
  <div class="max-w-4xl space-y-4 md:space-y-6">
    <div v-if="loading" class="text-sm text-muted-foreground text-center py-16">Loading...</div>
    <div v-else-if="loadError" class="text-sm text-destructive text-center py-16">{{ loadError }}</div>

    <template v-else>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0 space-y-1">
          <UiButton variant="ghost" size="sm" class="-ml-2 h-8 px-2" @click="navigateTo('/admin/psikograms')">
            <Icon icon="lucide:arrow-left" class="size-4 mr-1" />
            Psikogram
          </UiButton>
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight truncate">{{ psikogram.participant?.name }}</h1>
          <div class="flex flex-wrap items-center gap-2">
            <UiBadge :variant="psikogramStatusVariant(psikogram.status)" class="text-xs">
              {{ psikogramStatusLabel(psikogram.status) }}
            </UiBadge>
            <UiBadge
              v-if="psikogram.recommendation"
              :variant="psikogramRecommendationVariant(psikogram.recommendation)"
              class="text-xs"
            >
              {{ psikogramRecommendationLabel(psikogram.recommendation) }}
            </UiBadge>
            <span class="text-xs text-muted-foreground">{{ formatDate(psikogram.examDate) }}</span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <UiButton v-if="can('psikograms:update')" variant="outline" size="sm" @click="navigateTo(`/admin/psikograms/${id}/edit`)">
            <Icon icon="lucide:pencil" class="size-4 mr-1" />
            Edit
          </UiButton>
          <UiButton as-child variant="outline" size="sm">
            <NuxtLink :to="`/admin/psikograms/${id}/print`" target="_blank">
              <Icon icon="lucide:printer" class="size-4 mr-1" />
              Cetak
            </NuxtLink>
          </UiButton>
          <UiButton v-if="psikogram.status === 'final'" variant="outline" size="sm" @click="handleShare">
            <Icon icon="lucide:share-2" class="size-4 mr-1" />
            Bagikan
          </UiButton>
          <UiButton
            v-if="can('psikograms:delete') && psikogram.status === 'draft'"
            variant="outline"
            size="sm"
            class="text-destructive"
            @click="handleDelete"
          >
            <Icon icon="lucide:trash-2" class="size-4 mr-1" />
            Hapus
          </UiButton>
        </div>
      </div>

      <UiCard>
        <UiCardHeader class="pb-3">
          <UiCardTitle class="text-sm">Biodata Peserta</UiCardTitle>
        </UiCardHeader>
        <UiCardContent class="space-y-2 text-sm">
          <MetaRow label="Nama" :value="psikogram.participant?.name" />
          <MetaRow label="Tanggal Lahir" :value="formatDate(psikogram.participant?.birthDate)" />
          <MetaRow label="Pendidikan" :value="psikogram.participant?.education || '—'" />
          <MetaRow label="Perusahaan" :value="psikogram.participant?.corporate || '—'" />
          <MetaRow label="Tanggal Pemeriksaan" :value="formatDate(psikogram.examDate)" />
          <MetaRow label="Pemeriksa" :value="psikogram.examiner?.name" />
          <MetaRow v-if="psikogram.session" label="Sesi Tes" :value="psikogram.session.testTypeName" />
        </UiCardContent>
      </UiCard>

      <UiCard v-for="section in sectionMeta" :key="section.key">
        <UiCardHeader class="pb-3">
          <UiCardTitle class="text-sm">{{ section.label }}</UiCardTitle>
        </UiCardHeader>
        <UiCardContent class="space-y-2">
          <div
            v-for="(item, i) in psikogram.sections?.[section.key]?.items || []"
            :key="i"
            class="flex items-center justify-between gap-3 text-sm border-b pb-2 last:border-b-0 last:pb-0"
          >
            <div class="min-w-0">
              <p class="font-medium">{{ item.title }}</p>
              <p class="text-xs text-muted-foreground">{{ item.description }}</p>
            </div>
            <UiBadge v-if="item.rating" :variant="psikogramRatingVariant(item.rating)" class="text-xs shrink-0">
              {{ item.rating }}
            </UiBadge>
          </div>
          <p v-if="psikogram.sections?.[section.key]?.conclusion" class="text-xs text-muted-foreground pt-2 border-t">
            <span class="font-medium text-foreground">Kesimpulan:</span> {{ psikogram.sections[section.key].conclusion }}
          </p>
        </UiCardContent>
      </UiCard>

      <UiCard v-if="psikogram.notes">
        <UiCardHeader class="pb-3">
          <UiCardTitle class="text-sm">Catatan Internal</UiCardTitle>
        </UiCardHeader>
        <UiCardContent class="text-sm text-muted-foreground">{{ psikogram.notes }}</UiCardContent>
      </UiCard>
    </template>

    <UiDialog v-model:open="showShareDialog">
      <UiDialogContent class="sm:max-w-md">
        <UiDialogHeader>
          <UiDialogTitle>Bagikan Psikogram</UiDialogTitle>
          <UiDialogDescription>Link publik untuk {{ psikogram.participant?.name }}</UiDialogDescription>
        </UiDialogHeader>
        <div v-if="generatingLink" class="text-sm text-muted-foreground py-4 text-center">Membuat link...</div>
        <div v-else class="space-y-3">
          <div class="flex gap-2">
            <UiInput :model-value="shareLink" readonly class="h-10" />
            <UiButton size="icon" class="h-10 w-10 shrink-0" @click="copyShareLink">
              <Icon icon="lucide:copy" class="size-4" />
            </UiButton>
          </div>
          <p class="text-xs text-muted-foreground">Siapa saja dengan link ini dapat melihat hasil psikogram.</p>
        </div>
        <UiDialogFooter>
          <UiButton variant="outline" @click="showShareDialog = false">Tutup</UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>

<script setup>
import {
  psikogramStatusVariant,
  psikogramStatusLabel,
  psikogramRecommendationVariant,
  psikogramRecommendationLabel,
  psikogramRatingVariant,
} from '~~/utils/psikogramStatus'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const MetaRow = (props) => h('div', { class: 'flex justify-between gap-3' }, [
  h('span', { class: 'text-muted-foreground shrink-0' }, props.label),
  h('span', { class: 'font-medium text-right break-words' }, props.value || '—'),
])
MetaRow.props = { label: String, value: [String, Number] }

const sectionMeta = [
  { key: 'kecerdasan', label: 'A. Kecerdasan' },
  { key: 'sikapKerja', label: 'B. Sikap dan Cara Kerja' },
  { key: 'kepribadian', label: 'C. Kepribadian' },
  { key: 'kemampuanBelajar', label: 'D. Kemampuan Belajar' },
]

const route = useRoute()
const id = route.params.id
const { can, getAuthHeaders } = useAuth()
const toast = useToast()
const { confirm } = useConfirm()

const loading = ref(true)
const loadError = ref('')
const psikogram = ref({})
const showShareDialog = ref(false)
const generatingLink = ref(false)
const shareLink = ref('')

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function load() {
  loadError.value = ''
  try {
    const data = await $fetch(`/api/admin/psikograms/${id}`, { headers: getAuthHeaders() })
    psikogram.value = data.psikogram
  } catch (err) {
    loadError.value = err?.data?.message || 'Failed to load psikogram'
  } finally {
    loading.value = false
  }
}

async function handleShare() {
  showShareDialog.value = true
  generatingLink.value = true
  shareLink.value = ''
  try {
    const data = await $fetch(`/api/admin/psikograms/${id}/share`, { method: 'POST', headers: getAuthHeaders() })
    shareLink.value = `${window.location.origin}/psikogram/${data.token}`
  } catch (err) {
    toast.error(err?.data?.message || 'Gagal membuat link berbagi')
  } finally {
    generatingLink.value = false
  }
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    toast.success('Link disalin ke clipboard')
  } catch {
    // Clipboard API may be unavailable; user can still select & copy manually
  }
}

async function handleDelete() {
  const ok = await confirm({
    title: `Hapus psikogram "${psikogram.value.participant?.name}"?`,
    description: 'Tindakan ini tidak dapat dibatalkan.',
    confirmLabel: 'Hapus',
    variant: 'destructive',
  })
  if (!ok) return

  try {
    await $fetch(`/api/admin/psikograms/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
    toast.success('Psikogram dihapus')
    navigateTo('/admin/psikograms', { replace: true })
  } catch (err) {
    toast.error(err?.data?.message || 'Gagal menghapus psikogram')
  }
}

await load()
</script>
