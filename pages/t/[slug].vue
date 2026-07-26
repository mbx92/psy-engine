<template>
  <div class="min-h-screen bg-background flex flex-col">

    <!-- Loading state -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center space-y-4">
        <div class="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        <p class="text-sm text-muted-foreground">Loading test...</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center p-4">
      <UiCard class="w-full max-w-sm text-center">
        <UiCardHeader>
          <UiCardTitle class="text-destructive">Test Not Found</UiCardTitle>
          <UiCardDescription>{{ error }}</UiCardDescription>
        </UiCardHeader>
        <UiCardContent>
          <UiButton as="a" href="/" variant="outline" class="w-full">Back to Home</UiButton>
        </UiCardContent>
      </UiCard>
    </div>

    <!-- Instructions screen -->
    <div v-else-if="!started && !result" class="flex-1 flex flex-col">
      <div class="flex-1 overflow-y-auto p-4 md:p-8 max-w-lg mx-auto w-full">
        <div class="space-y-6 pt-4">
          <div>
            <h1 class="text-2xl font-bold">{{ test?.name }}</h1>
            <p class="text-sm text-muted-foreground mt-1">{{ test?.description }}</p>
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
              <span class="font-medium">{{ questions.length }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Waktu</span>
              <span class="font-medium">{{ config?.timeLimit || '—' }} menit</span>
            </div>
            <div v-if="config?.subtests" class="space-y-1 pt-2 border-t">
              <p class="text-xs text-muted-foreground">Subtes:</p>
              <div v-for="st in config.subtests" :key="st.key" class="flex justify-between text-xs pl-2">
                <span>{{ st.label }}</span>
                <span>{{ st.questionCount }} soal / {{ st.timeLimit }} menit</span>
              </div>
            </div>
          </div>

          <UiButton @click="startTest" size="lg" class="w-full h-12 text-base">
            Mulai Test
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Test in progress -->
    <div v-else class="flex-1 flex flex-col">
      <!-- Header with timer & progress -->
      <header class="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div class="px-4 py-2 max-w-lg mx-auto w-full">
          <!-- Timer -->
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-medium">{{ test?.name }}</span>
            <span :class="['text-xs font-mono font-bold', timeWarning ? 'text-destructive animate-pulse' : 'text-muted-foreground']">
              {{ formattedTime }}
            </span>
          </div>
          <!-- Progress bar -->
          <div class="w-full bg-muted rounded-full h-1.5">
            <div class="bg-primary h-1.5 rounded-full transition-all duration-300" :style="{ width: progressPercent + '%' }" />
          </div>
          <div class="flex justify-between mt-0.5">
            <span class="text-[10px] text-muted-foreground">{{ currentIndex + 1 }} of {{ questions.length }}</span>
            <span class="text-[10px] text-muted-foreground">{{ Math.round(progressPercent) }}%</span>
          </div>
        </div>
      </header>

      <!-- Subtest header (CFIT) -->
      <div v-if="currentSubtest" class="bg-primary/5 border-b px-4 py-2">
        <p class="text-xs font-medium text-primary text-center">{{ currentSubtest.label }}</p>
      </div>

      <!-- Question area -->
      <div class="flex-1 overflow-y-auto">
        <div class="p-4 max-w-lg mx-auto w-full">
          <transition name="fade" mode="out-in">
            <div :key="currentIndex" class="space-y-6">
              <!-- Question text -->
              <div>
                <p class="text-xs text-muted-foreground mb-2">Soal {{ currentIndex + 1 }}</p>
                <h2 class="text-base md:text-lg font-semibold leading-relaxed">{{ currentQuestion?.text }}</h2>
              </div>

              <!-- Paired choice layout (PAPI) -->
              <div v-if="isPairedChoice" class="space-y-3">
                <button
                  v-for="opt in currentQuestion.options"
                  :key="opt.id"
                  @click="selectOption(opt.id)"
                  class="w-full text-left p-4 rounded-xl border-2 transition-all active:scale-[0.98]"
                  :class="getSelected(opt.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'"
                >
                  <div class="flex items-start gap-3">
                    <div class="size-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                      :class="getSelected(opt.id) ? 'border-primary bg-primary' : 'border-muted-foreground/30'">
                      <div v-if="getSelected(opt.id)" class="size-2 rounded-full bg-white" />
                    </div>
                    <span class="text-sm leading-relaxed">{{ opt.text }}</span>
                  </div>
                </button>
              </div>

              <!-- Multiple choice / Yes-No layout -->
              <div v-else class="space-y-3">
                <button
                  v-for="opt in currentQuestion.options"
                  :key="opt.id"
                  @click="selectOption(opt.id)"
                  class="w-full text-left p-4 rounded-xl border-2 transition-all active:scale-[0.98]"
                  :class="getSelected(opt.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'"
                >
                  <div class="flex items-start gap-3">
                    <div class="size-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                      :class="getSelected(opt.id) ? 'border-primary bg-primary' : 'border-muted-foreground/30'">
                      <div v-if="getSelected(opt.id)" class="size-2 rounded-full bg-white" />
                    </div>
                    <span class="text-sm">{{ opt.text }}</span>
                  </div>
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Bottom navigation -->
      <div class="sticky bottom-0 border-t bg-background/95 backdrop-blur p-3">
        <div class="max-w-lg mx-auto w-full flex gap-3">
          <UiButton
            v-if="currentIndex > 0"
            variant="outline"
            @click="prevQuestion"
            class="flex-1 h-12"
          >
            Sebelumnya
          </UiButton>
          <UiButton
            v-if="currentIndex < questions.length - 1"
            @click="nextQuestion"
            class="flex-1 h-12"
            :disabled="!hasCurrentAnswer"
          >
            Selanjutnya
          </UiButton>
          <UiButton
            v-else
            @click="submitTest"
            class="flex-1 h-12"
            :disabled="!hasCurrentAnswer || submitting"
          >
            {{ submitting ? 'Mengirim...' : 'Selesai' }}
          </UiButton>
        </div>
      </div>

      <!-- Skip indicator -->
      <div v-if="config?.allowSkip && !hasCurrentAnswer" class="text-[10px] text-muted-foreground text-center pb-2">
        Lewatkan dulu (belum dijawab)
      </div>
    </div>

    <!-- Submitted / Results screen -->
    <div v-if="result" class="flex-1 flex flex-col p-4 md:p-8 max-w-lg mx-auto w-full">
      <div class="flex-1 flex flex-col items-center justify-center space-y-6 text-center">
        <div class="size-16 rounded-full bg-green-100 flex items-center justify-center">
          <Icon icon="lucide:check" class="size-8 text-green-600" />
        </div>
        <h2 class="text-xl font-bold">Test Selesai!</h2>
        <p class="text-sm text-muted-foreground">Jawaban Anda telah tercatat.</p>

        <UiCard v-if="result.scores" class="w-full text-left">
          <UiCardHeader>
            <UiCardTitle class="text-sm">Hasil</UiCardTitle>
          </UiCardHeader>
          <UiCardContent class="space-y-3">
            <div v-for="score in result.scores" :key="score.key" class="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p class="text-sm font-medium">{{ score.label }}</p>
                <p class="text-xs text-muted-foreground">{{ score.description }}</p>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold">{{ score.value }}{{ score.max ? '/' + score.max : '' }}</p>
                <p class="text-xs" :class="score.interpretation === 'High' || score.interpretation === 'Very High' ? 'text-green-600' : score.interpretation === 'Low' ? 'text-destructive' : 'text-muted-foreground'">
                  {{ score.interpretation }}
                </p>
              </div>
            </div>
          </UiCardContent>
        </UiCard>

        <UiButton as="a" href="/" variant="outline" class="w-full">Kembali ke Beranda</UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

type Question = any
type Option = any

// State
const loading = ref(true)
const error = ref('')
const test = ref<any>(null)
const questions = ref<Question[]>([])
const config = ref<any>(null)
const scoringConfig = ref<any>(null)
const instructions = ref<string[]>([])
const answers = ref<Record<string, string>>({})
const currentIndex = ref(0)
const started = ref(false)
const submitting = ref(false)
const result = ref<any>(null)
const timeLeft = ref(0)
const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)
const timeWarning = ref(false)

