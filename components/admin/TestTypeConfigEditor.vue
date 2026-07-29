<template>
  <div class="space-y-5">
    <div class="flex items-center justify-end">
      <button
        type="button"
        class="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        @click="toggleMode"
      >
        {{ mode === 'form' ? 'Edit as raw JSON' : 'Back to form' }}
      </button>
    </div>

    <!-- Raw JSON mode -->
    <div v-if="mode === 'raw'" class="space-y-2">
      <UiTextarea v-model="rawText" class="min-h-40 font-mono text-xs" spellcheck="false" @input="onRawInput" />
      <p v-if="rawError" class="text-xs text-destructive">{{ rawError }}</p>
    </div>

    <!-- Humanized form mode -->
    <div v-else class="space-y-5">
      <section class="space-y-3">
        <h4 class="text-sm font-medium">Timing &amp; Navigation</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <UiLabel>Time Limit (minutes)</UiLabel>
            <UiInput
              type="number" min="0" class="h-10"
              :model-value="local.timeLimit ?? ''"
              placeholder="No limit"
              @update:model-value="setNumber('timeLimit', $event, true)"
            />
            <p class="text-xs text-muted-foreground">Leave blank for no overall time limit.</p>
          </div>
          <div class="space-y-1.5">
            <UiLabel>Questions per Page</UiLabel>
            <UiInput
              type="number" min="1" class="h-10"
              :model-value="local.questionsPerPage ?? 1"
              @update:model-value="setNumber('questionsPerPage', $event)"
            />
          </div>
          <div class="space-y-1.5">
            <UiLabel>Total Questions</UiLabel>
            <UiInput
              type="number" min="0" class="h-10"
              :model-value="local.totalQuestions ?? ''"
              placeholder="Auto"
              @update:model-value="setNumber('totalQuestions', $event, true)"
            />
            <p class="text-xs text-muted-foreground">Reference count used for scoring. Leave blank to auto-match the question list.</p>
          </div>
        </div>

        <AdminConfigToggleRow v-model="local.allowSkip" label="Allow skipping questions" />
        <AdminConfigToggleRow v-model="local.allowBack" label="Allow going back to previous questions" />
        <AdminConfigToggleRow v-model="local.randomize" label="Randomize question order" @update:model-value="mirrorRandomize" />
        <AdminConfigToggleRow v-model="local.showProgress" label="Show progress bar" />
        <AdminConfigToggleRow v-model="local.autoSubmitOnTimeout" label="Auto-submit when time runs out" />
      </section>

      <UiSeparator />

      <section class="space-y-3">
        <h4 class="text-sm font-medium">Participant Requirements</h4>
        <AdminConfigToggleRow v-model="local.requiresAge" label="Require participant age" />
        <AdminConfigToggleRow v-model="local.requiresBirthDate" label="Require participant birth date" />
      </section>

      <UiSeparator />

      <section class="space-y-3">
        <h4 class="text-sm font-medium">Instructions</h4>
        <p class="text-xs text-muted-foreground">Shown to participants before they start the test.</p>

        <div class="space-y-1.5">
          <UiLabel class="text-xs">Intro text (optional)</UiLabel>
          <UiTextarea v-model="local.instructionText" class="min-h-20" placeholder="Shown as a single paragraph before the checklist below" />
        </div>

        <div v-for="(_, i) in instructionList" :key="i" class="flex items-start gap-2">
          <span class="text-xs text-muted-foreground mt-2.5 w-4 shrink-0">{{ i + 1 }}.</span>
          <UiInput
            :model-value="instructionList[i]"
            class="h-10"
            @update:model-value="updateInstruction(i, $event)"
          />
          <UiButton type="button" variant="ghost" size="icon" class="size-10 shrink-0" @click="removeInstruction(i)">
            <Icon icon="lucide:x" class="size-4" />
          </UiButton>
        </div>
        <UiButton type="button" variant="outline" size="sm" @click="addInstruction">
          <Icon icon="lucide:plus" class="size-4 mr-1" />
          Add instruction
        </UiButton>
      </section>

      <UiSeparator />
      <section class="space-y-3">
        <h4 class="text-sm font-medium">Subtests</h4>
        <AdminConfigToggleRow v-model="local.hasSubtests" label="This test is divided into subtests" />

        <template v-if="local.hasSubtests">
          <AdminConfigToggleRow v-model="local.subtestTimeLimit" label="Each subtest has its own time limit" />
          <AdminConfigToggleRow v-model="local.subtestProtection" label="Lock participants into the current subtest (no going back)" />

          <div class="space-y-3 pt-1">
            <div
              v-for="(st, i) in local.subtests"
              :key="i"
              class="rounded-md border p-3 space-y-2"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-medium text-muted-foreground">Subtest {{ i + 1 }}</span>
                <UiButton type="button" variant="ghost" size="icon" class="size-7" @click="removeSubtest(i)">
                  <Icon icon="lucide:trash-2" class="size-3.5" />
                </UiButton>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="space-y-1">
                  <UiLabel class="text-xs">Code</UiLabel>
                  <UiInput :model-value="st.code" class="h-9 font-mono text-xs" @update:model-value="setSubtestCode(i, $event)" />
                </div>
                <div class="space-y-1">
                  <UiLabel class="text-xs">Label</UiLabel>
                  <UiInput v-model="st.label" class="h-9" />
                </div>
                <div class="space-y-1">
                  <UiLabel class="text-xs">Time Limit (seconds)</UiLabel>
                  <UiInput type="number" min="0" :model-value="st.timeLimit ?? ''" class="h-9" @update:model-value="setSubtestNumber(i, 'timeLimit', $event)" />
                </div>
                <div class="space-y-1">
                  <UiLabel class="text-xs">Question Count</UiLabel>
                  <UiInput type="number" min="0" :model-value="st.questionCount ?? ''" class="h-9" @update:model-value="setSubtestNumber(i, 'questionCount', $event)" />
                </div>
              </div>
              <div class="space-y-1">
                <UiLabel class="text-xs">Description</UiLabel>
                <UiInput v-model="st.description" class="h-9" />
              </div>
            </div>
            <UiButton type="button" variant="outline" size="sm" @click="addSubtest">
              <Icon icon="lucide:plus" class="size-4 mr-1" />
              Add subtest
            </UiButton>
          </div>
        </template>
      </section>

      <template v-if="otherKeys.length">
        <UiSeparator />
        <details class="group">
          <summary class="text-sm font-medium cursor-pointer select-none">
            Other settings ({{ otherKeys.length }})
          </summary>
          <div class="mt-3 space-y-2">
            <p class="text-xs text-muted-foreground">
              Fields not recognized by this form. Edit as JSON — they'll be merged back in.
            </p>
            <UiTextarea v-model="advancedText" class="min-h-24 font-mono text-xs" spellcheck="false" @input="onAdvancedInput" />
            <p v-if="advancedError" class="text-xs text-destructive">{{ advancedError }}</p>
          </div>
        </details>
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue'])

