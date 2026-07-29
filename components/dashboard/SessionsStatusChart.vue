<template>
  <div class="flex flex-col sm:flex-row items-center gap-6 py-2">
    <div class="relative shrink-0 size-40">
      <svg viewBox="0 0 120 120" class="size-full -rotate-90" role="img" :aria-label="ariaLabel">
        <circle
          cx="60"
          cy="60"
          :r="radius"
          fill="none"
          stroke="currentColor"
          class="text-muted"
          :stroke-width="strokeWidth"
        />
        <circle
          v-for="seg in segments"
          :key="seg.key"
          cx="60"
          cy="60"
          :r="radius"
          fill="none"
          :stroke="seg.color"
          :stroke-width="strokeWidth"
          stroke-linecap="butt"
          :stroke-dasharray="seg.dashArray"
          :stroke-dashoffset="seg.dashOffset"
          class="transition-all duration-500"
        >
          <title>{{ seg.label }}: {{ seg.value }}</title>
        </circle>
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-2xl font-bold tabular-nums leading-none">{{ total }}</span>
        <span class="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">sessions</span>
      </div>
    </div>

    <ul class="w-full space-y-2.5">
      <li
        v-for="seg in segments"
        :key="seg.key"
        class="flex items-center justify-between gap-3 text-sm"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <span
            class="size-2.5 rounded-full shrink-0"
            :style="{ backgroundColor: seg.color }"
          />
          <span class="truncate text-muted-foreground">{{ seg.label }}</span>
        </div>
        <div class="flex items-center gap-2 shrink-0 tabular-nums">
          <span class="font-semibold">{{ seg.value }}</span>
          <span class="text-xs text-muted-foreground w-8 text-right">{{ seg.pct }}%</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true,
    // [{ key, label, value }]
  },
})

const STATUS_COLORS = {
  pending: 'hsl(220 13% 68%)',
  in_progress: 'hsl(222 88% 51%)',
  completed: 'hsl(158 72% 38%)',
  verified: 'hsl(271 91% 65%)',
  abandoned: 'hsl(11 100% 59%)',
}

const radius = 42
const strokeWidth = 16
const circumference = 2 * Math.PI * radius

const total = computed(() => props.items.reduce((sum, i) => sum + i.value, 0))

const segments = computed(() => {
  let offset = 0
  return props.items.map((item) => {
    const value = item.value
    const fraction = total.value > 0 ? value / total.value : 0
    const length = fraction * circumference
    const gap = props.items.length > 1 && value > 0 ? 2 : 0
    const seg = {
      key: item.key,
      label: item.label,
      value,
      pct: total.value > 0 ? Math.round(fraction * 100) : 0,
      color: STATUS_COLORS[item.key] || 'hsl(220 13% 68%)',
      dashArray: `${Math.max(length - gap, 0)} ${circumference}`,
      dashOffset: -offset,
    }
    offset += length
    return seg
  })
})

const ariaLabel = computed(() =>
  props.items.map((i) => `${i.label}: ${i.value}`).join(', '),
)
</script>
