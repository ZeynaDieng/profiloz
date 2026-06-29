export function useScrollReveal(threshold = 0.25) {
  const target = ref<HTMLElement | null>(null)
  const revealed = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!import.meta.client) {
      revealed.value = true
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealed.value = true
      return
    }

    const el = target.value
    if (!el) return

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          revealed.value = true
          observer?.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -32px 0px' },
    )

    observer.observe(el)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return { target, revealed }
}