const KNOWN_KEYS = [
  'timeLimit', 'questionsPerPage', 'allowSkip', 'allowBack', 'randomize', 'randomizeQuestions',
  'showProgress', 'autoSubmitOnTimeout', 'requiresAge', 'requiresBirthDate',
  'hasSubtests', 'subtestTimeLimit', 'subtestProtection', 'totalQuestions',
  'instructions', 'instructionText', 'subtests',
]

const local = reactive(normalize(props.modelValue))
const mode = ref('form')
const rawText = ref(stringify(local))
const rawError = ref('')
const advancedError = ref('')

function normalize(src) {
  const c = JSON.parse(JSON.stringify(src || {}))
  if (c.timeLimit === undefined) c.timeLimit = null
  if (c.questionsPerPage === undefined) c.questionsPerPage = 1
  if (c.totalQuestions === undefined) c.totalQuestions = null
  if (c.instructionText === undefined) c.instructionText = ''
  if (!Array.isArray(c.instructions)) c.instructions = []
  if (!Array.isArray(c.subtests)) c.subtests = []
  return c
}

function stringify(obj) {
  return JSON.stringify(obj, null, 2)
}

const instructionList = computed(() => local.instructions)

function addInstruction() {
  local.instructions.push('')
}
function updateInstruction(i, val) {
  local.instructions[i] = val
}
function removeInstruction(i) {
  local.instructions.splice(i, 1)
}

function addSubtest() {
  local.subtests.push({ code: '', key: '', label: '', timeLimit: null, questionCount: null, description: '' })
}
function removeSubtest(i) {
  local.subtests.splice(i, 1)
}
function setSubtestCode(i, val) {
  local.subtests[i].code = val
  local.subtests[i].key = val
}
function setSubtestNumber(i, key, val) {
  if (val === '' || val === null || val === undefined) {
    local.subtests[i][key] = null
    return
  }
  const n = Number(val)
  local.subtests[i][key] = Number.isNaN(n) ? null : n
}

function mirrorRandomize(val) {
  if ('randomizeQuestions' in local) local.randomizeQuestions = val
}

function setNumber(key, val, nullable = false) {
  if (val === '' || val === null || val === undefined) {
    local[key] = nullable ? null : 0
    return
  }
  const n = Number(val)
  local[key] = Number.isNaN(n) ? (nullable ? null : 0) : n
}

const otherKeys = computed(() => Object.keys(local).filter((k) => !KNOWN_KEYS.includes(k)))
const advancedText = ref(stringify(pickOther(local)))

function pickOther(obj) {
  const out = {}
  for (const k of otherKeys.value) out[k] = obj[k]
  return out
}

function onAdvancedInput() {
  advancedError.value = ''
  let parsed
  try {
    parsed = JSON.parse(advancedText.value || '{}')
  } catch (err) {
    advancedError.value = `Invalid JSON: ${err.message}`
    return
  }
  for (const k of otherKeys.value) {
    if (!(k in parsed)) delete local[k]
  }
  for (const [k, v] of Object.entries(parsed)) {
    if (!KNOWN_KEYS.includes(k)) local[k] = v
  }
}

function onRawInput() {
  rawError.value = ''
  try {
    const parsed = JSON.parse(rawText.value)
    Object.keys(local).forEach((k) => delete local[k])
    Object.assign(local, normalize(parsed))
    advancedText.value = stringify(pickOther(local))
  } catch (err) {
    rawError.value = `Invalid JSON: ${err.message}`
  }
}

function toggleMode() {
  if (mode.value === 'form') {
    rawText.value = stringify(local)
    rawError.value = ''
    mode.value = 'raw'
  } else {
    if (rawError.value) return
    mode.value = 'form'
  }
}

watch(local, () => {
  emit('update:modelValue', JSON.parse(JSON.stringify(local)))
}, { deep: true })

watch(() => props.modelValue, (v) => {
  const next = normalize(v)
  if (stringify(next) === stringify(local)) return
  Object.keys(local).forEach((k) => delete local[k])
  Object.assign(local, next)
  advancedText.value = stringify(pickOther(local))
  if (mode.value === 'raw') rawText.value = stringify(local)
})
</script>
