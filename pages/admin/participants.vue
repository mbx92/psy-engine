<template>
  <div class="space-y-4 md:space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Participants</h1>
        <p class="text-sm md:text-base text-muted-foreground">Manage test participants</p>
      </div>
      <UiButton v-if="can('participants:create')" class="shrink-0">
        <Icon icon="lucide:plus" class="size-4 md:mr-2" />
        <span class="hidden md:inline">Add Participant</span>
      </UiButton>
    </div>

    <UiResponsiveTable
      :columns="columns"
      :data="participants"
      item-key="id"
      empty-message="No participants yet."
    >
      <template #cell-name="{ row }">
        <span class="font-medium">{{ row.name }}</span>
      </template>
      <template #cell-gender="{ row }">
        <span class="capitalize">{{ row.gender || '—' }}</span>
      </template>
      <template #cell-birth_date="{ row }">
        <span v-if="row.birth_date">{{ $dayjs(row.birth_date).format('DD MMM YYYY') }}</span>
        <span v-else class="text-muted-foreground">—</span>
      </template>
      <template #cell-email="{ row }">
        <span class="text-muted-foreground">{{ row.email || '—' }}</span>
      </template>
      <template #cell-actions="{ row }">
        <UiButton variant="ghost" size="sm" class="text-xs">
          <Icon icon="lucide:eye" class="size-3.5 md:mr-1" />
          <span class="hidden md:inline">View</span>
        </UiButton>
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
  { key: 'gender', label: 'Gender', headClass: 'hidden sm:table-cell' },
  { key: 'birth_date', label: 'Birth Date', headClass: 'hidden md:table-cell' },
  { key: 'email', label: 'Email', headClass: 'hidden lg:table-cell', showOnMobile: false },
  { key: 'actions', label: '', headClass: 'w-20', mobileLabel: '' },
]

const { data: participants } = await useFetch('/api/participants')
</script>
