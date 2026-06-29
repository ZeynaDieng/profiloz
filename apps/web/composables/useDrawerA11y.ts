/** Évite l'avertissement aria-hidden quand vaul masque #__nuxt alors que le trigger garde le focus. */
export function useDrawerA11y(
  open: Ref<boolean>,
  closeButtonRef: Ref<HTMLElement | null | undefined>,
  triggerRef?: Ref<HTMLElement | null | undefined>,
) {
  function clearRootAriaHidden() {
    if (!import.meta.client) return
    const root = document.getElementById('__nuxt')
    root?.removeAttribute('aria-hidden')
    root?.removeAttribute('data-aria-hidden')
  }

  function focusCloseButton() {
    if (!import.meta.client) return
    requestAnimationFrame(() => {
      closeButtonRef.value?.focus({ preventScroll: true })
    })
  }

  watch(open, async (isOpen) => {
    if (!import.meta.client) return

    if (isOpen) {
      triggerRef?.value?.blur()
      await nextTick()
      focusCloseButton()
      return
    }

    await nextTick()
    clearRootAriaHidden()
    triggerRef?.value?.focus({ preventScroll: true })
  })

  onMounted(() => {
    if (!open.value) clearRootAriaHidden()
  })
}
