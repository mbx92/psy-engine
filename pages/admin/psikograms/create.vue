<template>
  <div class="max-w-4xl space-y-4 md:space-y-6">
    <div class="flex items-center gap-3">
      <UiButton variant="ghost" size="icon" class="size-8" @click="navigateTo('/admin/psikograms')">
        <Icon icon="lucide:arrow-left" class="size-4" />
      </UiButton>
      <div class="min-w-0">
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Buat Psikogram Baru</h1>
      </div>
    </div>

    <!-- Biodata Peserta -->
    <UiCard>
      <UiCardHeader>
        <UiCardTitle class="text-base">Biodata Peserta</UiCardTitle>
      </UiCardHeader>
      <UiCardContent class="space-y-4">
        <div class="space-y-2 relative">
          <UiLabel>Pilih Peserta (dari sesi tes selesai)</UiLabel>
          <UiInput
            v-model="searchQuery"
            placeholder="Cari nama peserta..."
            class="h-10"
            @focus="showDropdown = true"
            @blur="onSearchBlur"
          />
          <div
            v-if="showDropdown && filteredSessions.length"
            class="absolute z-50 top-full mt-1 w-full bg-popover border rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            <div
              v-for="s in filteredSessions"
              :key="s.id"
              class="flex items-center justify-between gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
              @mousedown.prevent="onSessionSelect(s)"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium truncate">{{ s.participantName }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ s.testTypeName }}</p>
              </div>
              <UiBadge :variant="statusVariant(s.status)" class="text-[10px] shrink-0">{{ statusLabel(s.status) }}</UiBadge>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">Hanya menampilkan sesi yang sudah selesai/terverifikasi.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <UiLabel>Nama</UiLabel>
            <UiInput v-model="form.participant.name" class="h-10" required />
          </div>
          <div class="space-y-2">
            <UiLabel>Tanggal Lahir</UiLabel>
            <UiInput v-model="form.participant.birthDate" type="date" class="h-10" />
            <p v-if="form.participantId" class="text-xs text-muted-foreground">Terisi otomatis dari data peserta, dapat diubah bila perlu.</p>
          </div>
          <div class="space-y-2">
            <UiLabel>Tanggal Pemeriksaan</UiLabel>
            <UiInput v-model="form.examDate" type="date" class="h-10" />
          </div>
          <div class="space-y-2">
            <UiLabel>Usia</UiLabel>
            <UiInput :model-value="calculatedAge" readonly class="h-10 bg-muted" />
          </div>
          <div class="space-y-2">
            <UiLabel>Pendidikan Terakhir</UiLabel>
            <UiInput v-model="form.participant.education" placeholder="e.g. S1 Sipil, SMA IPA" class="h-10" />
          </div>
          <div class="space-y-2">
            <UiLabel>Perusahaan</UiLabel>
            <UiInput v-model="form.participant.corporate" placeholder="Nama perusahaan" class="h-10" />
          </div>
        </div>
      </UiCardContent>
    </UiCard>

    <!-- Analysis status -->
    <UiCard v-if="form.sessionId">
      <UiCardHeader class="flex-row items-center justify-between space-y-0">
        <UiCardTitle class="text-base">Status Analisis PAPI</UiCardTitle>
        <UiButton variant="outline" size="sm" :disabled="analyzing" @click="analyzeSession">
          <Icon icon="lucide:refresh-cw" class="size-4 mr-1" :class="{ 'animate-spin': analyzing }" />
          {{ analyzing ? 'Menganalisis...' : 'Analisis Ulang' }}
        </UiButton>
      </UiCardHeader>
      <UiCardContent>
        <div v-if="analyzing" class="text-sm text-muted-foreground py-2">Menganalisis jawaban PAPI dan menghitung rating aspek...</div>
        <div v-else-if="analysisResult" class="space-y-3">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div class="rounded-lg border p-3">
              <p class="text-xs text-muted-foreground">Overall</p>
              <p class="text-xl font-bold text-primary">{{ analysisResult.overallPercent }}%</p>
            </div>
            <div v-for="key in ['kecerdasan','sikapKerja','kepribadian','kemampuanBelajar']" :key="key" class="rounded-lg border p-3">
              <p class="text-xs text-muted-foreground capitalize">{{ sectionLabels[key] }}</p>
              <p class="text-lg font-semibold">{{ analysisResult.sectionSummary[key] }}%</p>
            </div>
          </div>
          <p class="text-xs text-green-600">Rating aspek telah diisi otomatis berdasarkan jawaban PAPI. Anda dapat mengubah rating secara manual jika diperlukan.</p>
        </div>
        <p v-else-if="analysisNote" class="text-sm text-muted-foreground">{{ analysisNote }}</p>
      </UiCardContent>
    </UiCard>

    <!-- Sections -->
    <UiCard v-for="section in sectionMeta" :key="section.key">
      <UiCardHeader>
        <UiCardTitle class="text-base">{{ section.label }}</UiCardTitle>
      </UiCardHeader>
      <UiCardContent class="space-y-3">
        <PsikogramAspekItem
          v-for="(item, i) in form.sections[section.key].items"
          :key="i"
          :title="item.title"
          :description="item.description"
          v-model:rating="item.rating"
        />
        <div class="space-y-2 pt-2">
          <UiLabel>Kesimpulan</UiLabel>
          <UiTextarea v-model="form.sections[section.key].conclusion" rows="3" :placeholder="`Tulis kesimpulan untuk aspek ${section.label.toLowerCase()}...`" />
        </div>
      </UiCardContent>
    </UiCard>

    <!-- Rekomendasi -->
    <UiCard>
      <UiCardHeader>
        <UiCardTitle class="text-base">Rekomendasi</UiCardTitle>
      </UiCardHeader>
      <UiCardContent>
        <div class="flex gap-3">
          <button
            type="button"
            class="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm"
            :class="form.recommendation === 'recommended' ? 'border-emerald-600 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400' : ''"
            @click="form.recommendation = 'recommended'"
          >
            <Icon icon="lucide:check" class="size-4" />
            Disarankan
          </button>
          <button
            type="button"
            class="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm"
            :class="form.recommendation === 'not_recommended' ? 'border-destructive bg-destructive/10 text-destructive' : ''"
            @click="form.recommendation = 'not_recommended'"
          >
            <Icon icon="lucide:x" class="size-4" />
            Tidak Disarankan
          </button>
        </div>
      </UiCardContent>
    </UiCard>

    <div v-if="submitError" class="text-xs text-destructive">{{ submitError }}</div>

    <div class="flex justify-end gap-2 pb-6">
      <UiButton variant="outline" :disabled="saving" @click="save('draft')">
        <Icon icon="lucide:save" class="size-4 mr-1" />
        Simpan Draft
      </UiButton>
      <UiButton :disabled="saving" @click="save('final')">
        <Icon icon="lucide:check" class="size-4 mr-1" />
        Simpan Final
      </UiButton>
    </div>
  </div>
