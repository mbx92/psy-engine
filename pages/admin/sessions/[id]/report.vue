<template>
  <div class="space-y-4 md:space-y-6 print-report">
    <div class="flex items-start justify-between gap-4 print:hidden">
      <div class="min-w-0">
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Session Report</h1>
        <p class="text-sm text-muted-foreground">Detailed results and interpretation</p>
      </div>
      <div class="flex gap-2 shrink-0">
        <UiButton variant="outline" @click="navigateTo(`/admin/sessions/${id}`)">
          <Icon icon="lucide:arrow-left" class="size-4 md:mr-2" />
          <span class="hidden md:inline">Back</span>
        </UiButton>
        <UiButton @click="() => window.print()">
          <Icon icon="lucide:printer" class="size-4 md:mr-2" />
          <span class="hidden md:inline">Print / PDF</span>
        </UiButton>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-muted-foreground text-center py-8">Loading...</div>
    <div v-else-if="error" class="text-sm text-destructive text-center py-8">{{ error }}</div>

    <template v-else-if="session">
      <UiCard>
        <UiCardHeader>
          <UiCardTitle>{{ session.participant.name }}</UiCardTitle>
          <UiCardDescription>{{ session.testType.name }}</UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p class="text-xs text-muted-foreground">Gender</p>
            <p class="font-medium">{{ session.participant.gender === 'L' ? 'Laki-laki' : 'Perempuan' }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Birth Date</p>
            <p class="font-medium">{{ formatDate(session.participant.birthDate) }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground mb-1">Status</p>
            <UiBadge :variant="statusVariant(session.status)" class="text-xs">{{ statusLabel(session.status) }}</UiBadge>
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Completed</p>
            <p class="font-medium">{{ formatDate(session.completedAt) }}</p>
          </div>
        </UiCardContent>
      </UiCard>

      <ReportsTestResultPanel v-if="hasScores" :session="session" />

      <UiCard v-else-if="['pending', 'in_progress'].includes(session.status)">
        <UiCardContent class="py-8 text-center text-sm text-muted-foreground">
          Hasil tes belum tersedia — sesi belum selesai.
        </UiCardContent>
      </UiCard>

      <UiCard v-else>
        <UiCardContent class="py-8 text-center space-y-3">
          <p class="text-sm text-muted-foreground">
            Skor belum tersedia — scoring gagal atau sesi perlu dihitung ulang.
          </p>
          <p v-if="session.scores?.raw?.error" class="text-xs text-destructive">{{ session.scores.raw.error }}</p>
          <UiButton
            v-if="canRescore"
            size="sm"
            variant="outline"
            :disabled="rescoreLoading"
            @click="rescoreSession"
          >
            {{ rescoreLoading ? 'Menghitung ulang…' : 'Hitung ulang skor' }}
          </UiButton>
        </UiCardContent>
      </UiCard>

      <UiCard v-if="answerRows.length" class="print:break-before-page">
        <UiCardHeader>
          <UiCardTitle class="text-base">Answers Review</UiCardTitle>
        </UiCardHeader>
        <UiCardContent class="max-h-[32rem] overflow-y-auto space-y-0">
          <div
            v-for="(a, i) in answerRows"
            :key="a.questionId"
            class="flex items-start gap-3 py-2.5 border-b last:border-0"
          >
            <span class="text-xs text-muted-foreground w-7 shrink-0 tabular-nums">{{ i + 1 }}.</span>
            <div class="min-w-0 flex-1">
              <p class="text-sm">{{ a.questionText }}</p>
              <p class="text-sm font-medium mt-0.5 flex items-center gap-1.5">
                {{ a.answerText || '(tidak dijawab)' }}
                <Icon v-if="a.isCorrect === true" icon="lucide:check" class="size-4 text-emerald-600" />
                <Icon v-else-if="a.isCorrect === false" icon="lucide:x" class="size-4 text-destructive" />
              </p>
            </div>
          </div>
        </UiCardContent>
      </UiCard>
    </template>
  </div>
</template>

<script setup>
import { statusLabel, statusVariant } from '~~/utils/sessionStatus'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const id = route.params.id
const { getAuthHeaders, can } = useAuth()
const toast = useToast()

const session = ref(null)
const loading = ref(true)
const error = ref('')
const rescoreLoading = ref(false)

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const hasScores = computed(() => {
  if (!session.value) return false
  const dims = session.value.scores?.dimensions
  return dims && Object.keys(dims).length > 0
})

const canRescore = computed(() =>
  can('sessions:manage')
  && session.value
  && ['completed', 'verified'].includes(session.value.status)
  && Object.keys(session.value.answers || {}).length > 0,
)

const answerRows = computed(() => {
  if (!session.value) return []
  const questions = session.value.testType.questions || []
  const answers = session.value.answers || {}
  const algo = session.value.testType.scoringConfig?.algorithm
  const showCorrect = algo === 'correct_count' || algo === 'raw_to_iq'

  return questions
    .filter((q) => q.type !== 'instruction')
    .map((q, i) => {
      const answerId = answers[q.id]
      const option = q.options?.find((o) => o.id === answerId)
      let isCorrect = null
      if (showCorrect && answerId != null) {
        if (q.answer) {
          const selected = option?.value || option?.label
          isCorrect = selected?.toString().toUpperCase() === q.answer.toString().toUpperCase()
        } else {
          const correctOption = q.options?.find((o) => o.weight === 1)
          isCorrect = !!correctOption && answerId === correctOption.id
        }
      }
      const text = option?.text || q.textA && answerId?.endsWith('_A') ? q.textA : q.textB && answerId?.endsWith('_B') ? q.textB : option?.text
      return {
        questionId: q.id,
        questionText: (q.text || q.textA || '').replace(/Pilih pernyataan yang paling sesuai dengan diri Anda\.?\s*/i, '').trim() || `Soal ${q.number ?? i + 1}`,
        answerText: text || (answerId ? String(answerId) : null),
        isCorrect,
      }
    })
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await $fetch(`/api/sessions/${id}`, { headers: getAuthHeaders() })
    session.value = data.session
  } catch (err) {
    error.value = err?.data?.message || 'Failed to load report'
  } finally {
    loading.value = false
  }
}

async function rescoreSession() {
  rescoreLoading.value = true
  try {
    await $fetch(`/api/sessions/${id}/rescore`, { method: 'POST', headers: getAuthHeaders() })
    toast.success('Skor berhasil dihitung ulang')
    await load()
  } catch (err) {
    toast.error(err?.data?.message || 'Gagal menghitung ulang skor')
  } finally {
    rescoreLoading.value = false
  }
}

onMounted(load)
</script>

<style>
@media print {
  .print-report { padding: 0; }
  .print\:hidden { display: none !important; }
}
</style>
