import { MSG } from '@profiloz/shared'

interface ConfirmState {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  destructive: boolean
  resolve: ((value: boolean) => void) | null
}

const state = reactive<ConfirmState>({
  open: false,
  title: MSG.confirm.title,
  message: '',
  confirmLabel: MSG.confirm.continue,
  cancelLabel: MSG.confirm.cancel,
  destructive: false,
  resolve: null,
})

export function useConfirmState() {
  return state
}

export function useConfirm() {
  function confirm(
    message: string,
    options?: {
      title?: string
      confirmLabel?: string
      cancelLabel?: string
      destructive?: boolean
    },
  ): Promise<boolean> {
    return new Promise((resolve) => {
      state.open = true
      state.title = options?.title ?? MSG.confirm.title
      state.message = message
      state.confirmLabel = options?.confirmLabel ?? MSG.confirm.continue
      state.cancelLabel = options?.cancelLabel ?? MSG.confirm.cancel
      state.destructive = options?.destructive ?? false
      state.resolve = resolve
    })
  }

  function accept() {
    state.resolve?.(true)
    close()
  }

  function reject() {
    state.resolve?.(false)
    close()
  }

  function close() {
    state.open = false
    state.resolve = null
  }

  return { confirm, accept, reject, close, state }
}
