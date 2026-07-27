<template>
  <svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-auto" role="img">
    <g v-for="(d, i) in dimensions" :key="i">
      <text :x="0" :y="rowY(i) + barHeight / 2" dominant-baseline="middle" font-size="12" class="fill-foreground">
        {{ d.label }}
      </text>
      <rect
        :x="labelWidth" :y="rowY(i)"
        :width="trackWidth" :height="barHeight"
        rx="4"
        fill="currentColor"
        class="text-muted"
      />
      <rect
        :x="labelWidth" :y="rowY(i)"
        :width="barWidth(d)" :height="barHeight"
        rx="4"
        fill="currentColor"
        class="text-primary"
      />
      <text
        :x="labelWidth + trackWidth + 8" :y="rowY(i) + barHeight / 2"
        dominant-baseline="middle" font-size="12" font-weight="600" class="fill-foreground"
      >
        {{ d.value }}{{ d.max ? '/' + d.max : '' }}
      </text>
    </g>
  </svg>
</template>

<script setup>
const props = defineProps({
  dimensions: { type: Array, required: true }, // [{ label, value, max }]
  labelWidth: { type: Number, default: 90 },
  trackWidth: { type: Number, default: 180 },
  barHeight: { type: Number, default: 18 },
  rowGap: { type: Number, default: 10 },
})

const width = props.labelWidth + props.trackWidth + 50
const height = props.dimensions.length * (props.barHeight + props.rowGap)

function rowY(i) {
  return i * (props.barHeight + props.rowGap)
}

function barWidth(d) {
  const max = d.max || 100
  const fraction = max > 0 ? Math.min(Math.max(d.value / max, 0), 1) : 0
  return props.trackWidth * fraction
}
</script>
