export function useAnimatedCounter(
  end: number,
  options?: { duration?: number; suffix?: string; prefix?: string },
) {
  const { duration = 1600, suffix = '', prefix = '' } = options ?? {}
  const current = ref(0)
  const hasAnimated = ref(false)
  const { target, revealed } = useScrollReveal(0.25)
  const { scaledDuration } = useMotionPrefs()

  watch(revealed, (visible) => {
    if (!visible || !import.meta.client || hasAnimated.value) return
    hasAnimated.value = true

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.value = end
      return
    }

    const runDuration = scaledDuration(duration)
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / runDuration, 1)
      const eased = 1 - (1 - progress) ** 3
      current.value = Math.round(end * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  })

  const display = computed(() => `${prefix}${current.value.toLocaleString('fr-FR')}${suffix}`)

  return { target, display, revealed }
}
