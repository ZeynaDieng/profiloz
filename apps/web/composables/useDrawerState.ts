export function useDrawerState() {
  const drawerOpen = useState('appDrawerOpen', () => false)

  function openDrawer() {
    drawerOpen.value = true
  }

  function closeDrawer() {
    drawerOpen.value = false
  }

  function toggleDrawer() {
    drawerOpen.value = !drawerOpen.value
  }

  return { drawerOpen, openDrawer, closeDrawer, toggleDrawer }
}
