<template>
  <div
    v-if="total > 0"
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2"
  >
    <p class="text-xs text-muted-foreground tabular-nums">
      Showing
      <span class="font-medium text-foreground">{{ from }}–{{ to }}</span>
      of
      <span class="font-medium text-foreground">{{ total }}</span>
    </p>

    <div class="flex items-center gap-1">
      <UiButton
        type="button"
        variant="outline"
        size="icon-sm"
        :disabled="page <= 1"
        aria-label="Previous page"
        @click="$emit('update:page', page - 1)"
      >
        <Icon icon="lucide:chevron-left" class="size-4" />
      </UiButton>

      <template v-for="(item, i) in pageItems" :key="`${item}-${i}`">
        <span v-if="item === '…'" class="px-1.5 text-xs text-muted-foreground">…</span>
        <UiButton
          v-else
          type="button"
          :variant="item === page ? 'default' : 'outline'"
          size="icon-sm"
          class="tabular-nums"
          :aria-label="`Page ${item}`"
          :aria-current="item === page ? 'page' : undefined"
          @click="$emit('update:page', item)"
        >
          {{ item }}
        </UiButton>
      </template>

      <UiButton
        type="button"
        variant="outline"
        size="icon-sm"
        :disabled="page >= totalPages"
        aria-label="Next page"
        @click="$emit('update:page', page + 1)"
      >
        <Icon icon="lucide:chevron-right" class="size-4" />
      </UiButton>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  page: { type: Number, required: true },
  limit: { type: Number, required: true },
  total: { type: Number, required: true },
})

defineEmits(['update:page'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.limit)))

const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.limit + 1))
const to = computed(() => Math.min(props.page * props.limit, props.total))

const pageItems = computed(() => {
  const total = totalPages.value
  const current = props.page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const items = new Set([1, total, current, current - 1, current + 1])
  if (current <= 3) {
    items.add(2)
    items.add(3)
    items.add(4)
  }
  if (current >= total - 2) {
    items.add(total - 1)
    items.add(total - 2)
    items.add(total - 3)
  }

  const sorted = [...items].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const result = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…')
    result.push(sorted[i])
  }
  return result
})
</script>
