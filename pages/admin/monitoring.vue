<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-6">
        <div class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Icon icon="lucide:monitor" class="size-5" /></div>
          <div><h1 class="text-lg font-semibold tracking-tight">Monitoring sesi</h1><p class="text-xs text-muted-foreground">Ruang kendali pelaksanaan tes</p></div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="mr-2 inline-flex items-center gap-2 text-xs" role="status">
            <span class="size-2 rounded-full" :class="error ? 'bg-amber-500' : lastUpdated ? 'bg-emerald-500' : 'bg-muted-foreground'" />
            {{ error ? 'Koneksi terganggu' : lastUpdated ? 'Pembaruan aktif · 3 detik' : 'Menghubungkan…' }}
          </span>
          <UiButton variant="outline" size="sm" @click="toggleFullscreen"><Icon icon="lucide:maximize" class="mr-2 size-4" />Layar penuh</UiButton>
          <UiButton variant="outline" size="sm" as-child><NuxtLink to="/admin/sessions">Kembali ke sesi</NuxtLink></UiButton>
          <ThemeSwitcher />
        </div>
      </div>
    </header>

    <main class="space-y-5 p-4 lg:p-6">
      <div v-if="!can('sessions:read')" class="rounded-xl border p-8 text-center">Anda tidak memiliki akses monitoring sesi.</div>
      <template v-else>
        <div class="flex flex-wrap items-end justify-between gap-2">
          <div><h2 class="text-2xl font-semibold tracking-tight">Seluruh peserta, satu layar.</h2><p class="mt-1 text-sm text-muted-foreground">Semua sesi aktif dan sesi yang diperbarui dalam 24 jam terakhir.</p></div>
          <p class="text-xs text-muted-foreground">{{ lastUpdated ? `Sinkron ${formatTime(lastUpdated)} · Respons ${latency} ms` : 'Menunggu data server' }}</p>
        </div>

        <div v-if="error" role="alert" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p>{{ error }} <span v-if="lastUpdated">Data terakhir dipertahankan; status peserta mungkin sudah berubah.</span></p>
          <UiButton size="sm" variant="outline" :disabled="loading" @click="refresh">Coba lagi</UiButton>
        </div>

        <div class="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <div v-for="stat in stats" :key="stat.label" class="rounded-xl border bg-card p-4">
            <p class="text-xs text-muted-foreground">{{ stat.label }}</p>
            <p class="mt-2 text-3xl font-semibold tabular-nums" :class="stat.alert ? 'text-amber-600 dark:text-amber-400' : ''">{{ lastUpdated ? stat.value : '—' }}</p>
          </div>
        </div>

        <div class="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <section class="min-w-0 rounded-xl border bg-card" aria-labelledby="participants-title">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <h2 id="participants-title" class="font-semibold">Peserta <span class="ml-1 text-sm font-normal text-muted-foreground">{{ filtered.length }}</span></h2>
              <div class="flex w-full flex-wrap gap-2 sm:w-auto">
                <UiInput v-model="search" aria-label="Cari peserta atau tes" placeholder="Cari peserta atau tes…" class="h-9 w-full sm:w-52" />
                <select v-model="filter" aria-label="Filter sesi" class="h-9 rounded-md border bg-background px-3 text-sm">
                  <option value="active">Sesi aktif</option><option value="attention">Perlu diperiksa</option><option value="all">Semua sesi</option><option value="completed">Selesai</option>
                </select>
                <select v-model="testFilter" aria-label="Filter jenis tes" class="h-9 max-w-full rounded-md border bg-background px-3 text-sm">
                  <option value="">Semua tes</option><option v-for="test in testOptions" :key="test.id" :value="test.id">{{ test.name }}</option>
                </select>
              </div>
            </div>
            <div v-if="loading && !lastUpdated" class="p-12 text-center text-sm text-muted-foreground">Memuat sesi peserta…</div>
            <div v-else-if="!filtered.length" class="p-12 text-center text-sm text-muted-foreground">{{ error ? 'Data peserta belum tersedia.' : 'Tidak ada sesi yang sesuai filter.' }}</div>
            <div v-else class="overflow-x-auto">
              <table class="w-full min-w-[860px] text-left text-sm">
                <thead class="bg-muted/40 text-xs text-muted-foreground"><tr><th class="px-4 py-3">Peserta / tes</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Koneksi / tab</th><th class="px-4 py-3">Sedang dibuka</th><th class="px-4 py-3">Jawaban tersimpan</th><th class="px-4 py-3">Penyimpanan / sinyal</th></tr></thead>
                <tbody class="divide-y">
                  <tr v-for="s in visibleSessions" :key="s.id" class="hover:bg-muted/30" :class="needsAttention(s, now) ? 'bg-amber-500/5' : ''">
                    <td class="px-4 py-4"><NuxtLink :to="`/admin/sessions/${s.id}`" target="_blank" class="font-semibold underline-offset-4 hover:underline">{{ s.participantName }} ↗</NuxtLink><p class="mt-1 text-xs text-muted-foreground">{{ s.testTypeName }}</p></td>
                    <td class="px-4 py-4"><span class="rounded-full bg-muted px-2 py-1 text-xs">{{ statusLabel(s.status) }}</span><p v-if="s.startedAt" class="mt-2 text-xs text-muted-foreground">Mulai {{ formatTime(s.startedAt) }}</p></td>
                    <td class="px-4 py-4"><span class="inline-flex items-center gap-1.5 text-xs"><span class="size-2 rounded-full" :class="connectionColor(s)" />{{ connectionLabel(s) }}</span></td>
                    <td class="px-4 py-4"><p class="font-medium">{{ questionLabel(s) }}</p><p v-if="s.monitoring?.subtest" class="mt-1 text-xs text-muted-foreground">{{ s.monitoring.subtest }}</p></td>
                    <td class="px-4 py-4"><p class="text-xs tabular-nums">{{ s.answeredCount }} / {{ s.totalQuestions }}</p><div class="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-muted"><div class="h-full bg-primary transition-all" :style="{ width: `${Math.min(100, s.totalQuestions ? s.answeredCount / s.totalQuestions * 100 : 0)}%` }" /></div></td>
                    <td class="px-4 py-4"><p class="text-xs" :class="s.monitoring?.saveState === 'error' ? 'font-semibold text-destructive' : ''">{{ saveLabels[s.monitoring?.saveState] || 'Belum ada laporan' }}</p><p class="mt-1 text-xs text-muted-foreground">{{ age(s.monitoring?.receivedAt) }}</p></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="flex items-center justify-between gap-2 border-t p-3 text-xs text-muted-foreground"><span>Halaman {{ page }} / {{ pageCount }}</span><div class="flex gap-2"><UiButton size="sm" variant="outline" :disabled="page <= 1" @click="page--">Sebelumnya</UiButton><UiButton size="sm" variant="outline" :disabled="page >= pageCount" @click="page++">Berikutnya</UiButton></div></div>
          </section>

          <section class="min-w-0 rounded-xl border bg-card" aria-labelledby="activity-title">
            <div class="border-b p-4"><h2 id="activity-title" class="font-semibold">Aktivitas terbaru</h2><p class="mt-1 text-xs text-muted-foreground">60 kejadian terakhir · seluruh sesi · 24 jam</p></div>
            <div class="max-h-[680px] overflow-y-auto p-4">
              <p v-if="!logs.length" class="py-8 text-center text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
              <div v-for="log in logs" :key="log.id" class="relative border-l pb-5 pl-4 last:pb-0">
                <span class="absolute -left-1 top-1 size-2 rounded-full" :class="log.level === 'info' ? 'bg-primary' : 'bg-amber-500'" />
                <div class="flex justify-between gap-2"><NuxtLink :to="`/admin/sessions/${log.sessionId}`" target="_blank" class="text-xs font-semibold hover:underline">{{ log.participantName }}</NuxtLink><time class="shrink-0 text-[11px] text-muted-foreground">{{ formatTime(log.createdAt) }}</time></div>
                <p class="mt-1 break-words text-xs leading-relaxed text-muted-foreground">{{ log.message || log.eventType }}</p>
              </div>
            </div>
          </section>
        </div>
        <p class="text-xs leading-relaxed text-muted-foreground">Sinyal peserta dikirim setiap 15 detik. “Tidak ada sinyal” berarti lebih dari 45 detik tanpa heartbeat, bukan kepastian perangkat offline. Status tab dan penyimpanan berasal dari browser peserta. Halaman ini memantau aktivitas di aplikasi tes.</p>
      </template>
    </main>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { statusLabel } from '~~/utils/sessionStatus'
