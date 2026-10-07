<template>
  <div class="min-h-screen bg-background flex flex-col p-4 md:p-8">
    <div class="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full space-y-6">

      <div v-if="loading" class="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full" />

      <template v-else-if="error">
        <UiCard class="w-full text-center">
          <UiCardHeader>
            <UiCardTitle class="text-destructive">Terjadi Kesalahan</UiCardTitle>
            <UiCardDescription>{{ error }}</UiCardDescription>
          </UiCardHeader>
        </UiCard>
      </template>

      <p v-if="!loading && session?.scores?.status === 'failed'" role="status" class="rounded-md border border-amber-500/40 p-4 text-sm">
        Jawaban tersimpan. Hasil sedang menunggu pemeriksaan dan perhitungan ulang oleh administrator.
      </p>
      <!-- Multi-test: continue to next -->
      <template v-else-if="battery?.nextTakePath">
        <div class="w-full text-center space-y-4">
          <div class="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Icon icon="lucide:check" class="size-8 text-primary" />
          </div>
          <div class="space-y-2">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Progress paket</p>
            <h2 class="text-2xl font-bold tracking-tight">Tes ini selesai</h2>
            <p class="text-sm text-muted-foreground max-w-sm mx-auto">
              Jawaban untuk <span class="font-medium text-foreground">{{ currentTestName }}</span> sudah tersimpan.
              Silakan lanjut ke tes berikutnya.
            </p>
          </div>
        </div>

        <UiCard class="w-full text-left">
          <UiCardHeader class="pb-3">
            <UiCardTitle class="text-sm">Ringkasan</UiCardTitle>
          </UiCardHeader>
          <UiCardContent class="space-y-3 text-sm">
            <InfoRow label="Peserta" :value="participantName" />
            <InfoRow label="Tes selesai" :value="currentTestName" />
            <InfoRow label="Soal dijawab" :value="answeredLabel" />
            <InfoRow label="Waktu pengerjaan" :value="durationLabel" />
            <InfoRow label="Urutan" :value="`${(battery.currentIndex ?? 0) + 1} dari ${battery.total}`" />
            <InfoRow label="Progress paket" :value="`${battery.completedCount} / ${battery.total} tes`" />
            <InfoRow label="Berikutnya" :value="battery.nextTestName || '—'" />
          </UiCardContent>
        </UiCard>

        <UiCard class="w-full text-left">
          <UiCardHeader class="pb-2">
            <UiCardTitle class="text-sm">Daftar tes</UiCardTitle>
            <UiCardDescription>Status rangkaian undangan Anda</UiCardDescription>
          </UiCardHeader>
          <UiCardContent class="p-0">
            <ul class="divide-y">
              <li
                v-for="item in battery.items"
                :key="item.token"
                class="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                :class="item.token === token ? 'bg-muted/40' : ''"
              >
                <div class="min-w-0">
                  <p class="font-medium truncate">{{ item.index + 1 }}. {{ item.testTypeName }}</p>
                  <p v-if="item.token === token" class="text-[11px] text-muted-foreground">Baru saja diselesaikan</p>
                  <p v-else-if="item.takePath === battery.nextTakePath" class="text-[11px] text-primary">Siap dikerjakan</p>
                </div>
                <UiBadge :variant="badgeVariant(item.status)" class="text-[10px] shrink-0">
                  {{ statusLabel(item.status) }}
                </UiBadge>
              </li>
            </ul>
          </UiCardContent>
        </UiCard>

        <div class="w-full space-y-2">
          <UiButton class="w-full h-11" @click="goNext">
            Lanjut: {{ battery.nextTestName || 'Tes berikutnya' }}
          </UiButton>
          <p class="text-xs text-center text-muted-foreground">
            Jangan tutup tab ini sampai seluruh paket selesai.
          </p>
        </div>
      </template>

      <!-- Single test / package finished -->
      <template v-else>
        <div class="w-full text-center space-y-4">
          <div class="size-16 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mx-auto">
            <Icon icon="lucide:party-popper" class="size-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div class="space-y-2">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Selesai</p>
            <h2 class="text-2xl font-bold tracking-tight">
              {{ battery && battery.total > 1 ? 'Semua tes selesai' : 'Tes sudah selesai' }}
            </h2>
            <p class="text-sm text-muted-foreground max-w-sm mx-auto">
              {{ battery && battery.total > 1
                ? 'Terima kasih. Seluruh rangkaian tes dalam undangan ini telah diselesaikan dan tercatat.'
                : 'Terima kasih. Jawaban Anda telah tercatat. Link sesi ini tidak dapat dikerjakan ulang.' }}
            </p>
          </div>
        </div>

        <UiCard class="w-full text-left">
          <UiCardHeader class="pb-3">
            <UiCardTitle class="text-sm">Informasi sesi</UiCardTitle>
          </UiCardHeader>
          <UiCardContent class="space-y-3 text-sm">
            <InfoRow label="Peserta" :value="participantName" />
            <InfoRow label="Tes" :value="currentTestName" />
            <InfoRow v-if="battery && battery.total > 1" label="Paket" :value="`${battery.completedCount} / ${battery.total} tes`" />
            <InfoRow label="Soal dijawab" :value="answeredLabel" />
            <InfoRow label="Waktu pengerjaan" :value="durationLabel" />
            <InfoRow label="Status" value="Selesai & tersimpan" />
            <InfoRow label="Selesai pada" :value="completedAtLabel" />
          </UiCardContent>
        </UiCard>

        <UiCard v-if="battery?.items?.length > 1" class="w-full text-left">
          <UiCardHeader class="pb-2">
            <UiCardTitle class="text-sm">Rincian paket</UiCardTitle>
          </UiCardHeader>
          <UiCardContent class="p-0">
            <ul class="divide-y">
              <li
                v-for="item in battery.items"
                :key="item.token"
                class="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span class="truncate font-medium">{{ item.index + 1 }}. {{ item.testTypeName }}</span>
                <UiBadge :variant="badgeVariant(item.status)" class="text-[10px] shrink-0">
                  {{ statusLabel(item.status) }}
                </UiBadge>
              </li>
            </ul>
          </UiCardContent>
        </UiCard>

        <UiCard class="w-full text-left border-dashed">
          <UiCardContent class="py-4 text-sm text-muted-foreground space-y-2">
            <p class="font-medium text-foreground">Yang perlu Anda ketahui</p>
            <ul class="space-y-1.5 text-xs list-disc list-inside">
              <li>Jawaban Anda sudah tersimpan dan akan diperiksa oleh administrator / psikolog yang menyelenggarakan tes ini.</li>
              <li>Hasil dan interpretasi resmi akan disampaikan langsung oleh psikolog / administrator, bukan lewat halaman ini.</li>
              <li>Membuka ulang link sesi ini hanya menampilkan status selesai.</li>
              <li v-if="joinPath">Link undangan publik (`/join/...`) dapat dibuka lagi untuk peserta baru — form registrasi akan muncul.</li>
              <li>Anda boleh menutup tab ini sekarang.</li>
            </ul>
          </UiCardContent>
        </UiCard>

        <div v-if="joinPath" class="w-full">
          <UiButton variant="ghost" class="w-full" @click="goJoinFresh">
            Kembali ke halaman registrasi
          </UiButton>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { clearParticipantClientState } from '~~/utils/participantSession'