</template>

<script setup>
import { statusLabel, statusVariant } from '~~/utils/sessionStatus'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { getAuthHeaders } = useAuth()
const toast = useToast()

const sectionMeta = [
  { key: 'kecerdasan', label: 'A. Kecerdasan' },
  { key: 'sikapKerja', label: 'B. Sikap dan Cara Kerja' },
  { key: 'kepribadian', label: 'C. Kepribadian' },
  { key: 'kemampuanBelajar', label: 'D. Kemampuan Belajar' },
]
const sectionLabels = {
  kecerdasan: 'Kecerdasan',
  sikapKerja: 'Sikap Kerja',
  kepribadian: 'Kepribadian',
  kemampuanBelajar: 'Kemampuan Belajar',
}

const defaultSections = {
  kecerdasan: {
    items: [
      { title: 'Logika Berpikir', description: 'Kemampuan menggunakan pemikiran yang bersifat taktis untuk memecahkan masalah yang dihadapi.', rating: '' },
      { title: 'Kemampuan Analisa', description: 'Kemampuan untuk memahami situasi dengan menguraikannya menjadi bagian-bagian yang lebih kecil.', rating: '' },
      { title: 'Kemampuan Numerikal', description: 'Kemampuan untuk berpikir praktis dalam memahami konsep angka dan hitungan.', rating: '' },
      { title: 'Kemampuan Verbal', description: 'Kemampuan untuk memahami konsep dan pola dalam bentuk kata-kata.', rating: '' },
    ],
    conclusion: '',
  },
  sikapKerja: {
    items: [
      { title: 'Orientasi Hasil', description: 'Kemampuan untuk mempertahankan komitmen untuk menyelesaikan tugas secara bertanggung jawab.', rating: '' },
      { title: 'Fleksibilitas', description: 'Kemampuan untuk menyesuaikan diri dalam menghadapi permasalahan.', rating: '' },
      { title: 'Sistematika Kerja', description: 'Kemampuan untuk merencanakan hingga mengorganisasikan cara kerja.', rating: '' },
    ],
    conclusion: '',
  },
  kepribadian: {
    items: [
      { title: 'Motivasi Berprestasi', description: 'Kemampuan untuk menunjukkan prestasi dan mencapai target.', rating: '' },
      { title: 'Kerjasama', description: 'Kemampuan untuk menjalin, membina dan mengoptimalkan hubungan kerja yang efektif.', rating: '' },
      { title: 'Keterampilan Interpersonal', description: 'Kemampuan untuk menjalin hubungan sosial dan mampu memahami kebutuhan orang lain.', rating: '' },
      { title: 'Stabilitas Emosi', description: 'Kemampuan untuk memahami dan mengontrol emosi.', rating: '' },
    ],
    conclusion: '',
  },
  kemampuanBelajar: {
    items: [
      { title: 'Pengembangan Diri', description: 'Kemampuan untuk meningkatkan pengetahuan dan menyempurnakan keterampilan diri.', rating: '' },
      { title: 'Mengelola Perubahan', description: 'Kemampuan dalam menyesuaikan diri dengan situasi baru.', rating: '' },
    ],
    conclusion: '',
  },
}

