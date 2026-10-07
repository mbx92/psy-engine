<template>
  <NuxtPage v-if="route.matched.length > 1" />
  <div v-else class="min-h-screen bg-background flex flex-col">

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center space-y-4">
        <div class="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        <p class="text-sm text-muted-foreground">Memuat undangan tes...</p>
      </div>
    </div>

    <div v-else-if="error" class="flex-1 flex items-center justify-center p-4">
      <UiCard class="w-full max-w-sm text-center">
        <UiCardHeader class="space-y-3">
          <div
            v-if="accessBlocked"
            class="mx-auto size-12 rounded-full flex items-center justify-center"
            :class="accessBlocked.code === 'SYSTEM_LOCKED' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-800'"
          >
            <Icon :icon="accessBlocked.icon" class="size-6" />
          </div>
          <UiCardTitle :class="accessBlocked ? '' : 'text-destructive'">
            {{ accessBlocked?.title || 'Tidak Dapat Membuka Tes' }}
          </UiCardTitle>
          <UiCardDescription>{{ error }}</UiCardDescription>
        </UiCardHeader>
      </UiCard>
    </div>

    <div v-else-if="status === 'abandoned'" class="flex-1 flex items-center justify-center p-4">
      <UiCard class="w-full max-w-sm text-center">
        <UiCardHeader>
          <UiCardTitle class="text-destructive">Link Undangan Kedaluwarsa</UiCardTitle>
          <UiCardDescription>Sesi ini sudah tidak aktif karena melebihi batas waktu. Hubungi admin untuk undangan baru.</UiCardDescription>
        </UiCardHeader>
      </UiCard>
    </div>

    <!-- Landing -->
    <div v-else-if="!started" class="flex-1 flex flex-col">
      <div class="flex-1 overflow-y-auto p-4 md:p-8 max-w-lg mx-auto w-full">
        <div class="space-y-6 pt-4">
          <div>
            <h1 class="text-2xl font-bold">{{ test?.name }}</h1>
            <p class="text-sm text-muted-foreground mt-1">{{ test?.description }}</p>
          </div>

          <div class="bg-muted rounded-lg p-3 text-sm">
            <p class="text-xs text-muted-foreground">Peserta</p>
            <p class="font-medium">{{ participantName }}</p>
          </div>

          <div class="space-y-2">
            <h3 class="font-semibold text-sm">Petunjuk Pengerjaan</h3>
            <ul class="space-y-2">
              <li v-for="(inst, i) in instructions" :key="i" class="flex gap-2 text-sm">
                <span class="text-primary shrink-0 mt-0.5">{{ i + 1 }}.</span>
                <span>{{ inst }}</span>
              </li>
            </ul>
          </div>

          <div class="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Jumlah Soal</span>
              <span class="font-medium">{{ questionCount }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Waktu</span>
              <span class="font-medium">{{ overviewTimeLabel }}</span>
            </div>
            <div v-if="config?.subtests?.length" class="space-y-1 pt-2 border-t">
              <p class="text-xs text-muted-foreground">Subtes:</p>
              <div v-for="st in config.subtests" :key="st.key" class="flex justify-between text-xs pl-2">
                <span>{{ st.label }}</span>
                <span>{{ st.questionCount }} soal / {{ formatSeconds(st.timeLimit) }}</span>
              </div>
            </div>
          </div>

          <UiButton size="lg" class="w-full h-12 text-base" :disabled="starting" @click="startTest">
            {{ starting ? 'Memulai...' : 'Mulai Test' }}
          </UiButton>

          <div
            v-if="devToolsEnabled"
            class="rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 p-3 space-y-2"
          >
            <p class="text-xs font-medium text-amber-700 dark:text-amber-400">Dev tools</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <UiButton variant="outline" size="sm" class="h-9 text-xs" :disabled="starting" @click="devStartAndFill('correct')">
                Start + fill correct*
              </UiButton>
              <UiButton variant="outline" size="sm" class="h-9 text-xs" :disabled="starting" @click="devStartAndFill('random')">
                Start + fill random
              </UiButton>
            </div>
            <p class="text-[10px] text-amber-700/80 dark:text-amber-400/80">
              *EPPS/PAPI: correct = random (tidak ada kunci jawaban)
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Runner -->
    <div v-else class="flex-1 flex flex-col">
      <header class="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div class="px-4 py-2 max-w-lg mx-auto w-full">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-medium truncate pr-2">{{ test?.name }}</span>
            <span
              v-if="showTimer"
              :class="['text-xs font-mono font-bold', timeWarning ? 'text-destructive animate-pulse' : 'text-muted-foreground']"
            >
              {{ formattedTime }}
            </span>
            <span v-else class="text-xs text-muted-foreground">—:—</span>
          </div>
          <div class="w-full bg-muted rounded-full h-1.5">
            <div class="bg-primary h-1.5 rounded-full transition-all duration-300" :style="{ width: progressPercent + '%' }" />
          </div>
          <div class="flex justify-between mt-0.5">
            <span class="text-[10px] text-muted-foreground">{{ progressLabel }}</span>
            <span class="text-[10px] text-muted-foreground">{{ Math.round(progressPercent) }}%</span>
          </div>
        </div>
      </header>

      <div v-if="currentSubtestLabel" class="bg-primary/5 border-b px-4 py-2">
        <p class="text-xs font-medium text-primary text-center">{{ currentSubtestLabel }}</p>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div class="p-4 max-w-lg mx-auto w-full">
          <transition name="fade" mode="out-in">
            <div :key="currentIndex" class="space-y-6">
              <!-- Instruction -->
              <div v-if="isInstruction" class="space-y-4">
                <div>
                  <p v-if="currentQuestion.subtitle" class="text-xs text-muted-foreground mb-1">{{ currentQuestion.subtitle }}</p>
                  <h2 class="text-lg font-semibold">{{ currentQuestion.title || currentQuestion.text }}</h2>
                </div>
                <p class="text-sm leading-relaxed whitespace-pre-line">
                  {{ currentQuestion.instruction || 'Baca petunjuk dengan saksama, lalu lanjutkan.' }}
                </p>
                <div v-if="currentQuestion.timeLimit" class="rounded-lg bg-muted px-3 py-2 text-sm">
                  Waktu pengerjaan: <span class="font-medium">{{ formatSeconds(currentQuestion.timeLimit) }}</span>
                </div>
                <ul v-if="currentQuestion.rules?.length" class="space-y-1.5 text-sm">
                  <li v-for="(rule, i) in currentQuestion.rules" :key="i" class="flex gap-2">
                    <span class="text-primary shrink-0">•</span>
                    <span>{{ rule }}</span>
                  </li>
                </ul>
                <div v-if="currentQuestion.warnings?.length" class="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-1">
                  <p v-for="(w, i) in currentQuestion.warnings" :key="i" class="text-xs text-destructive font-medium">{{ w }}</p>
                </div>
                <div v-if="currentQuestion.examples?.length" class="space-y-4">
                  <p class="text-xs font-medium text-muted-foreground">Contoh:</p>
                  <div
                    v-for="ex in currentQuestion.examples"
                    :key="ex.number"
                    class="space-y-2 rounded-lg border p-3"
                  >
                    <p class="text-xs font-medium">Contoh {{ ex.number }}</p>
                    <img
                      v-if="ex.imagePath"
                      :src="ex.imagePath"
                      :alt="`Contoh ${ex.number}`"
                      class="w-full rounded-md border bg-white"
                    >
                    <p v-if="ex.description" class="text-sm text-muted-foreground">{{ ex.description }}</p>
                    <p v-if="ex.explanation" class="text-xs">
                      <span class="font-medium">Jawaban:</span> {{ ex.answer }} — {{ ex.explanation }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Question -->
              <template v-else>
                <div>
                  <p class="text-xs text-muted-foreground mb-2">Soal {{ answerableProgress }}</p>
                  <h2
                    v-if="currentQuestion?.text && currentQuestion.type !== 'image_choice'"
                    class="text-base md:text-lg font-semibold leading-relaxed"
                  >
                    {{ currentQuestion.text }}
                  </h2>
                </div>

                <div v-if="currentQuestion?.imagePath" class="rounded-xl border bg-white p-2">
                  <img
                    :src="currentQuestion.imagePath"
                    :alt="currentQuestion.text || `Soal ${currentIndex + 1}`"
                    class="w-full h-auto max-h-[360px] object-contain mx-auto"
                  >
                </div>

                <div
                  class="gap-3"
                  :class="currentQuestion?.type === 'image_choice' ? 'grid grid-cols-5' : 'space-y-3'"
                >
                  <button
                    v-for="opt in currentQuestion?.options || []"
                    :key="opt.id"
                    type="button"
                    class="transition-all active:scale-[0.98]"
                    :class="currentQuestion?.type === 'image_choice'
                      ? ['aspect-square rounded-xl border-2 font-semibold text-sm flex items-center justify-center', getSelected(opt.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50']
                      : ['w-full text-left p-4 rounded-xl border-2', getSelected(opt.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50']"
                    @click="selectOption(opt.id)"
                  >
                    <template v-if="currentQuestion?.type === 'image_choice'">
                      {{ opt.label || opt.text || opt.value }}
                    </template>
                    <template v-else>
                      <div class="flex items-start gap-3">
                        <div
                          class="size-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                          :class="getSelected(opt.id) ? 'border-primary bg-primary' : 'border-muted-foreground/30'"
                        >
                          <div v-if="getSelected(opt.id)" class="size-2 rounded-full bg-white" />
                        </div>
                        <span class="text-sm leading-relaxed">{{ opt.text || opt.label }}</span>
                      </div>
                    </template>
                  </button>
                </div>
              </template>
            </div>
          </transition>
        </div>
      </div>

      <div class="sticky bottom-0 border-t bg-background/95 backdrop-blur p-3">
        <div v-if="devToolsEnabled && started" class="max-w-lg mx-auto w-full mb-2">
          <div class="flex flex-wrap gap-1.5 justify-center">
            <UiButton variant="outline" size="sm" class="h-7 text-[10px] px-2" @click="devFillCurrent('random')">
              Dev: soal ini 🎲
            </UiButton>
            <UiButton variant="outline" size="sm" class="h-7 text-[10px] px-2" @click="devFillAll('random')">
              Dev: fill random
            </UiButton>
            <UiButton variant="outline" size="sm" class="h-7 text-[10px] px-2" @click="devJumpToEnd('random')">
              Dev: random → akhir
            </UiButton>
            <UiButton variant="outline" size="sm" class="h-7 text-[10px] px-2" @click="devFillAll('correct')">
              Dev: fill correct*
            </UiButton>
          </div>
        </div>
        <div class="max-w-lg mx-auto w-full flex gap-3">
          <UiButton
            v-if="canGoBack"
            variant="outline"
            class="flex-1 h-12"
            @click="prevQuestion"
          >
            Sebelumnya
          </UiButton>

          <UiButton
            v-if="isInstruction"
            class="flex-1 h-12"
            @click="continueFromInstruction"
          >
            Saya Mengerti, Mulai
          </UiButton>

          <UiButton
            v-else-if="!isLastQuestion"
            class="flex-1 h-12"
            :disabled="!canProceed"
            @click="nextQuestion"
          >
            Selanjutnya
          </UiButton>

          <UiButton
            v-else
            class="flex-1 h-12"
            :disabled="!canProceed || submitting"
            @click="submitTest"
          >
            {{ submitting ? 'Mengirim & mengalihkan...' : 'Selesai' }}
          </UiButton>
        </div>
      </div>

      <div v-if="config?.allowSkip && !isInstruction && !hasCurrentAnswer" class="text-[10px] text-muted-foreground text-center pb-2">
        Lewatkan dulu (belum dijawab)
      </div>
      <p v-if="devFillNotice" class="text-[10px] text-center text-amber-600 pb-2">{{ devFillNotice }}</p>
    </div>
  </div>
</template>

<script setup>
import { buildDevAnswers, mergeDevAnswers, pickDevAnswer } from '~~/utils/devFillAnswers'
import { clearParticipantClientState } from '~~/utils/participantSession'
import {
  parseSystemAccessError,
  systemAccessIcon,
  systemAccessMessage,
  systemAccessTitle,
} from '~~/utils/systemAccess'

definePageMeta({ layout: false })

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const token = route.params.token
const { refresh: refreshAppSettings, systemLocked, maintenanceMode, maintenanceMessage } = useAppSettings()
const devToolsEnabled = computed(() => import.meta.dev || !!runtimeConfig.public.devTestTools)

const loading = ref(true)
const error = ref('')
const accessBlocked = ref(null)
const status = ref('')
const test = ref(null)
const participantName = ref('')
const questions = ref([])
const config = ref(null)
const instructions = ref([])
const answers = ref({})
const currentIndex = ref(0)
const saveState = ref('idle')
const started = ref(false)
const starting = ref(false)
const submitting = ref(false)
const timeLeft = ref(0)
const timerInterval = ref(null)
const autoSaveInterval = ref(null)
const timeWarning = ref(false)
const subtestTimers = ref({})
const activeSubtestCode = ref(null)
const timerRunning = ref(false)
const devFillNotice = ref('')

const currentQuestion = computed(() => questions.value[currentIndex.value])
useParticipantMonitoring({ token, status, currentIndex, currentQuestion, questions, saveState })
const isInstruction = computed(() => currentQuestion.value?.type === 'instruction')
const hasSubtests = computed(() => !!(config.value?.hasSubtests || config.value?.subtestTimeLimit))
const questionCount = computed(() =>
  (test.value?.questions || []).filter((q) => q.type !== 'instruction').length,
)
const isLastQuestion = computed(() => currentIndex.value >= questions.value.length - 1)
const canGoBack = computed(() => {
  if (isInstruction.value) return false
  if (config.value?.allowBack === false || config.value?.subtestProtection) return false
  return currentIndex.value > 0
})
const showTimer = computed(() => {
  if (hasSubtests.value) return timerRunning.value && !isInstruction.value
  return !!config.value?.timeLimit
})
const overviewTimeLabel = computed(() => {
  if (config.value?.timeLimit) return `${config.value.timeLimit} menit`
  if (config.value?.subtests?.length) {
    const totalSec = config.value.subtests.reduce((s, st) => s + (st.timeLimit || 0), 0)
    return formatSeconds(totalSec)
  }
  return '—'
})
const progressPercent = computed(() => {
  const answerable = questions.value.filter((q) => q.type !== 'instruction')
  if (!answerable.length) return 0
  if (isInstruction.value) {
    const done = answerable.filter((_, i) => {
      const abs = questions.value.findIndex((q) => q.id === answerable[i].id)
      return abs < currentIndex.value
    }).length
    return (done / answerable.length) * 100
  }
  const idx = answerable.findIndex((q) => q.id === currentQuestion.value?.id)
  return ((idx + 1) / answerable.length) * 100
})
const progressLabel = computed(() => {
  if (isInstruction.value) return 'Petunjuk'
  return `Soal ${answerableProgress.value}`
})
const answerableProgress = computed(() => {
  const answerable = questions.value.filter((q) => q.type !== 'instruction')
  const current = currentQuestion.value
  if (!current || current.type === 'instruction') return '—'
  const idx = answerable.findIndex((q) => q.id === current.id)
  return `${idx + 1} / ${answerable.length}`
})
const hasCurrentAnswer = computed(() => {
  if (!currentQuestion.value || isInstruction.value) return true
  return answers.value[currentQuestion.value.id] !== undefined || !!config.value?.allowSkip
})
const canProceed = computed(() => hasCurrentAnswer.value)
const currentSubtestLabel = computed(() => {
  const key = currentQuestion.value?.subtestKey || currentQuestion.value?.subtest
  if (!key) return ''
  const st = config.value?.subtests?.find((s) => s.key === key || s.code === key)
  return st?.label || currentQuestion.value?.title || key
})
const formattedTime = computed(() => {
  const min = Math.floor(Math.max(timeLeft.value, 0) / 60)
  const sec = Math.max(timeLeft.value, 0) % 60
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
})

function formatSeconds(value) {
  if (!value && value !== 0) return '—'
  const mins = Math.floor(value / 60)
  const secs = value % 60
  if (secs === 0) return `${mins} menit`
  if (mins === 0) return `${secs} detik`
  return `${mins} menit ${secs} detik`
}

function getSelected(optionId) {
  if (!currentQuestion.value) return false
  return answers.value[currentQuestion.value.id] === optionId
}

function selectOption(optionId) {
  if (!currentQuestion.value || isInstruction.value) return
  answers.value[currentQuestion.value.id] = optionId
  saveAnswers()
}

function showDevNotice(message) {
  devFillNotice.value = message
  if (import.meta.client) {
    setTimeout(() => { devFillNotice.value = '' }, 2500)
  }
}

function applyDevAnswers(mode, { overwrite = true } = {}) {
  answers.value = mergeDevAnswers(answers.value, questions.value, mode, { overwrite })
  const filled = Object.keys(buildDevAnswers(questions.value, mode)).length
  showDevNotice(`Dev: ${filled} jawaban (${mode})`)
  return filled
}

function devFillCurrent(mode = 'correct') {
  if (!currentQuestion.value || isInstruction.value) {
    showDevNotice('Dev: bukan soal')
    return
  }
  const optionId = pickDevAnswer(currentQuestion.value, mode)
  if (optionId == null) {
    showDevNotice('Dev: tidak ada opsi')
    return
  }
  answers.value[currentQuestion.value.id] = optionId
  showDevNotice(`Dev: soal ini (${mode})`)
  saveAnswers()
}

function devFillAll(mode = 'correct') {
  const filled = applyDevAnswers(mode, { overwrite: true })
  saveAnswers()
  return filled
}

function devJumpToEnd(mode = 'random') {
  devFillAll(mode)
  const lastAnswerable = questions.value.reduce((last, q, i) => (q.type !== 'instruction' ? i : last), 0)
  currentIndex.value = Math.max(lastAnswerable, questions.value.length - 1)
  saveAnswers()
  showDevNotice(`Dev: ${mode} sampai akhir`)
}

async function devStartAndFill(mode = 'correct') {
  if (starting.value) return
  if (!started.value) {
    await startTest()
    if (!started.value) return
  }
  // Fill all + jump to last question so user can submit immediately
  devJumpToEnd(mode)
  await saveAnswers()
}

function getSubtestConfig(code) {
  return config.value?.subtests?.find((s) => s.key === code || s.code === code)
}

function prepareQuestions() {
  let qs = [...(test.value.questions || [])].map((q) => normalizeQuestion(q))
  if ((config.value?.randomize || config.value?.randomizeQuestions) && !qs.some((q) => q.type === 'instruction')) {
    qs = qs.sort(() => Math.random() - 0.5)
  }
  questions.value = qs
}

function normalizeQuestion(q) {
  if (!q) return q
  if (q.type === 'instruction') {
    return {
      ...q,
      subtestKey: q.subtestKey || q.subtest,
      examples: q.examples || [],
      rules: q.rules || [],
      warnings: q.warnings || [],
    }
  }
  if (Array.isArray(q.options) && q.options.length) {
    return {
      ...q,
      subtestKey: q.subtestKey || q.subtest,
      type: q.type === 'question' ? 'image_choice' : (q.type || (q.imagePath ? 'image_choice' : q.type)),
      options: q.options.map((o, i) => {
        if (typeof o === 'string') {
          return { id: `${q.id}_${o}`, label: o, text: o, value: o }
        }
        return {
          ...o,
          id: o.id ?? `${q.id}_${o.value || o.label || i}`,
          text: o.text || o.label || o.value || String.fromCharCode(65 + i),
        }
      }),
    }
  }
  if (q.pair?.A && q.pair?.B) {
    return {
      ...q,
      type: 'paired_choice',
      text: q.text || 'Pilih pernyataan yang paling menggambarkan diri Anda',
      options: [
        { id: `${q.id}_A`, text: q.pair.A.text || q.pair.A, label: 'A', value: 'A', dimension: q.scaleA || q.pair.A.scale, weight: 1 },
        { id: `${q.id}_B`, text: q.pair.B.text || q.pair.B, label: 'B', value: 'B', dimension: q.scaleB || q.pair.B.scale, weight: 1 },
      ],
    }
  }
  if (q.textA && q.textB) {
    return {
      ...q,
      type: 'paired_choice',
      text: q.text || 'Pilih pernyataan yang paling sesuai dengan diri Anda',
      options: [
        { id: `${q.id}_A`, text: q.textA, label: 'A', value: 'A' },
        { id: `${q.id}_B`, text: q.textB, label: 'B', value: 'B' },
      ],
    }
  }
  return q
}

function stopCountdown() {
  if (timerInterval.value) clearInterval(timerInterval.value)
  timerInterval.value = null
  timerRunning.value = false
}

function stopTimers() {
  stopCountdown()
  if (autoSaveInterval.value) clearInterval(autoSaveInterval.value)
  autoSaveInterval.value = null
}

function persistSubtestTime() {
  if (activeSubtestCode.value && timerRunning.value) {
    subtestTimers.value[activeSubtestCode.value] = timeLeft.value
  }
}

let clockOffset = 0
let subtestStarting = false
function runDeadline(deadlineAt, onTimeout) {
  stopCountdown()
  const deadline = Date.parse(deadlineAt)
  const tick = () => {
    timeLeft.value = Math.max(0, Math.ceil((deadline - (Date.now() + clockOffset)) / 1000))
    timeWarning.value = timeLeft.value <= 60
    if (timeLeft.value <= 0) { stopCountdown(); onTimeout() }
  }
  timerRunning.value = true
  timerInterval.value = setInterval(tick, 1000)
  tick()
}
async function startSubtestCountdown(code) {
  if (subtestStarting) return false
  subtestStarting = true
  try {
    const data = await $fetch(`/api/sessions/token/${token}/subtest`, { method: 'PATCH', body: { code } })
    clockOffset = Date.parse(data.serverTime) - Date.now()
    activeSubtestCode.value = code
    if (Date.parse(data.timing.subtests[code].deadlineAt) <= Date.now() + clockOffset) {
      await onSubtestTimeout()
      return false
    }
    runDeadline(data.timing.subtests[code].deadlineAt, onSubtestTimeout)
    return true
  } catch (err) {
    error.value = err?.data?.message || 'Gagal memulai subtes'
    return false
  } finally { subtestStarting = false }
}
function startGlobalCountdown(totalSec) {
  runDeadline(new Date(Date.now() + clockOffset + totalSec * 1000).toISOString(), submitTest)
}

function beginAutoSave() {
  if (autoSaveInterval.value) clearInterval(autoSaveInterval.value)
  autoSaveInterval.value = setInterval(saveAnswers, 30000)
}

function findNextSubtestIndex(fromIndex) {
  const current = questions.value[fromIndex]
  const currentSub = current?.subtestKey || current?.subtest
  let nextIndex = fromIndex + 1
  while (nextIndex < questions.value.length) {
    const q = questions.value[nextIndex]
    const sub = q.subtestKey || q.subtest
    if (q.type === 'instruction' || (sub && sub !== currentSub)) return nextIndex
    nextIndex++
  }
  return -1
}

async function onSubtestTimeout() {
  persistSubtestTime()
  await saveAnswers()
  const next = findNextSubtestIndex(currentIndex.value)
  if (next === -1) {
    await submitTest()
    return
  }
  currentIndex.value = next
  // Land on instruction — timer stays stopped until "Saya Mengerti"
  activeSubtestCode.value = questions.value[next]?.subtestKey || questions.value[next]?.subtest || null
  timeLeft.value = 0
  timeWarning.value = false
}

async function continueFromInstruction() {
  if (!isInstruction.value || subtestStarting) return
  const code = currentQuestion.value.subtestKey || currentQuestion.value.subtest
  if (hasSubtests.value && !await startSubtestCountdown(code)) return
  if (currentIndex.value < questions.value.length - 1) currentIndex.value++
  await saveAnswers()
}

async function nextQuestion() {
  if (!canProceed.value) return
  if (!await saveAnswers()) return
  const prevSub = currentQuestion.value?.subtestKey || currentQuestion.value?.subtest
  if (currentIndex.value >= questions.value.length - 1) return

  // Leaving a subtest into an instruction: pause & persist timer
  const peek = questions.value[currentIndex.value + 1]
  if (hasSubtests.value && peek?.type === 'instruction') {
    persistSubtestTime()
    stopCountdown()
  }

  currentIndex.value++
  const nextSub = currentQuestion.value?.subtestKey || currentQuestion.value?.subtest

  // Entering a new subtest question without instruction (edge) — start timer if needed
  if (
    hasSubtests.value
    && currentQuestion.value?.type !== 'instruction'
    && nextSub
    && nextSub !== prevSub
    && !timerRunning.value
  ) {
    const st = getSubtestConfig(nextSub)
    const seconds = subtestTimers.value[nextSub] ?? st?.timeLimit
    if (seconds > 0) await startSubtestCountdown(nextSub)
  }

  saveAnswers()
}

function prevQuestion() {
  if (!canGoBack.value) return
  currentIndex.value--
}

async function startTest() {
  if (starting.value) return
  starting.value = true
  try {
    const startData = await $fetch(`/api/sessions/token/${token}/start`, { method: 'PATCH' })
    clockOffset = Date.parse(startData.serverTime) - Date.now()
    status.value = 'in_progress'
    started.value = true
    prepareQuestions()
    beginAutoSave()

    if (hasSubtests.value) {
      // Start on first instruction; timer begins after "Saya Mengerti"
      currentIndex.value = 0
      stopCountdown()
    } else {
      const totalSec = (config.value?.timeLimit || 0) * 60
      if (startData.timing?.deadlineAt) runDeadline(startData.timing.deadlineAt, submitTest)
      else if (totalSec > 0) startGlobalCountdown(totalSec)
    }
  } catch (err) {
    error.value = err?.data?.message || err?.message || 'Gagal memulai tes'
  } finally {
    starting.value = false
  }
}

let saveQueue = Promise.resolve()
function saveAnswers() {
  const snapshot = { answers: { ...answers.value }, metadata: { currentQuestionIndex: currentIndex.value } }
  saveQueue = saveQueue.catch(() => false).then(async () => {
    saveState.value = 'saving'
    try {
      await $fetch(`/api/sessions/token/${token}/answers`, { method: 'PATCH', body: snapshot })
      saveState.value = 'saved'
      return true
    } catch (err) {
      const detail = err?.data?.data
      if (detail?.code === 'TIME_LIMIT_EXCEEDED') {
        answers.value = detail.answers || {}
        saveState.value = 'saved'
        return true
      }
      saveState.value = 'error'
      return false
    }
  })
  return saveQueue
}

async function goToComplete() {
  clearParticipantClientState()
  const path = `/take/${token}/complete`
  try {
    await navigateTo(path, { replace: true })
  } catch { /* ignore */ }
  if (import.meta.client && !window.location.pathname.startsWith(`/take/${token}/complete`)) {
    window.location.assign(path)
  }
}

async function submitTest() {
  if (submitting.value) return
  submitting.value = true
  persistSubtestTime()
  stopTimers()

  try {
    await saveAnswers()
    const submitted = await $fetch(`/api/sessions/token/${token}/submit`, {
      method: 'POST',
      body: { answers: answers.value },
    })
    if (!submitted.answersSaved) throw new Error('Jawaban belum tersimpan. Silakan coba lagi.')
    status.value = 'completed'
    await goToComplete()
  } catch (err) {
    const msg = err?.data?.message || err?.message || ''
    error.value = msg || 'Gagal mengirim jawaban'
    submitting.value = false
    beginAutoSave()
  }
}

function restoreInProgress(session) {
  answers.value = session.answers || {}
  started.value = true
  prepareQuestions()
  beginAutoSave()

  const meta = session.metadata || {}
  if (meta.subtestTimers && typeof meta.subtestTimers === 'object') {
    subtestTimers.value = { ...meta.subtestTimers }
  }
  if (typeof meta.currentQuestionIndex === 'number') {
    currentIndex.value = Math.min(meta.currentQuestionIndex, Math.max(questions.value.length - 1, 0))
  }
  if (meta.currentSubtest) activeSubtestCode.value = meta.currentSubtest

  if (hasSubtests.value) {
    const q = currentQuestion.value
    if (q?.type === 'instruction') {
      stopCountdown()
      return
    }
    const code = q?.subtestKey || q?.subtest || activeSubtestCode.value
    const st = getSubtestConfig(code)
    const remaining = subtestTimers.value[code]
    if (remaining != null && remaining <= 0) {
      onSubtestTimeout()
      return
    }
    const seconds = remaining ?? st?.timeLimit
    if (code && seconds > 0) startSubtestCountdown(code, seconds)
    return
  }

  const elapsedSec = session.startedAt
    ? Math.floor((Date.now() + clockOffset - new Date(session.startedAt).getTime()) / 1000)
    : 0
  const totalSec = (config.value?.timeLimit || 0) * 60
  const left = Math.max(totalSec - elapsedSec, 0)
  if (config.value?.timeLimit && left <= 0) {
    submitTest()
  } else if (totalSec > 0) {
    startGlobalCountdown(left)
  }
}

onMounted(async () => {
  if (route.matched.length > 1) {
    // Nested child route (e.g. /complete) handles its own data fetching.
    loading.value = false
    return
  }

  try {
    await refreshAppSettings()
    if (systemLocked.value || maintenanceMode.value) {
      const flags = {
        systemLocked: systemLocked.value,
        maintenanceMode: maintenanceMode.value,
      }
      accessBlocked.value = {
        code: systemLocked.value ? 'SYSTEM_LOCKED' : 'MAINTENANCE_MODE',
        title: systemAccessTitle(flags),
        icon: systemAccessIcon(flags),
      }
      error.value = systemAccessMessage(flags, maintenanceMessage.value)
      loading.value = false
      return
    }

    const data = await $fetch(`/api/sessions/token/${token}`)
    const session = data.session
    clockOffset = Date.parse(data.serverTime) - Date.now()
    status.value = session.status

    if (['completed', 'verified'].includes(session.status)) {
      await goToComplete()
      return
    }

    test.value = session.testType
    participantName.value = session.participantName
    config.value = test.value.config

    const cfgInstructions = config.value?.instructions
    if (Array.isArray(cfgInstructions) && cfgInstructions.length) {
      instructions.value = cfgInstructions
    } else if (typeof cfgInstructions === 'string' && cfgInstructions) {
      instructions.value = [cfgInstructions]
    } else if (config.value?.instructionText) {
      instructions.value = [config.value.instructionText]
    } else {
      instructions.value = ['Ikuti petunjuk yang diberikan.']
    }

    if (session.status === 'in_progress') {
      restoreInProgress(session)
    }
    loading.value = false
  } catch (err) {
    const blocked = parseSystemAccessError(err)
    if (blocked) {
      accessBlocked.value = blocked
      error.value = systemAccessMessage(blocked.code, maintenanceMessage.value)
    } else {
      error.value = err?.data?.message || err?.message || 'Undangan tidak ditemukan'
    }
    loading.value = false
  }
})

onUnmounted(() => {
  persistSubtestTime()
  stopTimers()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