definePageMeta({ layout: false })

const InfoRow = (props) => h('div', { class: 'flex justify-between gap-3' }, [
  h('span', { class: 'text-muted-foreground shrink-0' }, props.label),
  h('span', { class: 'font-medium text-right break-words' }, props.value || '—'),
])
InfoRow.props = { label: String, value: [String, Number] }

const route = useRoute()
const token = route.params.token

const loading = ref(true)
const error = ref('')
const session = ref(null)
const battery = ref(null)

const currentTestName = computed(() => session.value?.testType?.name || 'Tes')
const participantName = computed(() => session.value?.participantName || '—')
const joinPath = computed(() => battery.value?.joinPath || null)
const completedAtLabel = computed(() => {
  const raw = session.value?.completedAt || session.value?.lastActivity
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const answeredLabel = computed(() => {
  const total = session.value?.testType?.questions?.length
  if (!total) return '—'
  const answered = Object.keys(session.value?.answers || {}).length
  return `${answered} / ${total}`
})

const durationLabel = computed(() => {
  const start = session.value?.startedAt
  const end = session.value?.completedAt
  if (!start || !end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours} jam ${minutes} menit`
  return `${minutes} menit`
})

function statusLabel(s) {
  if (s === 'completed' || s === 'verified') return 'Selesai'
  if (s === 'in_progress') return 'Berjalan'
  if (s === 'abandoned') return 'Hangus'
  return 'Menunggu'
}

function badgeVariant(s) {
  if (s === 'completed' || s === 'verified') return 'default'
  if (s === 'abandoned') return 'destructive'
  if (s === 'in_progress') return 'secondary'
  return 'outline'
}

onMounted(async () => {
  clearParticipantClientState()
  try {
    const data = await $fetch(`/api/sessions/token/${token}`)
    const s = data.session

    if (!['completed', 'verified'].includes(s.status)) {
      error.value = 'Sesi ini belum diselesaikan.'
      return
    }

    session.value = s
    battery.value = data.battery
  } catch (err) {
    error.value = err?.data?.message || err?.message || 'Gagal memuat status'
  } finally {
    loading.value = false
  }
})

async function goNext() {
  const path = battery.value?.nextTakePath
  if (!path) return
  clearParticipantClientState()
  await navigateTo(path, { replace: true })
}

async function goJoinFresh() {
  clearParticipantClientState()
  if (joinPath.value) {
    await navigateTo(joinPath.value, { replace: true })
  }
}
</script>
