<template>
  <div class="space-y-4 md:space-y-6">
    <!-- CFIT -->
    <template v-if="view?.kind === 'cfit'">
      <UiCard>
        <UiCardHeader>
          <UiCardTitle class="text-base">CFIT IQ Result</UiCardTitle>
          <UiCardDescription v-if="view.ageGroup">
            Norma usia: {{ view.ageGroup }}
            <span v-if="birthDate"> · lahir {{ formatDate(birthDate) }}</span>
          </UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="text-center space-y-2">
          <p class="text-4xl md:text-5xl font-bold tabular-nums">{{ view.iqScore ?? '—' }}</p>
          <p class="text-base font-semibold text-primary">{{ view.classification }}</p>
          <p v-if="view.classificationDescription" class="text-xs text-muted-foreground max-w-md mx-auto">
            {{ view.classificationDescription }}
          </p>
          <p class="text-sm text-muted-foreground">
            Raw score {{ view.rawScore ?? '—' }} / {{ view.maxRawScore }}
          </p>
        </UiCardContent>
      </UiCard>

      <UiCard v-if="chartDimensions.length">
        <UiCardHeader><UiCardTitle class="text-sm">Skor Subtes</UiCardTitle></UiCardHeader>
        <UiCardContent>
          <ClientOnly><ReportsBarChart :dimensions="chartDimensions" /></ClientOnly>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader><UiCardTitle class="text-sm">Rincian Subtes</UiCardTitle></UiCardHeader>
        <UiCardContent class="p-0">
          <UiTable>
            <UiTableHeader>
              <UiTableRow>
                <UiTableHead>Subtest</UiTableHead>
                <UiTableHead class="text-right">Benar</UiTableHead>
              </UiTableRow>
            </UiTableHeader>
            <UiTableBody>
              <UiTableRow v-for="st in view.subtests" :key="st.key">
                <UiTableCell class="font-medium">{{ st.label }}</UiTableCell>
                <UiTableCell class="text-right tabular-nums">
                  {{ st.value }}<span v-if="st.max" class="text-muted-foreground"> / {{ st.max }}</span>
                </UiTableCell>
              </UiTableRow>
            </UiTableBody>
          </UiTable>
        </UiCardContent>
      </UiCard>
    </template>

    <!-- EPPS -->
    <template v-else-if="view?.kind === 'epps'">
      <UiCard>
        <UiCardHeader>
          <UiCardTitle class="text-base">EPPS — Profil 15 Kebutuhan</UiCardTitle>
          <UiCardDescription>
            Skor S (BD + BH) per kebutuhan · norma {{ participantGender === 'L' ? 'laki-laki' : 'perempuan' }}
          </UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="space-y-4">
          <div
            v-if="view.consistency"
            class="rounded-lg border p-3 text-sm grid grid-cols-2 md:grid-cols-4 gap-3"
            :class="view.consistency.valid ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5'"
          >
            <div>
              <p class="text-xs text-muted-foreground">Raw total</p>
              <p class="font-bold tabular-nums">{{ view.consistency.rawTotal ?? '—' }} / 225</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Dijawab</p>
              <p class="font-bold tabular-nums">{{ view.consistency.answered ?? '—' }} / 225</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">BD (total)</p>
              <p class="font-bold tabular-nums">{{ formatNum(view.consistency.BD) }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">BH (total)</p>
              <p class="font-bold tabular-nums">{{ formatNum(view.consistency.BH) }}</p>
            </div>
          </div>

          <div class="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10">
            <div v-if="chartDimensions.length" class="flex-1 w-full max-w-[320px] shrink-0 mx-auto lg:mx-0">
              <ClientOnly><ReportsRadarChart :dimensions="chartDimensions" /></ClientOnly>
            </div>

            <div class="flex flex-col gap-4 w-full lg:w-[320px] shrink-0">
              <div class="rounded-lg border p-3 bg-muted/20">
                <p class="text-xs font-medium text-muted-foreground mb-2">Top 5 kebutuhan</p>
                <ul class="space-y-1 text-sm">
                  <li v-for="key in view.top5" :key="key" class="flex justify-between gap-4">
                    <span>{{ needCode(key) }} <span class="text-muted-foreground">· {{ needLabel(key) }}</span></span>
                    <span class="font-bold tabular-nums">{{ needScore(key) }}</span>
                  </li>
                </ul>
              </div>
              <div class="rounded-lg border p-3 bg-muted/20">
                <p class="text-xs font-medium text-muted-foreground mb-2">Low 5 kebutuhan</p>
                <ul class="space-y-1 text-sm">
                  <li v-for="key in view.low5" :key="key" class="flex justify-between gap-4">
                    <span>{{ needCode(key) }} <span class="text-muted-foreground">· {{ needLabel(key) }}</span></span>
                    <span class="font-bold tabular-nums">{{ needScore(key) }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </UiCardContent>
      </UiCard>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <UiCard v-if="view.answerBlocks?.length" class="min-w-0 lg:col-span-6">
          <UiCardHeader>
            <UiCardTitle class="text-sm">Matrix Jawaban 5×5</UiCardTitle>
            <UiCardDescription>9 blok jawaban EPPS (layout sistem lama)</UiCardDescription>
          </UiCardHeader>
          <UiCardContent>
            <ReportsEppsAnswerMatrix :blocks="view.answerBlocks" />
          </UiCardContent>
        </UiCard>

        <UiCard class="min-w-0" :class="view.answerBlocks?.length ? 'lg:col-span-6' : 'lg:col-span-12'">
          <UiCardHeader><UiCardTitle class="text-sm">Matrix EPPS — Rincian Skor</UiCardTitle></UiCardHeader>
          <UiCardContent class="p-0 overflow-x-auto">
          <UiTable>
            <UiTableHeader>
              <UiTableRow>
                <UiTableHead>Kebutuhan</UiTableHead>
                <UiTableHead class="text-right">BB</UiTableHead>
                <UiTableHead class="text-right">BJ</UiTableHead>
                <UiTableHead class="text-right">BD</UiTableHead>
                <UiTableHead class="text-right">BH</UiTableHead>
                <UiTableHead class="text-right">S</UiTableHead>
                <UiTableHead>Kategori</UiTableHead>
              </UiTableRow>
            </UiTableHeader>
            <UiTableBody>
              <UiTableRow v-for="n in view.needs" :key="n.key">
                <UiTableCell>
                  <p class="font-medium">{{ n.code || n.key.toUpperCase() }}</p>
                  <p class="text-[11px] text-muted-foreground">{{ n.label }}</p>
                  <p v-if="n.description" class="text-[11px] text-muted-foreground/80 line-clamp-2">{{ n.description }}</p>
                </UiTableCell>
                <UiTableCell class="text-right tabular-nums">{{ n.bb }}</UiTableCell>
                <UiTableCell class="text-right tabular-nums">{{ n.bj }}</UiTableCell>
                <UiTableCell class="text-right tabular-nums">{{ formatNum(n.bd) }}</UiTableCell>
                <UiTableCell class="text-right tabular-nums">{{ formatNum(n.bh) }}</UiTableCell>
                <UiTableCell class="text-right font-bold tabular-nums">{{ formatNum(n.s) }}</UiTableCell>
                <UiTableCell>
                  <span :class="interpretationClass(n.category)">{{ n.category }}</span>
                  <p v-if="n.interpretationDescription" class="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
                    {{ n.interpretationDescription }}
                  </p>
                </UiTableCell>
              </UiTableRow>
            </UiTableBody>
          </UiTable>
        </UiCardContent>
      </UiCard>
      </div>
    </template>

    <!-- PAPI -->
    <template v-else-if="view?.kind === 'papi'">
      <UiCard v-if="chartDimensions.length">
        <UiCardHeader><UiCardTitle class="text-sm">Profil Skala PAPI</UiCardTitle></UiCardHeader>
        <UiCardContent>
          <ClientOnly><ReportsRadarChart :dimensions="chartDimensions" /></ClientOnly>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader><UiCardTitle class="text-sm">Rincian Skala</UiCardTitle></UiCardHeader>
        <UiCardContent class="p-0 overflow-x-auto">
          <UiTable>
            <UiTableHeader>
              <UiTableRow>
                <UiTableHead>Skala</UiTableHead>
                <UiTableHead class="text-right">Skor</UiTableHead>
                <UiTableHead>Interpretasi</UiTableHead>
              </UiTableRow>
            </UiTableHeader>
            <UiTableBody>
              <UiTableRow v-for="d in view.dimensions" :key="d.key">
                <UiTableCell>
                  <p class="font-medium">{{ d.label }}</p>
                  <p v-if="d.name && d.name !== d.label" class="text-xs text-muted-foreground">{{ d.name }}</p>
                  <p v-if="d.description" class="text-xs text-muted-foreground/80">{{ d.description }}</p>
                </UiTableCell>
                <UiTableCell class="text-right font-bold tabular-nums">{{ d.value }} / {{ d.max || 9 }}</UiTableCell>
                <UiTableCell>
                  <span :class="interpretationClass(d.interpretationLabel)">{{ d.interpretationLabel || '—' }}</span>
                  <p v-if="d.interpretationDescription" class="text-xs text-muted-foreground mt-0.5">{{ d.interpretationDescription }}</p>
                </UiTableCell>
              </UiTableRow>
            </UiTableBody>
          </UiTable>
        </UiCardContent>
      </UiCard>
    </template>

    <!-- Generic fallback -->
    <template v-else-if="view?.dimensions?.length">
      <UiCard v-if="chartDimensions.length">
        <UiCardHeader><UiCardTitle class="text-sm">Grafik Skor</UiCardTitle></UiCardHeader>
        <UiCardContent>
          <ClientOnly>
            <ReportsRadarChart v-if="chartDimensions.length >= 3" :dimensions="chartDimensions" />
            <ReportsBarChart v-else :dimensions="chartDimensions" />
          </ClientOnly>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader><UiCardTitle class="text-sm">Rincian Skor</UiCardTitle></UiCardHeader>
        <UiCardContent class="space-y-3">
          <div v-for="d in view.dimensions" :key="d.key" class="flex items-center justify-between py-2 border-b last:border-0">
            <div>
              <p class="text-sm font-medium">{{ d.label }}</p>
              <p v-if="d.interpretationDescription" class="text-xs text-muted-foreground">{{ d.interpretationDescription }}</p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold tabular-nums">{{ d.value }}</p>
              <p v-if="d.interpretationLabel" class="text-xs" :class="interpretationClass(d.interpretationLabel)">{{ d.interpretationLabel }}</p>
            </div>
          </div>
        </UiCardContent>
      </UiCard>
    </template>
  </div>
</template>

<script setup>
import { buildScoreView, chartDimensionsFromView, interpretationClass } from '~~/utils/scoreDisplay'

const props = defineProps({
  session: { type: Object, required: true },
})

const view = computed(() => buildScoreView(props.session))
const chartDimensions = computed(() => chartDimensionsFromView(view.value))
const birthDate = computed(() => props.session?.participant?.birthDate)
const participantGender = computed(() => view.value?.participantGender || props.session?.participant?.gender)

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatNum(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return Number.isInteger(n) ? n : n.toFixed(1)
}

function needLabel(key) {
  return view.value?.needs?.find((n) => n.key === key)?.label || key
}

function needCode(key) {
  const n = view.value?.needs?.find((x) => x.key === key)
  return n?.code || String(key).toUpperCase()
}

function needScore(key) {
  const n = view.value?.needs?.find((x) => x.key === key)
  return n ? formatNum(n.s) : '—'
}
</script>
