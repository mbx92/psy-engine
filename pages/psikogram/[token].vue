<template>
  <div class="min-h-screen bg-white">
    <div class="print-container" :style="themeStyle">
      <div class="toolbar no-print">
        <div class="toolbar-content">
          <h1 class="text-lg font-bold">Hasil Psikogram</h1>
          <button class="print-btn" @click="printPage">
            <Icon icon="lucide:printer" class="size-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-container no-print">Loading...</div>
      <div v-else-if="error" class="loading-container no-print">{{ error }}</div>

      <div v-else-if="psikogram" class="print-wrapper">
        <div class="paper">
          <div class="header">
            <div class="header-content-vertical">
              <div v-if="settings?.showLogo && settings?.logo" class="header-logo-top">
                <img :src="settings.logo" alt="Logo" />
              </div>
              <div class="header-info-center">
                <h1 class="institution-name">{{ settings?.institutionName || 'LEMBAGA PSIKOLOGI' }}</h1>
                <p class="institution-tagline">{{ settings?.tagline || '' }}</p>
                <p class="institution-address">{{ settings?.address || '' }}</p>
                <p class="institution-contact">
                  <span v-if="settings?.institutionPhone">{{ settings.institutionPhone }}</span>
                  <span v-if="settings?.institutionPhone && settings?.institutionEmail"> &bull; </span>
                  <span v-if="settings?.institutionEmail">{{ settings.institutionEmail }}</span>
                </p>
              </div>
            </div>
          </div>

          <div class="report-title">
            <h2>{{ settings?.reportTitle || 'PSIKOGRAM' }}</h2>
            <p>{{ settings?.reportSubtitle || 'Hasil Pemeriksaan Psikologis' }}</p>
          </div>

          <div class="section">
            <h3 class="section-title">BIODATA PESERTA</h3>
            <table class="biodata-table">
              <tbody>
                <tr><td class="label">Nama</td><td class="separator">:</td><td class="value">{{ psikogram.participant?.name || '-' }}</td></tr>
                <tr><td class="label">Tanggal Lahir / Usia</td><td class="separator">:</td><td class="value">{{ formatDate(psikogram.participant?.birthDate) }} / {{ calculateAge(psikogram.participant?.birthDate) }}</td></tr>
                <tr><td class="label">Pendidikan Terakhir</td><td class="separator">:</td><td class="value">{{ psikogram.participant?.education || '-' }}</td></tr>
                <tr><td class="label">Tanggal Pemeriksaan</td><td class="separator">:</td><td class="value">{{ formatDate(psikogram.examDate) }}</td></tr>
              </tbody>
            </table>
          </div>

          <div class="sections">
            <PsikogramSectionTable
              title="A. KECERDASAN"
              :items="psikogram.sections?.kecerdasan?.items || []"
              :conclusion="psikogram.sections?.kecerdasan?.conclusion"
              :primary-color="accentColor"
            />
            <PsikogramSectionTable
              title="B. SIKAP DAN CARA KERJA"
              :items="psikogram.sections?.sikapKerja?.items || []"
              :conclusion="psikogram.sections?.sikapKerja?.conclusion"
              :primary-color="accentColor"
            />
            <PsikogramSectionTable
              title="C. KEPRIBADIAN"
              :items="psikogram.sections?.kepribadian?.items || []"
              :conclusion="psikogram.sections?.kepribadian?.conclusion"
              :primary-color="accentColor"
            />
            <PsikogramSectionTable
              title="D. KEMAMPUAN BELAJAR"
              :items="psikogram.sections?.kemampuanBelajar?.items || []"
              :conclusion="psikogram.sections?.kemampuanBelajar?.conclusion"
              :primary-color="accentColor"
            />
          </div>

          <div class="section">
            <h3 class="section-title">REKOMENDASI</h3>
            <div class="recommendation">
              <label class="rec-option">
                <span class="rec-checkbox"><span v-if="psikogram.recommendation === 'recommended'" class="check-symbol">&#10003;</span></span>
                <span>Disarankan</span>
              </label>
              <label class="rec-option">
                <span class="rec-checkbox"><span v-if="psikogram.recommendation === 'not_recommended'" class="check-symbol">&#10003;</span></span>
                <span>Tidak Disarankan</span>
              </label>
            </div>
          </div>

          <div class="signature-area">
            <div class="signature-box">
              <p class="signature-location">{{ formatLocation(psikogram.examDate) }}</p>
              <div class="signature-image">
                <img v-if="settings?.showSignature && settings?.signature" :src="settings.signature" alt="Signature" />
              </div>
              <div class="signature-name">
                <p class="name">{{ settings?.psychologistName || psikogram.examiner?.name || 'Psikolog' }}</p>
                <p v-if="settings?.licenseNumber" class="license">{{ settings.licenseNumber }}</p>
              </div>
            </div>
          </div>

          <div v-if="settings?.footer || settings?.reportFooter" class="footer">
            <div v-if="settings?.footer" class="footer-image"><img :src="settings.footer" alt="Footer" /></div>
            <p v-if="settings?.reportFooter" class="footer-text">{{ settings.reportFooter }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })

