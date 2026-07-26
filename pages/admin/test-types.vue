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
      :data="tests ?? []"
      item-key="id"
      empty-message="No test types yet."
    >
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
        <span class="text-sm">{{ row.questions?.length || '—' }}</span>
      </template>

      <template #cell-status="{ row }">
        <div class="flex items-center gap-1.5">
          <span class="inline-block size-2 rounded-full bg-green-500" />
          <span class="text-xs text-green-600 font-medium">Active</span>
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
              @click="navigateTo('/admin/test-types/' + row.slug + '/edit')"
            >
              <Icon icon="lucide:pencil" class="size-4 mr-2" />
              Edit
            </UiDropdownMenuItem>
            <UiDropdownMenuItem
              v-if="can('tests:delete')"
              class="text-destructive"
            >
              <Icon icon="lucide:trash-2" class="size-4 mr-2" />
              Delete
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </template>
    </UiResponsiveTable>
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '@/components/ui/responsive-table'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { can } = useAuth()

const columns: ColumnDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug', headClass: 'hidden sm:table-cell' },
  { key: 'type', label: 'Type' },
  { key: 'questions', label: 'Qty', headClass: 'hidden sm:table-cell' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', headClass: 'w-20', mobileLabel: '' },
]

const { data: tests } = await useFetch('/api/tests')
</script>
