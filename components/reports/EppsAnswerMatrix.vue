<template>
  <div class="space-y-4">
    <div class="overflow-x-auto flex justify-center">
      <div class="grid grid-cols-3 w-max">
        <div
          v-for="block in blocks"
          :key="block.block"
          class="border overflow-hidden w-56 shrink-0 -ml-px -mt-px"
        >
          <div class="px-3 py-2 border-b bg-muted/40">
            <p class="text-xs font-medium">Blok {{ block.block }}</p>
          </div>
          <div class="p-2">
            <table class="w-full border-collapse table-fixed text-center text-xs">
              <thead>
                <tr>
                  <th class="p-1 w-10" />
                  <th
                    v-for="col in block.colLabels"
                    :key="col"
                    class="p-1 font-semibold text-muted-foreground"
                  >
                    {{ col }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, ri) in block.cells" :key="ri">
                  <th class="p-1 font-semibold text-muted-foreground text-left">
                    {{ block.rowLabels[ri] }}
                  </th>
                  <td
                    v-for="(cell, ci) in row"
                    :key="ci"
                    class="p-0.5"
                  >
                    <div
                      class="mx-auto flex size-7 items-center justify-center rounded border font-semibold tabular-nums"
                      :class="cellClass(cell)"
                      :title="`Soal ${cell.q}`"
                    >
                      {{ cell.choice || '·' }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <p class="text-[11px] text-muted-foreground">
      Sel diagonal (blok 1, 5, 9) adalah item konsistensi — tidak dihitung ke BB/BJ.
      A = baris, B = kolom.
    </p>
  </div>
</template>

<script setup>
defineProps({
  blocks: { type: Array, required: true },
})

function cellClass(cell) {
  if (cell.diagonal) {
    return cell.choice
      ? 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400'
      : 'border-dashed border-muted-foreground/30 text-muted-foreground/50'
  }
  if (cell.choice === 'A') return 'border-primary/40 bg-primary/10 text-primary'
  if (cell.choice === 'B') return 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400'
  return 'border-muted text-muted-foreground/40'
}
</script>
