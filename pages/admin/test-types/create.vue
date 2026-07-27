<template>
  <div class="space-y-4 md:space-y-6 max-w-3xl">
    <div>
      <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Add Test Type</h1>
      <p class="text-sm md:text-base text-muted-foreground">Define a new test — basic info plus its config/questions/scoring as JSON</p>
    </div>

    <form @submit.prevent="handleCreate" class="space-y-6">
      <UiCard>
        <UiCardHeader>
          <UiCardTitle>Basic Info</UiCardTitle>
        </UiCardHeader>
        <UiCardContent class="space-y-4">
          <div class="space-y-2">
            <UiLabel for="name">Name</UiLabel>
            <UiInput id="name" v-model="form.name" required class="h-10" />
          </div>
          <div class="space-y-2">
            <UiLabel for="slug">Slug</UiLabel>
            <UiInput id="slug" v-model="form.slug" required class="h-10 font-mono" placeholder="e.g. cfit-scale-2" />
            <p class="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only. Used in the invitation URL.</p>
          </div>
          <div class="space-y-2">
            <UiLabel for="type">Type</UiLabel>
            <UiInput id="type" v-model="form.type" required class="h-10" placeholder="e.g. aptitude, personality" />
          </div>
          <div class="space-y-2">
            <UiLabel for="description">Description</UiLabel>
            <UiTextarea id="description" v-model="form.description" class="min-h-20" />
          </div>
          <label class="flex items-center justify-between gap-2 text-sm rounded-md border px-3 py-2 max-w-xs">
            <span>Active</span>
            <UiSwitch v-model="form.isActive" />
          </label>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle>Config (JSON)</UiCardTitle>
          <UiCardDescription>timeLimit, allowSkip, randomize, questionsPerPage, instructions, subtests, ...</UiCardDescription>
        </UiCardHeader>
        <UiCardContent>
          <UiTextarea v-model="configText" class="min-h-40 font-mono text-xs" spellcheck="false" />
          <p v-if="configError" class="text-xs text-destructive mt-2">{{ configError }}</p>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle>Questions (JSON array)</UiCardTitle>
        </UiCardHeader>
        <UiCardContent>
          <UiTextarea v-model="questionsText" class="min-h-60 font-mono text-xs" spellcheck="false" />
          <p v-if="questionsError" class="text-xs text-destructive mt-2">{{ questionsError }}</p>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle>Scoring Config (JSON)</UiCardTitle>
          <UiCardDescription>algorithm, dimensions, interpretations</UiCardDescription>
        </UiCardHeader>
        <UiCardContent>
          <UiTextarea v-model="scoringConfigText" class="min-h-40 font-mono text-xs" spellcheck="false" />
          <p v-if="scoringConfigError" class="text-xs text-destructive mt-2">{{ scoringConfigError }}</p>
        </UiCardContent>
      </UiCard>

      <div v-if="submitError" class="text-xs text-destructive">{{ submitError }}</div>

      <div class="flex items-center gap-3">
        <UiButton type="submit" :disabled="submitting" class="h-10">
          {{ submitting ? 'Creating...' : 'Create Test Type' }}
        </UiButton>
        <UiButton type="button" variant="outline" class="h-10" @click="navigateTo('/admin/test-types')">Cancel</UiButton>
      </div>
    </form>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { getAuthHeaders } = useAuth()
const toast = useToast()

const form = reactive({
  name: '',
  slug: '',
  type: '',
  description: '',
  isActive: true,
})

const configText = ref(JSON.stringify({ timeLimit: 20, allowSkip: false, randomize: true, questionsPerPage: 1, instructions: [] }, null, 2))
const questionsText = ref('[]')
const scoringConfigText = ref(JSON.stringify({ algorithm: 'correct_count', dimensions: [], interpretations: {} }, null, 2))

const configError = ref('')
const questionsError = ref('')
const scoringConfigError = ref('')
const submitError = ref('')
const submitting = ref(false)

function parseJsonField(text, errorRef, fieldLabel) {
  errorRef.value = ''
  try {
    return JSON.parse(text)
  } catch (err) {
    errorRef.value = `Invalid JSON in ${fieldLabel}: ${err.message}`
    return undefined
  }
}

async function handleCreate() {
  submitError.value = ''

  const config = parseJsonField(configText.value, configError, 'Config')
  const questions = parseJsonField(questionsText.value, questionsError, 'Questions')
  const scoringConfig = parseJsonField(scoringConfigText.value, scoringConfigError, 'Scoring Config')

  if (config === undefined || questions === undefined || scoringConfig === undefined) {
    return
  }

  submitting.value = true
  try {
    const data = await $fetch('/api/admin/test-types', {
      method: 'POST',
      body: { ...form, config, questions, scoringConfig },
      headers: getAuthHeaders(),
    })
    toast.success(`${data.testType.name} created`)
    navigateTo(`/admin/test-types/${data.testType.id}/edit`)
  } catch (err) {
    submitError.value = err?.data?.message || err?.message || 'Failed to create test type'
    toast.error(submitError.value)
  } finally {
    submitting.value = false
  }
}
</script>
