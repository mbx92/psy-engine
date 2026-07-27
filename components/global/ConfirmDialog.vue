<template>
  <UiDialog :open="state.open" @update:open="onOpenChange">
    <UiDialogContent class="sm:max-w-sm">
      <UiDialogHeader>
        <UiDialogTitle>{{ state.title }}</UiDialogTitle>
        <UiDialogDescription v-if="state.description">{{ state.description }}</UiDialogDescription>
      </UiDialogHeader>
      <UiDialogFooter>
        <UiButton type="button" variant="outline" @click="respond(false)">{{ state.cancelLabel }}</UiButton>
        <UiButton
          type="button"
          :variant="state.variant === 'destructive' ? 'destructive' : 'default'"
          @click="respond(true)"
        >
          {{ state.confirmLabel }}
        </UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>

<script setup>
import { useConfirmState } from '@/composables/useConfirm'

const state = useConfirmState()

function respond(result) {
  state.open = false
  const resolve = state.resolve
  state.resolve = null
  if (resolve) resolve(result)
}

function onOpenChange(open) {
  if (!open) respond(false)
}
</script>
