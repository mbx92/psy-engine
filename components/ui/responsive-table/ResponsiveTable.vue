<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

export interface ColumnDef {
  key: string
  label: string
  /** Responsive hidden classes for desktop table cells, e.g. 'hidden sm:table-cell' */
  headClass?: HTMLAttributes['class']
  cellClass?: HTMLAttributes['class']
  /** Show this column on mobile card view? Default true */
  showOnMobile?: boolean
  /** Format value for mobile display */
  mobileLabel?: string
}

const props = withDefaults(defineProps<{
  columns: ColumnDef[]
  data: Record<string, any>[] | null
  itemKey?: string
  emptyMessage?: string
  class?: HTMLAttributes['class']
}>(), {
  itemKey: 'id',
  emptyMessage: 'No data',
})

const items = computed(() => props.data ?? [])

const emits = defineEmits<{
  (e: 'select', row: Record<string, any>): void
}>()
</script>

<template>
  <div :class="cn('', props.class)">
    <!-- Mobile: Stacked Cards (hidden on md+) -->
    <div class="grid gap-3 md:hidden">
      <div
        v-for="row in items"
        :key="row[itemKey]"
        class="rounded-lg border bg-card p-4 space-y-3"
        @click="emits('select', row)"
      >
        <div
          v-for="col in columns"
          :key="col.key"
          v-show="col.showOnMobile !== false"
          class="flex items-start justify-between gap-3"
        >
          <span class="text-xs text-muted-foreground shrink-0">
            {{ col.mobileLabel || col.label }}
          </span>
          <div class="text-sm text-right font-medium flex-1 min-w-0">
            <slot :name="`cell-${col.key}`" :row="row" :column="col">
              {{ row[col.key] }}
            </slot>
          </div>
        </div>
      </div>

      <!-- Empty state on mobile -->
      <div
        v-if="!items.length"
        class="text-center text-muted-foreground py-8 text-sm border rounded-lg"
      >
        <slot name="empty">
          {{ emptyMessage }}
        </slot>
      </div>
    </div>

    <!-- Desktop: Regular Table (visible on md+) -->
    <UiCard class="hidden md:block">
      <div class="overflow-x-auto">
        <UiCardContent class="p-0">
          <UiTable>
            <UiTableHeader>
              <UiTableRow>
                <UiTableHead
                  v-for="col in columns"
                  :key="col.key"
                  :class="col.headClass"
                >
                  {{ col.label }}
                </UiTableHead>
              </UiTableRow>
            </UiTableHeader>
            <UiTableBody>
              <UiTableRow
                v-for="row in items"
                :key="row[itemKey]"
                @click="emits('select', row)"
              >
                <UiTableCell
                  v-for="col in columns"
                  :key="col.key"
                  :class="col.cellClass"
                >
                  <slot :name="`cell-${col.key}`" :row="row" :column="col">
                    {{ row[col.key] }}
                  </slot>
                </UiTableCell>
              </UiTableRow>

              <!-- Empty state on desktop -->
              <UiTableRow v-if="!items.length">
                <UiTableCell
                  :colspan="columns.length"
                  class="text-center text-muted-foreground py-8 text-sm"
                >
                  <slot name="empty">
                    {{ emptyMessage }}
                  </slot>
                </UiTableCell>
              </UiTableRow>
            </UiTableBody>
          </UiTable>
        </UiCardContent>
      </div>
    </UiCard>
  </div>
</template>
