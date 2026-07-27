<template>
  <svg :viewBox="`0 0 ${size} ${size}`" class="w-full h-auto max-w-md mx-auto" role="img">
    <!-- grid rings -->
    <polygon
      v-for="ring in rings"
      :key="ring"
      :points="ringPoints(ring)"
      fill="none"
      stroke="currentColor"
      class="text-border"
      stroke-width="1"
    />
    <!-- axes -->
    <line
      v-for="(d, i) in dimensions"
      :key="'axis-' + i"
      :x1="center" :y1="center"
      :x2="axisPoint(i).x" :y2="axisPoint(i).y"
      stroke="currentColor"
      class="text-border"
      stroke-width="1"
    />
    <!-- data polygon -->
    <polygon
      :points="dataPoints"
      fill="currentColor"
      class="text-primary/20"
      stroke="currentColor"
      stroke-width="2"
      :stroke-linejoin="'round'"
    />
    <g class="text-primary">
      <circle
        v-for="(d, i) in dimensions"
        :key="'dot-' + i"
        :cx="valuePoint(i).x" :cy="valuePoint(i).y"
        r="3"
        fill="currentColor"
      />
    </g>
    <!-- labels -->
    <text
      v-for="(d, i) in dimensions"
      :key="'label-' + i"
      :x="labelPoint(i).x" :y="labelPoint(i).y"
      text-anchor="middle"
      dominant-baseline="middle"
      class="fill-foreground"
      font-size="11"
    >
      {{ d.label }}
    </text>
    <text
      v-for="(d, i) in dimensions"
      :key="'value-' + i"
      :x="valuePoint(i).x" :y="valuePoint(i).y - 8"
      text-anchor="middle"
      class="fill-primary font-semibold"
      font-size="10"
    >
      {{ d.value }}
    </text>
  </svg>
</template>

<script setup>
const props = defineProps({
  dimensions: { type: Array, required: true }, // [{ label, value, max }]
  size: { type: Number, default: 320 },
})

const size = props.size
const center = size / 2
const radius = size / 2 - 40
const rings = [0.25, 0.5, 0.75, 1]

function angleFor(i) {
  const step = (2 * Math.PI) / props.dimensions.length
  return step * i - Math.PI / 2
}

function ringPoints(ringFraction) {
  return props.dimensions
    .map((_, i) => {
      const angle = angleFor(i)
      const x = center + radius * ringFraction * Math.cos(angle)
      const y = center + radius * ringFraction * Math.sin(angle)
      return `${x},${y}`
    })
    .join(' ')
}

function axisPoint(i) {
  const angle = angleFor(i)
  return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) }
}

function labelPoint(i) {
  const angle = angleFor(i)
  const r = radius + 22
  return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }
}

function valuePoint(i) {
  const d = props.dimensions[i]
  const max = d.max || 100
  const fraction = max > 0 ? Math.min(Math.max(d.value / max, 0), 1) : 0
  const angle = angleFor(i)
  return { x: center + radius * fraction * Math.cos(angle), y: center + radius * fraction * Math.sin(angle) }
}

const dataPoints = computed(() =>
  props.dimensions.map((_, i) => { const p = valuePoint(i); return `${p.x},${p.y}` }).join(' '),
)
</script>
