<template>
  <div class="space-y-4 md:space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Compare Sessions</h1>
        <p class="text-sm md:text-base text-muted-foreground">Compare completed scores across sessions for a test type</p>
      </div>
      <UiButton variant="outline" @click="navigateTo('/admin/sessions')">
        <Icon icon="lucide:arrow-left" class="size-4 md:mr-2" />
        <span class="hidden md:inline">Back</span>
      </UiButton>
    </div>

    <div class="flex flex-wrap gap-3 items-end">
      <div class="space-y-2 w-56">
        <UiLabel>Test Type</UiLabel>
        <UiSelect v-model="testTypeId">
          <UiSelectTrigger class="h-10">
            <UiSelectValue placeholder="Select test type" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem v-for="t in testTypes" :key="t.id" :value="t.id">{{ t.name }}</UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>
      <div class="space-y-2 w-64">
        <UiLabel>Participant (optional)</UiLabel>
        <UiInput v-model="participantSearch" placeholder="Search participant..." class="h-10" />
      </div>
    </div>

    <div v-if="loading" class="text-sm text-muted-foreground text-center py-8">Loading...</div>
    <div v-else-if="error" class="text-sm text-destructive text-center py-8">{{ error }}</div>
    <div v-else-if="!testTypeId" class="text-sm text-muted-foreground text-center py-8">Select a test type to compare sessions.</div>

    <template v-else>
      <div v-if="!sessions.length" class="text-sm text-muted-foreground text-center py-8">
        No completed sessions found for this test type{{ participantId ? ' and participant' : '' }}.
      </div>

      <div v-else class="overflow-x-auto rounded-md border">
        <UiTable>
          <UiTableHeader>
            <UiTableRow>
              <UiTableHead>Participant</UiTableHead>
              <UiTableHead>Completed</UiTableHead>
              <UiTableHead v-for="key in dimensionKeys" :key="key">{{ key }}</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow v-for="s in sessions" :key="s.id">
              <UiTableCell class="font-medium">{{ s.participantName }}</UiTableCell>
              <UiTableCell>{{ formatDate(s.completedAt) }}</UiTableCell>
              <UiTableCell v-for="key in dimensionKeys" :key="key">{{ s.dimensions[key] ?? '—' }}</UiTableCell>
            </UiTableRow>
          </UiTableBody>
          <UiTableFooter>
            <UiTableRow>
              <UiTableCell class="font-semibold">Average</UiTableCell>
              <UiTableCell />
              <UiTableCell v-for="key in dimensionKeys" :key="key" class="font-semibold">
                {{ aggregate[key]?.avg ?? '—' }}
              </UiTableCell>
            </UiTableRow>
            <UiTableRow>
              <UiTableCell class="text-xs text-muted-foreground">Median</UiTableCell>
              <UiTableCell />
              <UiTableCell v-for="key in dimensionKeys" :key="key" class="text-xs text-muted-foreground">
                {{ aggregate[key]?.median ?? '—' }}
              </UiTableCell>
            </UiTableRow>
            <UiTableRow>
              <UiTableCell class="text-xs text-muted-foreground">Min / Max</UiTableCell>
              <UiTableCell />
              <UiTableCell v-for="key in dimensionKeys" :key="key" class="text-xs text-muted-foreground">
                {{ aggregate[key] ? `${aggregate[key].min} / ${aggregate[key].max}` : '—' }}
              </UiTableCell>
            </UiTableRow>
          </UiTableFooter>
        </UiTable>
      </div>
    </template>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { getAuthHeaders } = useAuth()

const testTypes = ref([])
const testTypeId = ref('')
const participantSearch = ref('')
const participantId = ref('')

const sessions = ref([])
const aggregate = ref({})
const loading = ref(false)
const error = ref('')

const dimensionKeys = computed(() => Object.keys(aggregate.value))

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function loadTestTypes() {
  try {
    const data = await $fetch('/api/admin/test-types', { headers: getAuthHeaders() })
    testTypes.value = (data.testTypes || []).filter((t) => t.isActive)
  } catch {
    // non-fatal; the select will just be empty
  }
}

let participantDebounce = null
watch(participantSearch, () => {
  clearTimeout(participantDebounce)
  participantDebounce = setTimeout(async () => {
    if (!participantSearch.value) {
      participantId.value = ''
      return
    }
    try {
      const data = await $fetch('/api/participants', { query: { search: participantSearch.value }, headers: getAuthHeaders() })
      participantId.value = data.participants?.[0]?.id || ''
    } catch {
      participantId.value = ''
    }
  }, 300)
})

async function loadComparison() {
  if (!testTypeId.value) return
  loading.value = true
  error.value = ''
  try {
    const query = { testTypeId: testTypeId.value }
    if (participantId.value) query.participantId = participantId.value
    const data = await $fetch('/api/sessions/compare', { query, headers: getAuthHeaders() })
    sessions.value = data.sessions || []
    aggregate.value = data.aggregate || {}
  } catch (err) {
    error.value = err?.data?.message || 'Failed to load comparison'
  } finally {
    loading.value = false
  }
}

watch([testTypeId, participantId], loadComparison)

onMounted(loadTestTypes)
</script>
