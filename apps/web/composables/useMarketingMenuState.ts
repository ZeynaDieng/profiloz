export function useMarketingMenuState() {
  const open = useState('marketingMenuOpen', () => false)

  function openMenu() {
    open.value = true
  }

  function closeMenu() {
    open.value = false
  }

  function toggleMenu() {
    open.value = !open.value
  }

  return { open, openMenu, closeMenu, toggleMenu }
}
