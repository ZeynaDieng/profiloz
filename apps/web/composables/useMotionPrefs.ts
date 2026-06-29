export function useMotionPrefs() {
  const prefersReducedMotion = ref(false)
  const isMobileViewport = ref(false)

  function refresh() {
    if (!import.meta.client) return
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    isMobileViewport.value = window.matchMedia('(max-width: 767px)').matches
  }

  onMounted(() => {
    refresh()
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileMq = window.matchMedia('(max-width: 767px)')
    motionMq.addEventListener('change', refresh)
    mobileMq.addEventListener('change', refresh)
    onUnmounted(() => {
      motionMq.removeEventListener('change', refresh)
      mobileMq.removeEventListener('change', refresh)
    })
  })

  function scaledDuration(baseMs: number) {
    if (prefersReducedMotion.value) return 0
    if (isMobileViewport.value) return Math.round(baseMs * 0.85)
    return baseMs
  }

  return { prefersReducedMotion, isMobileViewport, scaledDuration }
}
