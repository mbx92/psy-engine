<template>
  <div class="space-y-4 md:space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Test Types</h1>
        <p class="text-sm md:text-base text-muted-foreground">Manage test definitions</p>
      </div>
      <UiButton v-if="can('tests:create')" @click="navigateTo('/admin/test-types/create')" class="shrink-0">
        <Icon icon="lucide:plus" class="size-4 md:mr-2" />
        <span class="hidden md:inline">Add Test Type</span>
      </UiButton>
    </div>

    <!-- Data Table -->
    <UiResponsiveTable
      :columns="columns"
      :data="tests"
      item-key="id"
    >
      <template #empty>
        <EmptyState
          icon="lucide:clipboard-list"
          title="No test types yet"
          description="Create your first test type to start building assessments."
        />
      </template>
      <template #cell-name="{ row }">
        <span class="font-medium text-sm truncate block max-w-[120px] md:max-w-none">
          {{ row.name }}
        </span>
      </template>

      <template #cell-slug="{ row }">
        <code class="text-xs bg-muted px-1 py-0.5 rounded">{{ row.slug }}</code>
      </template>

      <template #cell-type="{ row }">
        <UiBadge
          :variant="row.type === 'aptitude' ? 'default' : 'secondary'"
          class="text-xs whitespace-nowrap"
        >
          {{ row.type }}
        </UiBadge>
      </template>

      <template #cell-questions="{ row }">
        <span class="text-sm">{{ row.questionCount || '—' }}</span>
      </template>

      <template #cell-status="{ row }">
        <div class="flex items-center gap-1.5">
          <span class="inline-block size-2 rounded-full" :class="row.isActive ? 'bg-green-500' : 'bg-muted-foreground/40'" />
          <span class="text-xs font-medium" :class="row.isActive ? 'text-green-600' : 'text-muted-foreground'">
            {{ row.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </template>

      <template #cell-actions="{ row }">
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton variant="ghost" size="icon" class="size-8">
              <Icon icon="lucide:more-horizontal" class="size-4" />
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end">
            <UiDropdownMenuItem
              v-if="can('tests:update')"
              @click="navigateTo('/admin/test-types/' + row.id + '/edit')"
            >
              <Icon icon="lucide:pencil" class="size-4 mr-2" />
              Edit
            </UiDropdownMenuItem>
            <UiDropdownMenuItem
              v-if="can('tests:delete') && row.isActive"
              class="text-destructive"
              @click="deactivateTestType(row)"
            >
              <Icon icon="lucide:trash-2" class="size-4 mr-2" />
              Deactivate
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </template>
    </UiResponsiveTable>

    <div v-if="testsError" class="text-xs text-destructive">{{ testsError }}</div>
    <div v-if="testsSuccess" class="text-xs text-green-600">{{ testsSuccess }}</div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { can, getAuthHeaders } = useAuth()
const toast = useToast()
const { confirm } = useConfirm()

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug', headClass: 'hidden sm:table-cell' },
  { key: 'type', label: 'Type' },
  { key: 'questions', label: 'Qty', headClass: 'hidden sm:table-cell' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', headClass: 'w-20', mobileLabel: '' },
]

const tests = ref([])
const testsError = ref('')
const testsSuccess = ref('')

async function loadTestTypes() {
  testsError.value = ''
  try {
    const data = await $fetch('/api/admin/test-types', { headers: getAuthHeaders() })
    tests.value = data.testTypes || []
  } catch (err) {
    testsError.value = err?.data?.message || 'Failed to load test types'
    toast.error(testsError.value)
  }
}

async function deactivateTestType(row) {
  const ok = await confirm({
    title: `Deactivate "${row.name}"?`,
    description: "Existing sessions using it remain valid, but it won't be assignable to new sessions.",
    confirmLabel: 'Deactivate',
    variant: 'destructive',
  })
  if (!ok) return

  testsError.value = ''
  testsSuccess.value = ''
  try {
    await $fetch(`/api/admin/test-types/${row.id}`, { method: 'DELETE', headers: getAuthHeaders() })
    row.isActive = false
    testsSuccess.value = `${row.name} deactivated`
    toast.success(testsSuccess.value)
  } catch (err) {
    testsError.value = err?.data?.message || 'Failed to deactivate test type'
    toast.error(testsError.value)
  }
}

await loadTestTypes()
</script>