import { connectionState, needsAttention } from '~~/utils/sessionMonitoring'

definePageMeta({ layout: false, middleware: 'auth' })
useHead({ title: 'Monitoring sesi' })
const { can, getAuthHeaders } = useAuth()
const sessions = ref([]), logs = ref([]), search = ref(''), filter = ref('active'), testFilter = ref('')
const loading = ref(false), error = ref(''), lastUpdated = ref(null), latency = ref(0), now = ref(Date.now()), page = ref(1)
let timer, clock, controller, disposed = false, serverOffset = 0
const saveLabels = { idle: 'Belum menyimpan', saving: 'Menyimpan…', saved: 'Tersimpan', error: 'Gagal menyimpan' }
const testOptions = computed(() => [...new Map(sessions.value.map(s => [s.testTypeId, { id: s.testTypeId, name: s.testTypeName }])).values()])
const stats = computed(() => [
  { label: 'Sesi dalam pantauan', value: sessions.value.length },
  { label: 'Sedang mengerjakan', value: sessions.value.filter(s => s.status === 'in_progress').length },
  { label: 'Menunggu mulai', value: sessions.value.filter(s => s.status === 'pending').length },
  { label: 'Perlu diperiksa', value: sessions.value.filter(s => needsAttention(s, now.value)).length, alert: true },
  { label: 'Selesai', value: sessions.value.filter(s => ['completed', 'verified'].includes(s.status)).length },
])
const filtered = computed(() => sessions.value.filter(s => {
  if (filter.value === 'active' && !['pending', 'in_progress'].includes(s.status)) return false
  if (filter.value === 'attention' && !needsAttention(s, now.value)) return false
  if (filter.value === 'completed' && !['completed', 'verified'].includes(s.status)) return false
  return (!testFilter.value || s.testTypeId === testFilter.value) && `${s.participantName} ${s.testTypeName}`.toLowerCase().includes(search.value.trim().toLowerCase())
}))
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / 50)))
const visibleSessions = computed(() => filtered.value.slice((page.value - 1) * 50, page.value * 50))
watch([search, filter, testFilter], () => { page.value = 1 })
watch(pageCount, count => { page.value = Math.min(page.value, count) })
function connectionLabel(s) { return ({ online: 'Terhubung', hidden: 'Tab tersembunyi', stale: 'Tidak ada sinyal', unknown: 'Belum ada sinyal', ended: 'Sesi berakhir' })[connectionState(s, now.value)] }
function connectionColor(s) { return ({ online: 'bg-emerald-500', hidden: 'bg-amber-500', stale: 'bg-red-500', unknown: 'bg-muted-foreground', ended: 'bg-muted-foreground' })[connectionState(s, now.value)] }
function questionLabel(s) {
  if (s.status !== 'in_progress') return '—'
  if (s.monitoring?.instruction) return 'Petunjuk subtes'
  return s.monitoring?.questionNumber != null ? `Soal ${s.monitoring.questionNumber}` : 'Belum dilaporkan'
}
function formatTime(value) { return new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
function age(value) { if (!value) return 'Belum ada heartbeat'; const seconds = Math.max(0, Math.floor((now.value - Date.parse(value)) / 1000)); return seconds < 60 ? `Sinyal ${seconds} dtk lalu` : `Sinyal ${Math.floor(seconds / 60)} mnt lalu` }
async function toggleFullscreen() { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen() } catch { /* Fullscreen is optional in embedded browsers. */ } }
async function refresh() {
  if (disposed || loading.value || !can('sessions:read')) return
  clearTimeout(timer)
  loading.value = true
  controller = new AbortController()
  const started = performance.now()
  try {
    const data = await $fetch('/api/sessions/monitoring', { headers: getAuthHeaders(), signal: controller.signal, timeout: 10000, retry: 0 })
    if (disposed) return
    latency.value = Math.round(performance.now() - started)
    sessions.value = data.sessions
    logs.value = data.logs
    lastUpdated.value = data.serverTime
    serverOffset = Date.parse(data.serverTime) - Date.now()
    now.value = Date.now() + serverOffset
    error.value = ''
  } catch (err) {
    if (!disposed) error.value = err.statusCode === 403 ? 'Akses monitoring ditolak.' : err.statusCode === 401 ? 'Sesi login berakhir. Silakan masuk kembali.' : 'Pembaruan gagal. Sistem akan mencoba menghubungkan ulang.'
  } finally {
    loading.value = false
    if (!disposed) timer = setTimeout(refresh, 3000)
  }
}
onMounted(() => { refresh(); clock = setInterval(() => { now.value = Date.now() + serverOffset }, 1000) })
onBeforeUnmount(() => { disposed = true; clearTimeout(timer); clearInterval(clock); controller?.abort() })
</script>
