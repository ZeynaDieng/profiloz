export function useMarketingMenuState() {
  const open = useState('marketingMenuOpen', () => false)
  const menuTriggerRef = useState<HTMLElement | null>('marketingMenuTrigger', () => null)

  function openMenu(trigger?: HTMLElement | null) {
    if (trigger) menuTriggerRef.value = trigger
    trigger?.blur()
    open.value = true
  }

  function closeMenu() {
    open.value = false
  }

  function toggleMenu() {
    open.value = !open.value
  }

  return { open, menuTriggerRef, openMenu, closeMenu, toggleMenu }
}
