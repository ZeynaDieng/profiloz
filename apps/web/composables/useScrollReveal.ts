export function useScrollReveal(threshold = 0.25) {
  const target = ref<HTMLElement | null>(null)
  const revealed = ref(false)
  let observer: IntersectionObserver | null = null

  function revealNow() {
    revealed.value = true
    observer?.disconnect()
    observer = null
  }

  function isHashTarget(el: HTMLElement) {
    const hash = window.location.hash
    return hash.length > 1 && el.id === hash.slice(1)
  }

  function isInViewport(el: HTMLElement) {
    const rect = el.getBoundingClientRect()
    const viewHeight = window.innerHeight || document.documentElement.clientHeight
    return rect.top < viewHeight - 48 && rect.bottom > 48
  }

  function bindObserver(el: HTMLElement) {
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          revealNow()
        }
      },
      { threshold, rootMargin: '0px 0px -32px 0px' },
    )

    observer.observe(el)
  }

  function syncRevealState() {
    const el = target.value
    if (!el) return

    if (isHashTarget(el) || isInViewport(el)) {
      revealNow()
      return
    }

    if (!observer) {
      bindObserver(el)
    }
  }

  onMounted(() => {
    if (!import.meta.client) {
      revealed.value = true
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealed.value = true
      return
    }

    syncRevealState()
    window.addEventListener('hashchange', syncRevealState)
  })

  onUnmounted(() => {
    observer?.disconnect()
    if (import.meta.client) {
      window.removeEventListener('hashchange', syncRevealState)
    }
  })

  return { target, revealed }
}
