export function useDrawerState() {
  const drawerOpen = useState('appDrawerOpen', () => false)
  const drawerTriggerRef = useState<HTMLElement | null>('appDrawerTrigger', () => null)

  function openDrawer(trigger?: HTMLElement | null) {
    if (trigger) drawerTriggerRef.value = trigger
    trigger?.blur()
    drawerOpen.value = true
  }

  function closeDrawer() {
    drawerOpen.value = false
  }

  function toggleDrawer(trigger?: HTMLElement | null) {
    if (!drawerOpen.value) {
      openDrawer(trigger ?? undefined)
    } else {
      closeDrawer()
    }
  }

  return { drawerOpen, drawerTriggerRef, openDrawer, closeDrawer, toggleDrawer }
}
