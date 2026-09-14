<template>
  <div class="w-full space-y-4 md:space-y-6">
    <div v-if="loading" class="text-sm text-muted-foreground text-center py-16">Loading session…</div>
    <div v-else-if="loadError" class="text-sm text-destructive text-center py-16">{{ loadError }}</div>

    <template v-else>
      <!-- Header -->
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0 space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <UiButton variant="ghost" size="sm" class="-ml-2 h-8 px-2" @click="navigateTo('/admin/sessions')">
              <Icon icon="lucide:arrow-left" class="size-4 mr-1" />
              Sessions
            </UiButton>
            <UiBadge :variant="statusVariant(session.status)" class="text-xs">{{ statusLabel(session.status) }}</UiBadge>
            <span
              v-if="liveConnected && session.status === 'in_progress'"
              class="inline-flex items-center gap-1.5 text-xs text-emerald-600"
            >
              <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight truncate">{{ session.participant.name }}</h1>
          <p class="text-sm md:text-base text-muted-foreground">
            {{ session.testType.name }}
            <span class="text-muted-foreground/60">·</span>
            {{ session.testType.type }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <UiButton
            v-if="canViewReport"
            as-child
            variant="outline"
            size="sm"
          >
            <NuxtLink :to="`/admin/sessions/${route.params.id}/report`">
              <Icon icon="lucide:file-text" class="size-4 mr-1" />
              Full report
            </NuxtLink>
          </UiButton>
          <UiButton v-if="canAbandon" variant="outline" size="sm" class="text-destructive" @click="abandonSession">
            <Icon icon="lucide:ban" class="size-4 mr-1" />
            Abandon
          </UiButton>
          <UiButton v-if="canVerify" size="sm" @click="showVerify = true">
            <Icon icon="lucide:shield-check" class="size-4 mr-1" />
            Verify
          </UiButton>
          <UiButton v-if="canDelete" variant="outline" size="sm" class="text-destructive" @click="deleteSession">
            <Icon icon="lucide:trash-2" class="size-4 mr-1" />
            Delete
          </UiButton>
        </div>
      </div>

      <!-- Invite -->
      <div class="rounded-lg border bg-card p-3 md:p-4">
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <p class="text-xs font-medium text-muted-foreground shrink-0 sm:w-28">Invitation link</p>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <UiInput :model-value="inviteUrl" readonly class="h-9 font-mono text-xs" />
            <UiButton type="button" variant="outline" size="icon" class="shrink-0 h-9 w-9" @click="copyInvite">
              <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Main grid -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">
        <!-- Left: meta -->
        <div class="xl:col-span-4 space-y-4">
          <UiCard>
            <UiCardHeader class="pb-3">
              <UiCardTitle class="text-sm">Participant</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="space-y-2 text-sm">
              <MetaRow label="Name" :value="session.participant.name" />
              <MetaRow label="Gender" :value="session.participant.gender === 'L' ? 'Laki-laki' : 'Perempuan'" />
              <MetaRow label="Birth date" :value="formatDate(session.participant.birthDate)" />
              <MetaRow label="Email" :value="session.participant.email || '—'" />
              <MetaRow label="Phone" :value="session.participant.phone || '—'" />
            </UiCardContent>
          </UiCard>

          <UiCard>
            <UiCardHeader class="pb-3">
              <UiCardTitle class="text-sm">Session</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="space-y-2 text-sm">
              <MetaRow label="Created" :value="formatDateTime(session.createdAt)" />
              <MetaRow label="Started" :value="formatDateTime(session.startedAt)" />
              <MetaRow label="Completed" :value="formatDateTime(session.completedAt)" />
              <MetaRow label="Verified" :value="formatDateTime(session.verifiedAt)" />
              <MetaRow label="Last activity" :value="formatDateTime(liveLastActivity || session.lastActivity)" />
              <div class="pt-2 border-t">
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <span class="text-muted-foreground">Progress</span>
                  <span class="font-medium tabular-nums">{{ liveAnswered }} / {{ totalQuestions }}</span>
                </div>
                <div class="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    class="h-full rounded-full bg-primary transition-all duration-500"
                    :style="{ width: `${progressPct}%` }"
                  />
                </div>
              </div>
              <p v-if="session.verifiedNotes" class="text-xs text-muted-foreground pt-2 border-t">
                <span class="font-medium text-foreground">Notes:</span> {{ session.verifiedNotes }}
              </p>
            </UiCardContent>
          </UiCard>
        </div>

        <!-- Right: results + answers -->
        <div class="xl:col-span-8 space-y-4">
          <UiCard v-if="hasResults">
            <UiCardHeader class="pb-3">
              <UiCardTitle class="text-sm">Report Hasil Tes</UiCardTitle>
              <UiCardDescription>Skor, interpretasi, dan rincian jawaban ada di laporan terpisah</UiCardDescription>
            </UiCardHeader>
            <UiCardContent class="flex flex-col sm:flex-row sm:items-center gap-3">
              <p v-if="scoreHeadline" class="text-sm font-medium flex-1">{{ scoreHeadline }}</p>
              <UiButton as-child size="sm" class="shrink-0">
                <NuxtLink :to="`/admin/sessions/${route.params.id}/report`">
                  <Icon icon="lucide:file-text" class="size-4 mr-1" />
                  Lihat laporan lengkap
                </NuxtLink>
              </UiButton>
            </UiCardContent>
          </UiCard>

          <UiCard v-else-if="isEpps && ['pending', 'in_progress'].includes(session.status)">
            <UiCardHeader class="pb-3">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <UiCardTitle class="text-sm">Matrix Jawaban EPPS (Live)</UiCardTitle>
                  <UiCardDescription>Terisi otomatis saat peserta menjawab</UiCardDescription>
                </div>
                <UiBadge variant="outline" class="text-xs font-normal tabular-nums">
                  {{ liveAnswered }} / {{ totalQuestions }}
                </UiBadge>
              </div>
            </UiCardHeader>
            <UiCardContent>
              <ReportsEppsAnswerMatrix v-if="eppsAnswerBlocks.length" :blocks="eppsAnswerBlocks" />
              <p v-else class="text-sm text-muted-foreground text-center py-8">
                Menunggu jawaban peserta…
              </p>
            </UiCardContent>
          </UiCard>

          <UiCard v-else-if="['pending', 'in_progress'].includes(session.status)">
            <UiCardContent class="py-10 text-center text-sm text-muted-foreground">
              Hasil tes akan muncul setelah peserta menyelesaikan ujian.
            </UiCardContent>
          </UiCard>

          <UiCard v-if="answerRows.length && !isEpps && !hasResults">
            <UiCardHeader class="pb-3">
              <div class="flex items-center justify-between gap-2">
                <UiCardTitle class="text-sm">Answers</UiCardTitle>
                <span class="text-xs text-muted-foreground">{{ answeredSummary }}</span>
              </div>
            </UiCardHeader>
            <UiCardContent class="max-h-[28rem] overflow-y-auto space-y-0 pr-1">
              <div
                v-for="(a, i) in answerRows"
                :key="a.questionId"
                class="flex items-start gap-3 py-2.5 border-b last:border-0"
              >
                <span class="text-xs text-muted-foreground w-7 shrink-0 tabular-nums pt-0.5">{{ i + 1 }}.</span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm leading-snug">{{ a.questionText }}</p>
                  <p class="text-sm font-medium mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>{{ a.answerText || '(tidak dijawab)' }}</span>
                    <Icon v-if="a.isCorrect === true" icon="lucide:check" class="size-4 text-emerald-600 shrink-0" />
                    <Icon v-else-if="a.isCorrect === false" icon="lucide:x" class="size-4 text-destructive shrink-0" />
                  </p>
                </div>
              </div>
            </UiCardContent>
          </UiCard>
        </div>
      </div>

      <!-- Live activity (SSE) -->
      <UiCard>
        <UiCardHeader class="pb-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <UiCardTitle class="text-sm">Activity log</UiCardTitle>
              <UiCardDescription>Live stream dari aktivitas peserta selama tes</UiCardDescription>
            </div>
            <div class="flex items-center gap-2">
              <UiBadge variant="outline" class="text-xs font-normal">
                {{ logs.length }} events
              </UiBadge>
              <span
                v-if="session.status === 'in_progress'"
                class="inline-flex items-center gap-1.5 text-xs"
                :class="liveConnected ? 'text-emerald-600' : 'text-muted-foreground'"
              >
                <span
                  class="size-1.5 rounded-full"
                  :class="liveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'"
                />
                {{ liveConnected ? 'Connected' : 'Reconnecting…' }}
              </span>
            </div>
          </div>
        </UiCardHeader>
        <UiCardContent>
          <div
            ref="logScrollEl"
            class="max-h-[22rem] overflow-y-auto rounded-md border bg-muted/20"
          >
            <div v-if="!logs.length" class="text-sm text-muted-foreground py-10 text-center">
              Belum ada aktivitas.
            </div>
            <ol v-else class="divide-y">
              <li
                v-for="log in displayLogs"
                :key="log.id"
                class="flex gap-3 px-3 py-2.5 hover:bg-muted/40"
              >
                <div class="pt-1.5">
                  <span
                    class="block size-2 rounded-full shrink-0"
                    :class="levelDot(log.level)"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p class="text-sm font-medium">{{ eventLabel(log.eventType) }}</p>
                    <time class="text-[11px] text-muted-foreground tabular-nums shrink-0">
                      {{ formatDateTime(log.createdAt) }}
                    </time>
                  </div>
                  <p v-if="log.message" class="text-xs text-muted-foreground mt-0.5">{{ log.message }}</p>
                  <p
                    v-if="log.metadata?.answeredCount != null"
                    class="text-[11px] text-muted-foreground mt-0.5"
                  >
                    Progress: {{ log.metadata.answeredCount }} jawaban
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </UiCardContent>
      </UiCard>
    </template>

    <ClientOnly>
      <UiDialog v-model:open="showVerify">
        <UiDialogContent class="sm:max-w-md">
          <UiDialogHeader>
            <UiDialogTitle>Verify Session</UiDialogTitle>
            <UiDialogDescription>Confirm you've reviewed the scores. You can add optional notes.</UiDialogDescription>
          </UiDialogHeader>
          <div class="space-y-4">
            <div class="space-y-2">
              <UiLabel for="verify-notes">Notes (optional)</UiLabel>
              <UiTextarea id="verify-notes" v-model="verifyNotes" class="min-h-20" />
            </div>
            <UiDialogFooter>
              <UiButton type="button" variant="outline" @click="showVerify = false">Cancel</UiButton>
              <UiButton :disabled="verifyLoading" @click="verifySession">
                {{ verifyLoading ? 'Verifying...' : 'Verify' }}
              </UiButton>
            </UiDialogFooter>
          </div>
        </UiDialogContent>
      </UiDialog>
    </ClientOnly>
  </div>
</template>

<script setup>
import { buildEppsAnswerBlocks } from '~~/utils/eppsConstants'
import { buildScoreView } from '~~/utils/scoreDisplay'
import { statusLabel, statusVariant } from '~~/utils/sessionStatus'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const MetaRow = (props) => h('div', { class: 'flex justify-between gap-3' }, [
  h('span', { class: 'text-muted-foreground shrink-0' }, props.label),
  h('span', { class: 'font-medium text-right break-all' }, props.value),
])
MetaRow.props = { label: String, value: [String, Number] }

const route = useRoute()
const { can, getAuthHeaders } = useAuth()
const toast = useToast()
const { confirm } = useConfirm()

const session = ref(null)
const logs = ref([])
const loading = ref(true)
const loadError = ref('')
const copied = ref(false)
const liveAnswered = ref(0)
const liveLastActivity = ref(null)
const liveConnected = ref(false)
const logScrollEl = ref(null)

const EVENT_LABELS = {
  session_created: 'Session created',
  test_started: 'Test started',
  answer_saved: 'Answers auto-saving',
  answer_progress: 'Answer progress',
  test_completed: 'Test submitted',
  session_abandoned: 'Abandoned',
  session_verified: 'Verified by admin',
  scoring_failed: 'Scoring failed',
}
function eventLabel(type) { return EVENT_LABELS[type] || type }

function levelDot(level) {
  if (level === 'critical') return 'bg-destructive'
  if (level === 'warning') return 'bg-amber-500'
  return 'bg-primary'
}

function formatDate(value) {
  if (!value) return '—'
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split('-').map(Number)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    return `${String(d).padStart(2, '0')} ${months[m - 1]} ${y}`
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${String(d.getUTCDate()).padStart(2, '0')} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  const ss = String(d.getUTCSeconds()).padStart(2, '0')
  return `${dd} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${hh}.${mm}.${ss}`
}

const requestURL = useRequestURL()
const inviteUrl = computed(() => {
  if (!session.value?.token) return ''
  const origin = import.meta.client ? window.location.origin : requestURL.origin
  return `${origin}/take/${session.value.token}`
})

const totalQuestions = computed(() => session.value?.testType?.questions?.length || 0)
const progressPct = computed(() => {
  if (!totalQuestions.value) return 0
  return Math.min(100, Math.round((liveAnswered.value / totalQuestions.value) * 100))
})

const hasResults = computed(() => {
  if (!session.value) return false
  if (!['completed', 'verified'].includes(session.value.status)) return false
  const dims = session.value.scores?.dimensions
  return dims && Object.keys(dims).length > 0
})

const isEpps = computed(() => {
  const algo = session.value?.testType?.scoringConfig?.algorithm
  const slug = session.value?.testType?.slug || ''
  return algo === 'epps_matrix' || slug === 'epps'
})

const eppsAnswerBlocks = computed(() => {
  if (!isEpps.value || !session.value) return []
  return buildEppsAnswerBlocks(session.value)
})

const scoreHeadline = computed(() => {
  if (!hasResults.value || !session.value) return ''
  const view = buildScoreView(session.value)
  if (!view) return ''
  if (view.kind === 'cfit') {
    return `IQ ${view.iqScore ?? '—'} · ${view.classification}`
  }
  if (view.kind === 'epps') {
    const top3 = (view.top5 || []).slice(0, 3)
      .map((key) => view.needs.find((n) => n.key === key)?.code || key.toUpperCase())
    return top3.length ? `Kebutuhan tertinggi: ${top3.join(', ')}` : ''
  }
  if (view.kind === 'papi') {
    return `${view.dimensions.length} skala PAPI tersedia`
  }
  return view.dimensions?.length ? `${view.dimensions.length} dimensi skor tersedia` : ''
})

const canViewReport = computed(() =>
  session.value && ['completed', 'verified'].includes(session.value.status),
)

const answerRows = computed(() => {
  if (!session.value) return []
  if (!['completed', 'verified', 'in_progress', 'abandoned'].includes(session.value.status)) return []
  const questions = session.value.testType.questions || []
  const answers = session.value.answers || {}
  if (!Object.keys(answers).length && session.value.status === 'in_progress') return []
  const isCorrectCount = session.value.testType.scoringConfig?.algorithm === 'correct_count'
    || session.value.testType.scoringConfig?.algorithm === 'raw_to_iq'

  return questions.map((q) => {
    const answerId = answers[q.id]
    const option = q.options?.find((o) => o.id === answerId)
    let isCorrect = null
    if (isCorrectCount && answerId != null && q.options?.some((o) => o.weight === 1 || o.isCorrect)) {
      const correctOption = q.options.find((o) => o.weight === 1 || o.isCorrect)
      isCorrect = !!correctOption && answerId === correctOption.id
    }
    return {
      questionId: q.id,
      questionText: (q.text || q.prompt || '').replace(/Pilih pernyataan yang paling sesuai dengan diri Anda\.?\s*/i, '').trim() || `Soal ${q.id}`,
      answerText: option?.text || (answerId != null ? String(answerId) : null),
      isCorrect,
    }
  }).filter((a) => session.value.status !== 'in_progress' || a.answerText)
})

const answeredSummary = computed(() => {
  const answered = answerRows.value.filter((a) => a.answerText).length
  return `${answered} / ${answerRows.value.length || totalQuestions.value} answered`
})

const displayLogs = computed(() => [...logs.value].reverse())

const canAbandon = computed(() => can('sessions:manage') && ['pending', 'in_progress'].includes(session.value?.status))
const canVerify = computed(() => can('sessions:manage') && session.value?.status === 'completed' && session.value?.scores?.status !== 'failed' && !session.value?.scores?.raw?.error && Object.keys(session.value?.scores?.dimensions || {}).length > 0)
const canDelete = computed(() => can('sessions:manage') && session.value?.status === 'pending')

function appendLog(log) {
  if (!log?.id) return
  if (logs.value.some((l) => l.id === log.id)) return
  logs.value = [...logs.value, log]
  nextTick(scrollLogsToLatest)
}

function scrollLogsToLatest() {
  const el = logScrollEl.value
  if (!el) return
  // Newest-first list: keep top in view when new events arrive
  el.scrollTop = 0
}

async function loadSession({ silent = false } = {}) {
  if (!silent) {
    loading.value = true
    loadError.value = ''
  }
  try {
    const sessData = await $fetch(`/api/sessions/${route.params.id}`, { headers: getAuthHeaders() })
    session.value = sessData.session
    liveAnswered.value = Object.keys(sessData.session.answers || {}).length
    liveLastActivity.value = sessData.session.lastActivity
  } catch (err) {
    if (!silent) {
      loadError.value = err?.data?.message || 'Failed to load session'
      toast.error(loadError.value)
    }
  } finally {
    if (!silent) loading.value = false
  }
}

let eventSource = null
let reconnectTimer = null

function closeLive() {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  liveConnected.value = false
}

function connectLive() {
  if (!import.meta.client || !session.value) return
  closeLive()

  // Auth via psy-token cookie (EventSource cannot set Authorization headers)
  eventSource = new EventSource(`/api/sessions/${route.params.id}/logs/stream`)

  eventSource.addEventListener('snapshot', (e) => {
    try {
      const data = JSON.parse(e.data)
      logs.value = data.logs || []
      if (typeof data.answeredCount === 'number') liveAnswered.value = data.answeredCount
      if (data.lastActivity) liveLastActivity.value = data.lastActivity
      if (data.answers && session.value) {
        session.value = { ...session.value, answers: data.answers }
      }
      liveConnected.value = true
    } catch { /* ignore */ }
  })

  eventSource.addEventListener('log', (e) => {
    try {
      appendLog(JSON.parse(e.data))
    } catch { /* ignore */ }
  })

  eventSource.addEventListener('progress', async (e) => {
    try {
      const data = JSON.parse(e.data)
      if (typeof data.answeredCount === 'number') liveAnswered.value = data.answeredCount
      if (data.lastActivity) liveLastActivity.value = data.lastActivity
      if (data.answers && session.value) {
        session.value = { ...session.value, answers: data.answers }
      }
      // Refresh full session when status may have changed (submit/abandon)
      if (data.status && data.status !== session.value?.status) {
        await loadSession({ silent: true })
      }
    } catch { /* ignore */ }
  })

  eventSource.addEventListener('ping', () => {
    liveConnected.value = true
  })

  eventSource.onopen = () => {
    liveConnected.value = true
  }

  eventSource.onerror = () => {
    liveConnected.value = false
    eventSource?.close()
    eventSource = null
    reconnectTimer = setTimeout(connectLive, 3000)
  }
}

onMounted(async () => {
  await loadSession()
  connectLive()
})

onBeforeUnmount(closeLive)

watch(() => route.params.id, async () => {
  closeLive()
  await loadSession()
  connectLive()
})

async function copyInvite() {
  try {
    await navigator.clipboard.writeText(inviteUrl.value)
    copied.value = true
    toast.success('Link copied')
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Clipboard API unavailable
  }
}

async function abandonSession() {
  const ok = await confirm({
    title: 'Abandon this session?',
    description: 'This cannot be undone.',
    confirmLabel: 'Abandon',
    variant: 'destructive',
  })
  if (!ok) return

  try {
    await $fetch(`/api/sessions/${route.params.id}/status`, {
      method: 'PATCH',
      body: { status: 'abandoned' },
      headers: getAuthHeaders(),
    })
    toast.success('Session abandoned')
    await loadSession()
  } catch (err) {
    toast.error(err?.data?.message || 'Failed to abandon session')
  }
}

async function deleteSession() {
  const ok = await confirm({
    title: 'Delete this pending session?',
    description: 'This cannot be undone.',
    confirmLabel: 'Delete',
    variant: 'destructive',
  })
  if (!ok) return

  try {
    await $fetch(`/api/sessions/${route.params.id}`, { method: 'DELETE', headers: getAuthHeaders() })
    toast.success('Session deleted')
    await navigateTo('/admin/sessions')
  } catch (err) {
    toast.error(err?.data?.message || 'Failed to delete session')
  }
}

const showVerify = ref(false)
const verifyNotes = ref('')
const verifyLoading = ref(false)

async function verifySession() {
  verifyLoading.value = true
  try {
    await $fetch(`/api/sessions/${route.params.id}/status`, {
      method: 'PATCH',
      body: { status: 'verified', notes: verifyNotes.value || undefined },
      headers: getAuthHeaders(),
    })
    showVerify.value = false
    verifyNotes.value = ''
    toast.success('Session verified')
    await loadSession()
  } catch (err) {
    toast.error(err?.data?.message || 'Failed to verify session')
  } finally {
    verifyLoading.value = false
  }
}

// When test completes, refresh scores via log event
watch(logs, async (list) => {
  const last = list[list.length - 1]
  if (!last) return
  if (['test_completed', 'session_verified', 'session_abandoned'].includes(last.eventType)) {
    await loadSession({ silent: true })
  }
}, { deep: false })
</script>
