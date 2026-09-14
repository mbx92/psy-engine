<template>
  <form class="space-y-4" @submit.prevent="save">
    <div>
      <h3 class="text-lg font-semibold">Rate Limit</h3>
      <p class="text-sm text-muted-foreground">Batasi percobaan login dan klaim undangan per alamat IP.</p>
      <p class="text-xs text-muted-foreground mt-2">Pengguna pada jaringan yang sama dapat berbagi kuota. Penyimpanan pengaturan memulai ulang periode pembatasan.</p>
    </div>
    <p v-if="loading" class="text-sm text-muted-foreground" role="status">Memuat pengaturan...</p>
    <template v-else-if="loaded">
      <UiCard v-for="item in policies" :key="item.key">
        <UiCardHeader>
          <div class="flex items-center justify-between gap-4">
            <div>
              <UiCardTitle class="text-base">{{ item.label }}</UiCardTitle>
              <UiCardDescription>{{ item.description }}</UiCardDescription>
            </div>
            <UiSwitch v-model="form[item.key].enabled" :aria-label="`Aktifkan batas ${item.label}`" :disabled="!canEdit || saving" />
          </div>
        </UiCardHeader>
        <UiCardContent class="space-y-3">
          <p v-if="!form[item.key].enabled" class="text-sm text-amber-700 dark:text-amber-400">Pembatasan {{ item.label.toLowerCase() }} dinonaktifkan.</p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <UiLabel :for="`${item.key}-max`">Maksimum percobaan</UiLabel>
              <UiInput :id="`${item.key}-max`" v-model="form[item.key].max" type="number" min="1" max="10000" step="1" required :disabled="!canEdit || saving || !form[item.key].enabled" />
            </div>
            <div class="space-y-2">
              <UiLabel :for="`${item.key}-minutes`">Periode (menit)</UiLabel>
              <UiInput :id="`${item.key}-minutes`" v-model="form[item.key].windowMinutes" type="number" min="1" max="1440" step="1" required :disabled="!canEdit || saving || !form[item.key].enabled" />
            </div>
          </div>
        </UiCardContent>
      </UiCard>
      <div v-if="canEdit" class="flex flex-wrap gap-2">
        <UiButton type="submit" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan Rate Limit' }}</UiButton>
        <UiButton type="button" variant="outline" :disabled="saving" @click="restoreDefaults">Gunakan Nilai Awal</UiButton>
      </div>
    </template>
    <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>
    <UiButton v-if="!loaded && !loading" type="button" variant="outline" @click="load">Coba Lagi</UiButton>
    <p v-if="success" class="text-sm text-green-700 dark:text-green-400" role="status">{{ success }}</p>
  </form>
</template>

<script setup>
import { defaultRateLimitSettings, rateLimitSettingsSchema } from '~/utils/rateLimitSettings'
const { can, getAuthHeaders } = useAuth()
const canEdit = computed(() => can('settings:update'))
const form = ref(defaultRateLimitSettings())
const loading = ref(true), loaded = ref(false), saving = ref(false)
const error = ref(''), success = ref('')
const policies = [
  { key: 'login', label: 'Login', description: 'Setiap permintaan masuk, termasuk login yang berhasil, dihitung.' },
  { key: 'invitationClaim', label: 'Klaim Undangan', description: 'Membatasi pengiriman biodata untuk memulai tes melalui tautan undangan.' },
]
async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await $fetch('/api/admin/rate-limits', { headers: getAuthHeaders() })
    form.value = data.settings
    loaded.value = true
  } catch (err) { error.value = err?.data?.message || 'Gagal memuat pengaturan rate limit.' }
  finally { loading.value = false }
}
function restoreDefaults() {
  form.value = defaultRateLimitSettings()
  error.value = ''
  success.value = 'Nilai awal dipilih. Klik Simpan Rate Limit untuk menerapkannya.'
}
async function save() {
  if (!canEdit.value || saving.value || !loaded.value) return
  error.value = ''; success.value = ''
  const body = Object.fromEntries(policies.map(({ key }) => [key, {
    enabled: form.value[key].enabled,
    max: Number(form.value[key].max),
    windowMinutes: Number(form.value[key].windowMinutes),
  }]))
  if (!rateLimitSettingsSchema.safeParse(body).success) {
    error.value = 'Isi maksimum percobaan dengan bilangan bulat 1–10.000 dan periode 1–1.440 menit.'
    return
  }
  saving.value = true
  try {
    const data = await $fetch('/api/admin/rate-limits', { method: 'PUT', headers: getAuthHeaders(), body })
    form.value = data.settings
    success.value = 'Pengaturan rate limit disimpan dan langsung berlaku.'
  } catch (err) { error.value = err?.data?.message || 'Gagal menyimpan pengaturan rate limit.' }
  finally { saving.value = false }
}
onMounted(load)
</script>
