<template>
  <div class="max-w-4xl space-y-4 md:space-y-6">
    <div v-if="loading" class="text-sm text-muted-foreground text-center py-16">Loading...</div>
    <div v-else-if="loadError" class="text-sm text-destructive text-center py-16">{{ loadError }}</div>

    <template v-else>
      <div class="flex items-center gap-3">
        <UiButton variant="ghost" size="icon" class="size-8" @click="navigateTo(`/admin/psikograms/${id}`)">
          <Icon icon="lucide:arrow-left" class="size-4" />
        </UiButton>
        <div class="min-w-0">
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Edit Psikogram</h1>
          <p class="text-sm text-muted-foreground">{{ form.participant.name }}</p>
        </div>
      </div>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle class="text-base">Biodata Peserta</UiCardTitle>
        </UiCardHeader>
        <UiCardContent class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <UiLabel>Nama</UiLabel>
            <UiInput v-model="form.participant.name" class="h-10" required />
          </div>
          <div class="space-y-2">
            <UiLabel>Tanggal Lahir</UiLabel>
            <UiInput v-model="form.participant.birthDate" type="date" class="h-10" />
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
            <UiInput v-model="form.participant.education" class="h-10" />
          </div>
          <div class="space-y-2">
            <UiLabel>Perusahaan</UiLabel>
            <UiInput v-model="form.participant.corporate" class="h-10" />
          </div>
        </UiCardContent>
      </UiCard>

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
            <UiTextarea v-model="form.sections[section.key].conclusion" rows="3" />
          </div>
        </UiCardContent>
      </UiCard>

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

      <UiCard>
        <UiCardHeader>
          <UiCardTitle class="text-base">Catatan Internal</UiCardTitle>
        </UiCardHeader>
        <UiCardContent>
          <UiTextarea v-model="form.notes" rows="3" placeholder="Catatan untuk pemeriksa (tidak tampil di laporan cetak)" />
        </UiCardContent>
      </UiCard>

      <div v-if="submitError" class="text-xs text-destructive">{{ submitError }}</div>

      <div class="flex justify-end gap-2 pb-6">
        <UiButton variant="outline" :disabled="saving" @click="save('draft')">
          <Icon icon="lucide:save" class="size-4 mr-1" />
          Simpan sebagai Draft
        </UiButton>
        <UiButton :disabled="saving" @click="save('final')">
          <Icon icon="lucide:check" class="size-4 mr-1" />
          Simpan &amp; Finalisasi
        </UiButton>
      </div>
    </template>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const sectionMeta = [
  { key: 'kecerdasan', label: 'A. Kecerdasan' },
  { key: 'sikapKerja', label: 'B. Sikap dan Cara Kerja' },
  { key: 'kepribadian', label: 'C. Kepribadian' },
  { key: 'kemampuanBelajar', label: 'D. Kemampuan Belajar' },
]

const route = useRoute()
const id = route.params.id
const { getAuthHeaders } = useAuth()
const toast = useToast()

const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const submitError = ref('')

const form = reactive({
  examDate: '',
  participant: { name: '', birthDate: '', education: '', corporate: '' },
  sections: {},
  recommendation: '',
  notes: '',
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

async function load() {
  try {
    const data = await $fetch(`/api/admin/psikograms/${id}`, { headers: getAuthHeaders() })
    const p = data.psikogram
    form.examDate = p.examDate
    form.participant = {
      name: p.participant?.name || '',
      birthDate: p.participant?.birthDate ? String(p.participant.birthDate).split('T')[0] : '',
      education: p.participant?.education || '',
      corporate: p.participant?.corporate || '',
    }
    form.sections = p.sections || {}
    form.recommendation = p.recommendation || ''
    form.notes = p.notes || ''
  } catch (err) {
    loadError.value = err?.data?.message || 'Failed to load psikogram'
  } finally {
    loading.value = false
  }
}

async function save(status) {
  submitError.value = ''
  saving.value = true
  try {
    await $fetch(`/api/admin/psikograms/${id}`, {
      method: 'PUT',
      body: {
        examDate: form.examDate,
        participant: { ...form.participant },
        sections: form.sections,
        recommendation: form.recommendation || null,
        status,
        notes: form.notes || null,
      },
      headers: getAuthHeaders(),
    })
    toast.success(status === 'final' ? 'Psikogram difinalisasi' : 'Perubahan disimpan')
    navigateTo(`/admin/psikograms/${id}`)
  } catch (err) {
    submitError.value = err?.data?.message || err?.message || 'Gagal menyimpan perubahan'
    toast.error(submitError.value)
  } finally {
    saving.value = false
  }
}

await load()
</script>