const route = useRoute()
const loading = ref(true)
const error = ref('')
const psikogram = ref(null)
const settings = ref(null)

const accentColor = computed(() => settings.value?.primaryColor || '#16a34a')
const mutedColor = computed(() => settings.value?.secondaryColor || '#6b7280')
const themeStyle = computed(() => ({
  '--psiko-primary': accentColor.value,
  '--psiko-secondary': mutedColor.value,
}))

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatLocation(date) {
  const city = settings.value?.address?.split(',')[0] || ''
  return [city, formatDate(date)].filter(Boolean).join(', ')
}

function calculateAge(birthDate) {
  if (!birthDate) return '-'
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return `${age} tahun`
}

function printPage() {
  window.print()
}

onMounted(async () => {
  try {
    const data = await $fetch(`/api/public/psikograms/${route.params.token}`)
    psikogram.value = data.psikogram
    settings.value = data.settings
  } catch (err) {
    error.value = err?.data?.message || 'Link tidak valid atau sudah kedaluwarsa'
  } finally {
    loading.value = false
  }
})
</script>

<style>
.print-container { min-height: 100vh; background-color: #e5e7eb; color: #000; }
.toolbar { position: sticky; top: 0; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 100; }
.toolbar-content { max-width: 210mm; margin: 0 auto; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; }
.print-btn {
  display: inline-flex; align-items: center; gap: 6px; font-size: 13px; padding: 6px 12px;
  border-radius: 6px; border: 1px solid var(--psiko-primary, #16a34a); background: var(--psiko-primary, #16a34a); color: white; cursor: pointer;
}
.loading-container { display: flex; justify-content: center; align-items: center; min-height: 60vh; color: #6b7280; }
.print-wrapper { padding: 20px; display: flex; justify-content: center; }
.paper { width: 210mm; min-height: 297mm; background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.15); padding: 15mm 20mm; box-sizing: border-box; color: #000; }
.paper * { color: #000; border-color: #000; }

.header { padding-bottom: 12px; border-bottom: 3px solid var(--psiko-primary, #16a34a); margin-bottom: 15px; }
.header-content-vertical { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.header-logo-top img { width: 80px; height: 80px; object-fit: contain; }
.header-info-center { text-align: center; }
.institution-name { font-size: 18px; font-weight: bold; margin: 0; color: var(--psiko-primary, #16a34a) !important; }
.institution-tagline { font-size: 13px; margin: 2px 0; color: var(--psiko-secondary, #6b7280) !important; }
.institution-address { font-size: 11px; margin: 4px 0 0 0; }
.institution-contact { font-size: 11px; margin: 0; }

.report-title { text-align: center; margin-bottom: 15px; }
.report-title h2 { font-size: 22px; font-weight: bold; letter-spacing: 2px; margin: 0; color: var(--psiko-primary, #16a34a) !important; }
.report-title p { font-size: 12px; margin: 4px 0 0 0; }

.section { margin-bottom: 12px; }
.section-title {
  font-size: 11px; font-weight: bold; color: #fff !important;
  background-color: var(--psiko-primary, #16a34a); padding: 4px 8px; margin: 0 0 8px 0;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.sections { margin-bottom: 12px; }

.biodata-table { width: 100%; font-size: 11px; border-collapse: collapse; }
.biodata-table td { border: none; }
.biodata-table .label { width: 140px; padding: 3px 0; }
.biodata-table .separator { width: 15px; text-align: center; }
.biodata-table .value { font-weight: 500; }

.recommendation { display: flex; gap: 30px; padding: 8px 0; }
.rec-option { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 500; }
.rec-checkbox { width: 18px; height: 18px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; background: white; }
.check-symbol { font-size: 16px; font-weight: bold; color: #000; line-height: 1; }

.signature-area { margin-top: 30px; display: flex; justify-content: flex-end; }
.signature-box { text-align: center; width: 200px; }
.signature-location { font-size: 11px; margin: 0 0 8px 0; }
.signature-image { height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
.signature-image img { max-height: 100%; max-width: 100%; object-fit: contain; }
.signature-name { border-top: 1px solid #000; padding-top: 6px; }
.signature-name .name { font-size: 12px; font-weight: bold; margin: 0; }
.signature-name .license { font-size: 10px; margin: 2px 0 0 0; }

.footer { margin-top: 25px; padding-top: 15px; border-top: 1px solid #000; }
.footer-image { display: flex; justify-content: center; margin-bottom: 8px; }
.footer-image img { width: 100%; height: auto; object-fit: contain; }
.footer-text { font-size: 10px; text-align: center; font-style: italic; margin: 0; }

@media print {
  @page { size: A4 portrait; margin: 10mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { width: 210mm; margin: 0; padding: 0; }
  .no-print { display: none !important; }
  .print-container { background: white; min-height: auto; }
  .print-wrapper { padding: 0; }
  .paper { width: 100%; min-height: auto; box-shadow: none; padding: 0; margin: 0; }
  table th, table td { border: 1px solid #000 !important; }
  .biodata-table td { border: none !important; }
}
</style>
