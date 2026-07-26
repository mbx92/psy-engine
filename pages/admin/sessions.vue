<template>
  <div class="space-y-4 md:space-y-6">
    <div>
      <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Sessions</h1>
      <p class="text-sm md:text-base text-muted-foreground">Monitor ongoing and completed test sessions</p>
    </div>

    <!-- Tabs: Active / Completed -->
    <UiTabs default-value="active" class="w-full">
      <UiTabsList class="w-full sm:w-auto">
        <UiTabsTrigger value="active" class="flex-1 sm:flex-none text-sm">Active</UiTabsTrigger>
        <UiTabsTrigger value="completed" class="flex-1 sm:flex-none text-sm">Completed</UiTabsTrigger>
      </UiTabsList>

      <UiTabsContent value="active" class="mt-4">
        <UiResponsiveTable
          :columns="activeColumns"
          :data="activeSessions"
          item-key="id"
          empty-message="No active sessions."
        >
          <template #cell-test="{ row }">
            <span class="font-medium">{{ row.test?.name || row.test_name }}</span>
          </template>
          <template #cell-participant="{ row }">
            <span>{{ row.participant?.name || row.participant_name }}</span>
          </template>
          <template #cell-status="{ row }">
            <UiBadge variant="secondary" class="text-xs">{{ row.status }}</UiBadge>
          </template>
          <template #cell-started="{ row }">
            <span class="text-muted-foreground text-xs">
              {{ row.started_at ? $dayjs(row.started_at).format('DD MMM HH:mm') : '—' }}
            </span>
          </template>
          <template #cell-actions="{ row }">
            <UiButton v-if="can('sessions:manage')" variant="ghost" size="sm" class="text-xs">
              <Icon icon="lucide:play" class="size-3.5 md:mr-1" />
              <span class="hidden md:inline">Resume</span>
            </UiButton>
          </template>
        </UiResponsiveTable>
      </UiTabsContent>

      <UiTabsContent value="completed" class="mt-4">
        <UiResponsiveTable
          :columns="completedColumns"
          :data="completedSessions"
          item-key="id"
          empty-message="No completed sessions."
        >
          <template #cell-test="{ row }">
            <span class="font-medium">{{ row.test?.name || row.test_name }}</span>
          </template>
          <template #cell-participant="{ row }">
            <span>{{ row.participant?.name || row.participant_name }}</span>
          </template>
          <template #cell-score="{ row }">
            <span class="font-medium">{{ row.score ?? '—' }}</span>
          </template>
          <template #cell-completed="{ row }">
            <span class="text-muted-foreground text-xs">
              {{ row.completed_at ? $dayjs(row.completed_at).format('DD MMM HH:mm') : '—' }}
            </span>
          </template>
          <template #cell-actions="{ row }">
            <UiButton variant="ghost" size="sm" class="text-xs">
              <Icon icon="lucide:file-text" class="size-3.5 md:mr-1" />
              <span class="hidden md:inline">Report</span>
            </UiButton>
          </template>
        </UiResponsiveTable>
      </UiTabsContent>
    </UiTabs>
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '@/components/ui/responsive-table'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { can } = useAuth()

const activeColumns: ColumnDef[] = [
  { key: 'test', label: 'Test' },
  { key: 'participant', label: 'Participant' },
  { key: 'status', label: 'Status', headClass: 'hidden sm:table-cell' },
  { key: 'started', label: 'Started', headClass: 'hidden md:table-cell' },
  { key: 'actions', label: '', headClass: 'w-20', mobileLabel: '' },
]

const completedColumns: ColumnDef[] = [
  { key: 'test', label: 'Test' },
  { key: 'participant', label: 'Participant' },
  { key: 'score', label: 'Score', headClass: 'hidden sm:table-cell' },
  { key: 'completed', label: 'Completed', headClass: 'hidden md:table-cell' },
  { key: 'actions', label: '', headClass: 'w-20', mobileLabel: '' },
]

const { data: activeSessions } = await useFetch('/api/sessions?status=active')
const { data: completedSessions } = await useFetch('/api/sessions?status=completed')
</script>
