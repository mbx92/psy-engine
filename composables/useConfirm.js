import { nextTick, reactive } from 'vue'

// Single shared piece of state driving one globally-mounted <ConfirmDialog />
// (see app/app.vue). This is a client-only interaction (always triggered from
// a click handler), so a plain module-scope reactive object is enough — no
// need for SSR-safe useState.
const state = reactive({
  open: false,
  title: '',
  description: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  variant: 'default',
  resolve: null,
})

export function useConfirmState() {
  return state
}

export function useConfirm() {
  function confirm({
    title = 'Are you sure?',
    description = '',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
  } = {}) {
    return new Promise((resolve) => {
      // If a previous confirm is still open, settle it as cancelled first.
      if (state.resolve) {
        const prev = state.resolve
        state.resolve = null
        state.open = false
        prev(false)
      }

      state.title = title
      state.description = description
      state.confirmLabel = confirmLabel
      state.cancelLabel = cancelLabel
      state.variant = variant
      state.resolve = resolve

      // Open after the triggering click finishes so Reka Dialog doesn't treat
      // that same pointer event as an outside-dismiss.
      nextTick(() => {
        state.open = true
      })
    })
  }

  return { confirm }
}
