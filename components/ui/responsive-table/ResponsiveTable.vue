<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, required: true, default: null },
  itemKey: { type: String, required: false, default: 'id' },
  emptyMessage: { type: String, required: false, default: 'No data' },
  class: { type: null, required: false },
})

const items = computed(() => props.data ?? [])

const emits = defineEmits(['select'])
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
