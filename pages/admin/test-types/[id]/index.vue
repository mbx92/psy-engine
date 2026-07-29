<template>
  <div class="w-full max-w-3xl space-y-4 md:space-y-6">
    <div v-if="loading" class="text-sm text-muted-foreground text-center py-16">Loading...</div>
    <div v-else-if="loadError" class="text-sm text-destructive text-center py-16">{{ loadError }}</div>

    <template v-else>
      <!-- Header -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0 space-y-1">
          <UiButton variant="ghost" size="sm" class="-ml-2 h-8 px-2" @click="navigateTo('/admin/test-types')">
            <Icon icon="lucide:arrow-left" class="size-4 mr-1" />
            Test Types
          </UiButton>
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight truncate">{{ testType.name }}</h1>
          <div class="flex flex-wrap items-center gap-2">
            <code class="text-xs bg-muted px-1 py-0.5 rounded">{{ testType.slug }}</code>
            <UiBadge :variant="testType.type === 'aptitude' ? 'default' : 'secondary'" class="text-xs">
              {{ testType.type }}
            </UiBadge>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <label class="flex items-center gap-2 text-sm rounded-md border px-3 py-2">
            <span class="text-muted-foreground">{{ testType.isActive ? 'Active' : 'Inactive' }}</span>
            <UiSwitch
              :model-value="testType.isActive"
              :disabled="togglingActive || !(can('tests:update') || can('tests:delete'))"
              @update:model-value="onToggleActive"
            />
          </label>
          <UiButton v-if="can('tests:update')" size="sm" @click="navigateTo(`/admin/test-types/${id}/edit`)">
            <Icon icon="lucide:pencil" class="size-4 mr-1" />
            Edit
          </UiButton>
        </div>
      </div>

      <div v-if="actionError" class="text-xs text-destructive">{{ actionError }}</div>

      <!-- Basic info -->
      <UiCard>
        <UiCardHeader class="pb-3">
          <UiCardTitle class="text-sm">Basic Info</UiCardTitle>
        </UiCardHeader>
        <UiCardContent class="space-y-2 text-sm">
          <MetaRow label="Name" :value="testType.name" />
          <MetaRow label="Slug" :value="testType.slug" />
          <MetaRow label="Type" :value="testType.type" />
          <MetaRow label="Description" :value="testType.description || '—'" />
          <MetaRow label="Created" :value="formatDateTime(testType.createdAt)" />
          <MetaRow label="Updated" :value="formatDateTime(testType.updatedAt)" />
        </UiCardContent>
      </UiCard>

      <!-- Config summary -->
      <UiCard>
        <UiCardHeader class="pb-3">
          <UiCardTitle class="text-sm">Config</UiCardTitle>
        </UiCardHeader>
        <UiCardContent class="space-y-2 text-sm">
          <MetaRow label="Questions" :value="testType.questions?.length ?? 0" />
          <MetaRow label="Time limit" :value="testType.config?.timeLimit ? `${testType.config.timeLimit} min` : '—'" />
          <MetaRow label="Allow skip" :value="testType.config?.allowSkip ? 'Yes' : 'No'" />
          <MetaRow label="Randomize" :value="testType.config?.randomize ? 'Yes' : 'No'" />
          <MetaRow label="Subtests" :value="testType.config?.subtests?.length ?? '—'" />
        </UiCardContent>
      </UiCard>

      <!-- Scoring summary -->
      <UiCard>
        <UiCardHeader class="pb-3">
          <UiCardTitle class="text-sm">Scoring</UiCardTitle>
        </UiCardHeader>
        <UiCardContent class="space-y-2 text-sm">
          <MetaRow label="Algorithm" :value="testType.scoringConfig?.algorithm || '—'" />
          <MetaRow label="Dimensions" :value="testType.scoringConfig?.dimensions?.length ?? 0" />
        </UiCardContent>
      </UiCard>
    </template>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const MetaRow = (props) => h('div', { class: 'flex justify-between gap-3' }, [
  h('span', { class: 'text-muted-foreground shrink-0' }, props.label),
  h('span', { class: 'font-medium text-right break-words' }, String(props.value ?? '—')),
])
MetaRow.props = { label: String, value: [String, Number] }

const route = useRoute()
const id = route.params.id
const { can, getAuthHeaders } = useAuth()
const toast = useToast()
const { confirm } = useConfirm()

const loading = ref(true)
const loadError = ref('')
const actionError = ref('')
const togglingActive = ref(false)
const testType = ref({})

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

async function loadTestType() {
  loadError.value = ''
  try {
    const data = await $fetch(`/api/admin/test-types/${id}`, { headers: getAuthHeaders() })
    testType.value = data.testType
  } catch (err) {
    loadError.value = err?.data?.message || 'Failed to load test type'
  } finally {
    loading.value = false
  }
}

async function onToggleActive(nextValue) {
  actionError.value = ''

  if (!nextValue) {
    if (!can('tests:delete')) {
      actionError.value = 'You do not have permission to deactivate test types'
      return
    }
    const ok = await confirm({
      title: `Deactivate "${testType.value.name}"?`,
      description: "Existing sessions using it remain valid, but it won't be assignable to new sessions.",
      confirmLabel: 'Deactivate',
      variant: 'destructive',
    })
    if (!ok) return

    togglingActive.value = true
    try {
      await $fetch(`/api/admin/test-types/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      testType.value.isActive = false
      toast.success(`${testType.value.name} deactivated`)
    } catch (err) {
      actionError.value = err?.data?.message || 'Failed to deactivate test type'
      toast.error(actionError.value)
    } finally {
      togglingActive.value = false
    }
    return
  }

  if (!can('tests:update')) {
    actionError.value = 'You do not have permission to activate test types'
    return
  }
  togglingActive.value = true
  try {
    await $fetch(`/api/admin/test-types/${id}`, {
      method: 'PUT',
      body: { isActive: true },
      headers: getAuthHeaders(),
    })
    testType.value.isActive = true
    toast.success(`${testType.value.name} activated`)
  } catch (err) {
    actionError.value = err?.data?.message || 'Failed to activate test type'
    toast.error(actionError.value)
  } finally {
    togglingActive.value = false
  }
}

await loadTestType()
</script>