// Computed
const currentQuestion = computed(() => questions.value[currentIndex.value])
const progressPercent = computed(() => {
  if (!questions.value.length) return 0
  return ((currentIndex.value + 1) / questions.value.length) * 100
})
const hasCurrentAnswer = computed(() => {
  if (!currentQuestion.value) return false
  return answers.value[currentQuestion.value.id] !== undefined || config.value?.allowSkip
})
const isPairedChoice = computed(() => {
  if (!currentQuestion.value) return false
  return currentQuestion.value.options?.some((o: Option) => o.pairWith)
})
const currentSubtest = computed(() => {
  if (!config.value?.subtests || !currentQuestion.value?.subtestKey) return null
  return config.value.subtests.find((s: any) => s.key === currentQuestion.value.subtestKey)
})
const formattedTime = computed(() => {
  const min = Math.floor(timeLeft.value / 60)
  const sec = timeLeft.value % 60
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
})

// Methods
function getSelected(optionId: string) {
  if (!currentQuestion.value) return false
  return answers.value[currentQuestion.value.id] === optionId
}

function selectOption(optionId: string) {
  if (!currentQuestion.value) return
  answers.value[currentQuestion.value.id] = optionId
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
  }
}

function prevQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function startTest() {
  started.value = true
  startTimer()
}

function startTimer() {
  if (!config.value?.timeLimit) return
  timeLeft.value = config.value.timeLimit * 60
  timerInterval.value = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 60) timeWarning.value = true
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval.value!)
      submitTest()
    }
  }, 1000)
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

async function submitTest() {
  if (submitting.value) return
  submitting.value = true
  stopTimer()

  try {
    const data: any = await $fetch(`/api/tests/${slug}/submit`, {
      method: 'POST',
      body: { answers: answers.value },
    })
    result.value = data
  } catch (err: any) {
    error.value = err?.data?.message || err?.message || 'Failed to submit test'
  } finally {
    submitting.value = false
  }
}

// Load test data
onMounted(async () => {
  try {
    const data: any = await $fetch(`/api/tests/${slug}`)
    test.value = data.test || data
    config.value = test.value.config
    scoringConfig.value = test.value.scoringConfig
    instructions.value = config.value?.instructions || ['Ikuti petunjuk yang diberikan.']

    // Parse and prepare questions
    let qs = [...(test.value.questions || [])]
    if (config.value?.randomize) {
      qs = qs.sort(() => Math.random() - 0.5)
    }
    if (config.value?.questionsPerPage && config.value.questionsPerPage > 1) {
      // Group questions if needed — for now, one at a time
    }
    questions.value = qs
  } catch (err: any) {
    error.value = err?.data?.message || err?.message || 'Failed to load test'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  stopTimer()
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
