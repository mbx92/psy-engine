<template>
  <div class="space-y-4 md:space-y-6 max-w-6xl">
    <div v-if="loading" class="text-sm text-muted-foreground text-center py-12">Loading...</div>

    <div v-else-if="loadError" class="text-sm text-destructive text-center py-12">{{ loadError }}</div>

    <template v-else>
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Edit Test Type</h1>
        <p class="text-sm md:text-base text-muted-foreground">{{ form.name }} · <code class="text-xs bg-muted px-1 py-0.5 rounded">{{ form.slug }}</code></p>
      </div>

      <form @submit.prevent="handleUpdate" class="space-y-6">
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
              <UiInput id="slug" v-model="form.slug" required class="h-10 font-mono" />
              <p class="text-xs text-muted-foreground">Changing this changes the invitation URL for future sessions.</p>
            </div>
            <div class="space-y-2">
              <UiLabel for="type">Type</UiLabel>
              <UiInput id="type" v-model="form.type" required class="h-10" />
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

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UiCard>
            <UiCardHeader>
              <UiCardTitle>Config</UiCardTitle>
              <UiCardDescription>Timing, navigation, participant requirements, instructions, subtests</UiCardDescription>
            </UiCardHeader>
            <UiCardContent>
              <AdminTestTypeConfigEditor v-model="config" />
            </UiCardContent>
          </UiCard>

          <UiCard>
            <UiCardHeader>
              <UiCardTitle>Scoring Config</UiCardTitle>
              <UiCardDescription>Algorithm, dimensions, interpretations</UiCardDescription>
            </UiCardHeader>
            <UiCardContent>
              <TestTypeEditorScoringConfigForm v-model="scoringConfig" />
            </UiCardContent>
          </UiCard>
        </div>

        <UiCard>
          <UiCardHeader>
            <UiCardTitle>Questions</UiCardTitle>
            <UiCardDescription>{{ questions.length }} question{{ questions.length === 1 ? '' : 's' }}</UiCardDescription>
          </UiCardHeader>
          <UiCardContent>
            <TestTypeEditorQuestionsBuilder v-model="questions" :subtests="config.subtests || []" :test-type="form.type" />
          </UiCardContent>
        </UiCard>

        <div v-if="submitError" class="text-xs text-destructive">{{ submitError }}</div>
        <div v-if="submitSuccess" class="text-xs text-green-600">{{ submitSuccess }}</div>

        <div class="flex items-center gap-3">
          <UiButton type="submit" :disabled="submitting" class="h-10">
            {{ submitting ? 'Saving...' : 'Save Changes' }}
          </UiButton>
          <UiButton type="button" variant="outline" class="h-10" @click="navigateTo('/admin/test-types')">Back</UiButton>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const id = route.params.id
const { getAuthHeaders } = useAuth()
const toast = useToast()

const loading = ref(true)
const loadError = ref('')

const form = reactive({
  name: '',
  slug: '',
  type: '',
  description: '',
  isActive: true,
})

const config = ref({})
const questions = ref([])
const scoringConfig = ref({})

const submitError = ref('')
const submitSuccess = ref('')
const submitting = ref(false)

async function handleUpdate() {
  submitError.value = ''
  submitSuccess.value = ''

  submitting.value = true
  try {
    await $fetch(`/api/admin/test-types/${id}`, {
      method: 'PUT',
      body: { ...form, config: config.value, questions: questions.value, scoringConfig: scoringConfig.value },
      headers: getAuthHeaders(),
    })
    submitSuccess.value = 'Saved'
    toast.success('Test type saved')
  } catch (err) {
    submitError.value = err?.data?.message || err?.message || 'Failed to save test type'
    toast.error(submitError.value)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const data = await $fetch(`/api/admin/test-types/${id}`, { headers: getAuthHeaders() })
    const t = data.testType
    form.name = t.name
    form.slug = t.slug
    form.type = t.type
    form.description = t.description || ''
    form.isActive = !!t.isActive
    config.value = t.config ?? {}
    questions.value = t.questions ?? []
    scoringConfig.value = t.scoringConfig ?? {}
  } catch (err) {
    loadError.value = err?.data?.message || 'Failed to load test type'
  } finally {
    loading.value = false
  }
})
</script>