const form = reactive({
  participantId: '',
  sessionId: '',
  examDate: new Date().toISOString().split('T')[0],
  participant: { name: '', birthDate: '', education: '', corporate: '' },
  sections: JSON.parse(JSON.stringify(defaultSections)),
  recommendation: '',
})

const sessionsList = ref([])
const searchQuery = ref('')
const showDropdown = ref(false)
const analyzing = ref(false)
const analysisResult = ref(null)
const analysisNote = ref('')
const saving = ref(false)
const submitError = ref('')

const eligibleSessions = computed(() =>
  sessionsList.value.filter((s) => ['completed', 'verified'].includes(s.status)),
)

const filteredSessions = computed(() => {
  if (!searchQuery.value.trim()) return eligibleSessions.value
  const q = searchQuery.value.trim().toLowerCase()
  return eligibleSessions.value.filter((s) => (s.participantName || '').toLowerCase().includes(q))
})

const calculatedAge = computed(() => {
  if (!form.participant.birthDate) return ''
  const birth = new Date(form.participant.birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return `${age} tahun`
})

function onSearchBlur() {
  setTimeout(() => { showDropdown.value = false }, 200)
}

async function onSessionSelect(s) {
  form.participantId = s.participantId
  form.sessionId = s.id
  form.participant.name = s.participantName || ''
  searchQuery.value = s.participantName
  showDropdown.value = false
  await Promise.all([loadParticipantBiodata(s.participantId), analyzeSession()])
}

async function loadParticipantBiodata(participantId) {
  try {
    const data = await $fetch(`/api/participants/${participantId}`, { headers: getAuthHeaders() })
    const p = data.participant
    form.participant.name = p.name || form.participant.name
    form.participant.birthDate = p.birthDate ? String(p.birthDate).slice(0, 10) : ''
  } catch {
    // Non-fatal: fall back to manual entry if the participant record can't be fetched
  }
}

async function analyzeSession() {
  if (!form.sessionId) return
  analyzing.value = true
  analysisResult.value = null
  analysisNote.value = ''
  try {
    const data = await $fetch(`/api/admin/psikograms/analyze/${form.sessionId}`, { headers: getAuthHeaders() })
    if (!data.analyzed) {
      analysisNote.value = data.reason || 'Tidak dapat menganalisis sesi ini secara otomatis.'
      return
    }
    analysisResult.value = data
    form.sections = data.sections
    toast.success('Analisis PAPI berhasil, rating aspek terisi otomatis')
  } catch (err) {
    analysisNote.value = err?.data?.message || 'Gagal menganalisis sesi'
  } finally {
    analyzing.value = false
  }
}

async function save(status) {
  if (!form.participantId) {
    submitError.value = 'Pilih peserta terlebih dahulu'
    return
  }
  if (!form.participant.name.trim()) {
    submitError.value = 'Nama peserta wajib diisi'
    return
  }

  submitError.value = ''
  saving.value = true
  try {
    const data = await $fetch('/api/admin/psikograms', {
      method: 'POST',
      body: {
        participantId: form.participantId,
        sessionId: form.sessionId || undefined,
        examDate: form.examDate,
        participant: { ...form.participant },
        sections: form.sections,
        recommendation: form.recommendation || undefined,
        status,
      },
      headers: getAuthHeaders(),
    })
    toast.success(status === 'final' ? 'Psikogram berhasil difinalisasi' : 'Draft psikogram tersimpan')
    navigateTo(`/admin/psikograms/${data.psikogram.id}`)
  } catch (err) {
    submitError.value = err?.data?.message || err?.message || 'Gagal menyimpan psikogram'
    toast.error(submitError.value)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const data = await $fetch('/api/sessions', { headers: getAuthHeaders() })
    sessionsList.value = data.sessions || []
  } catch {
    // Non-fatal: participant picker just stays empty
  }
})
</script>
