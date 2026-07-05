<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    count: number
    autoplay?: boolean
    active?: boolean
  }>(),
  { autoplay: true, active: true },
)

/** Vitesse de défilement (~49 px/s à 60 fps) */
const SCROLL_SPEED = 0.82
const MANUAL_SCROLL_MS = 780

const railRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
const scrollable = ref(false)
const loopWidth = ref(0)
const isPointerOver = ref(false)

let rafId: number | null = null
let resizeObserver: ResizeObserver | undefined
let isManualAnimating = false

function shouldRunContinuous() {
  if (!import.meta.client) return false
  if (!props.autoplay || !props.active || !scrollable.value || props.count <= 1) return false
  if (loopWidth.value <= 0) return false
  if (isPointerOver.value) return false
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function checkScrollable() {
  const el = railRef.value
  if (!el) return
  scrollable.value = el.scrollWidth > el.clientWidth + 4
}

function wrapScrollPosition() {
  const el = railRef.value
  if (!el || loopWidth.value <= 0) return

  while (el.scrollLeft >= loopWidth.value) {
    el.scrollLeft -= loopWidth.value
  }
  while (el.scrollLeft < 0) {
    el.scrollLeft += loopWidth.value
  }
}

function syncFromScroll() {
  const el = railRef.value
  if (!el || !el.children.length) return

  wrapScrollPosition()

  const scrollCenter = el.scrollLeft + el.clientWidth / 2
  let closest = 0
  let minDist = Infinity

  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i] as HTMLElement
    const childCenter = child.offsetLeft + child.offsetWidth / 2
    const dist = Math.abs(scrollCenter - childCenter)
    if (dist < minDist) {
      minDist = dist
      closest = i
    }
  }

  activeIndex.value = closest % props.count
}

function clearClones() {
  railRef.value?.querySelectorAll('[data-rail-clone]').forEach((node) => node.remove())
}

function setupInfiniteLoop() {
  const el = railRef.value
  if (!el) return

  clearClones()

  const originals = Array.from(el.children).filter(
    (node) => !(node as HTMLElement).hasAttribute('data-rail-clone'),
  ) as HTMLElement[]

  if (originals.length === 0) {
    loopWidth.value = 0
    return
  }

  for (const item of originals) {
    const clone = item.cloneNode(true) as HTMLElement
    clone.setAttribute('data-rail-clone', 'true')
    clone.setAttribute('aria-hidden', 'true')
    clone.setAttribute('inert', '')
    clone.querySelectorAll('a, button').forEach((node) => {
      node.setAttribute('tabindex', '-1')
    })
    el.appendChild(clone)
  }

  loopWidth.value = el.scrollWidth / 2
  wrapScrollPosition()
  syncFromScroll()
}

function stopContinuousScroll() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function continuousStep() {
  if (!shouldRunContinuous()) {
    rafId = null
    return
  }

  const el = railRef.value
  if (!el) {
    rafId = null
    return
  }

  if (!isManualAnimating) {
    el.scrollLeft += SCROLL_SPEED
    wrapScrollPosition()
    syncFromScroll()
  }

  rafId = requestAnimationFrame(continuousStep)
}

function startContinuousScroll() {
  stopContinuousScroll()
  if (!shouldRunContinuous()) return
  rafId = requestAnimationFrame(continuousStep)
}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - ((-2 * t + 2) ** 4) / 2
}

function getScrollTarget(index: number): number {
  const el = railRef.value
  if (!el) return 0
  const child = el.children[index] as HTMLElement | undefined
  if (!child) return 0
  return child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2
}

function animateScrollTo(index: number): Promise<void> {
  return new Promise((resolve) => {
    const el = railRef.value
    if (!el) {
      resolve()
      return
    }

    const clamped = ((index % props.count) + props.count) % props.count
    let target = getScrollTarget(clamped)
    const start = el.scrollLeft
    let distance = target - start

    if (Math.abs(distance) > loopWidth.value / 2 && loopWidth.value > 0) {
      distance += distance > 0 ? -loopWidth.value : loopWidth.value
    }

    if (Math.abs(distance) < 2) {
      activeIndex.value = clamped
      resolve()
      return
    }

    isManualAnimating = true
    el.classList.add('is-animating')

    const duration = MANUAL_SCROLL_MS
    const startTime = performance.now()
    let frameId: number

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      el.scrollLeft = start + distance * easeInOutQuart(progress)

      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      } else {
        wrapScrollPosition()
        syncFromScroll()
        isManualAnimating = false
        el.classList.remove('is-animating')
        resolve()
      }
    }

    frameId = requestAnimationFrame(tick)
  })
}

function scrollTo(index: number) {
  void animateScrollTo(index)
}

function scrollPrev() {
  void animateScrollTo(activeIndex.value - 1)
}

function scrollNext() {
  void animateScrollTo(activeIndex.value + 1)
}

function onScroll() {
  syncFromScroll()
}

function onVisibilityChange() {
  if (document.hidden) stopContinuousScroll()
  else startContinuousScroll()
}

function onPointerEnter() {
  isPointerOver.value = true
  stopContinuousScroll()
}

function onPointerLeave() {
  isPointerOver.value = false
  startContinuousScroll()
}

function reset() {
  stopContinuousScroll()
  activeIndex.value = 0
  if (railRef.value) railRef.value.scrollLeft = 0
  nextTick(() => {
    setupInfiniteLoop()
    checkScrollable()
    startContinuousScroll()
  })
}

defineExpose({ reset })

watch(
  () => props.count,
  () => nextTick(setupInfiniteLoop),
)

watch(scrollable, () => {
  nextTick(() => {
    setupInfiniteLoop()
    startContinuousScroll()
  })
})

watch(
  () => props.active,
  (isActive) => {
    if (isActive) startContinuousScroll()
    else stopContinuousScroll()
  },
)

watch(
  () => props.autoplay,
  () => {
    if (props.autoplay) startContinuousScroll()
    else stopContinuousScroll()
  },
)

onMounted(() => {
  if (!import.meta.client) return

  nextTick(() => {
    checkScrollable()
    setupInfiniteLoop()
    startContinuousScroll()
  })

  resizeObserver = new ResizeObserver(() => {
    setupInfiniteLoop()
    checkScrollable()
    startContinuousScroll()
  })
  if (railRef.value) resizeObserver.observe(railRef.value)

  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  stopContinuousScroll()
  clearClones()
  resizeObserver?.disconnect()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <div
    class="template-rail-wrap"
    @mouseenter="onPointerEnter"
    @mouseleave="onPointerLeave"
  >
    <button
      v-if="scrollable"
      type="button"
      class="template-rail-nav template-rail-nav--prev"
      aria-label="Modèle précédent"
      @click="scrollPrev"
    >
      <UiPzIcon name="chevron_left" class="text-[22px]" />
    </button>

    <div
      ref="railRef"
      class="template-rail"
      @scroll.passive="onScroll"
    >
      <slot />
    </div>

    <button
      v-if="scrollable"
      type="button"
      class="template-rail-nav template-rail-nav--next"
      aria-label="Modèle suivant"
      @click="scrollNext"
    >
      <UiPzIcon name="chevron_right" class="text-[22px]" />
    </button>

    <div v-if="scrollable && count > 1" class="template-rail-dots" role="tablist" aria-label="Position dans le carrousel">
      <button
        v-for="i in count"
        :key="i"
        type="button"
        role="tab"
        class="template-rail-dot"
        :class="{ 'is-active': activeIndex === i - 1 }"
        :aria-label="`Modèle ${i}`"
        :aria-selected="activeIndex === i - 1"
        @click="scrollTo(i - 1)"
      />
    </div>
  </div>
</template>

<style scoped>
.template-rail-wrap {
  position: relative;
}

.template-rail {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: none;
  scroll-behavior: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0.5rem 0 0.75rem;
  margin-inline: -0.25rem;
  padding-inline: 0.25rem;
  scrollbar-width: none;
}

.template-rail.is-animating {
  scroll-snap-type: none;
}

:deep([data-rail-clone]) {
  pointer-events: none;
  user-select: none;
}

@media (min-width: 640px) {
  .template-rail {
    gap: 1.5rem;
    padding-bottom: 1rem;
  }
}

@media (min-width: 768px) {
  .template-rail {
    gap: 2rem;
    padding-inline: 2.75rem;
    margin-inline: 0;
  }
}

.template-rail::-webkit-scrollbar {
  display: none;
}

.template-rail-nav {
  display: none;
  position: absolute;
  top: 42%;
  z-index: 3;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-surface-container-lowest) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-outline-variant) 40%, transparent);
  color: var(--color-on-surface);
  box-shadow: var(--shadow-elevated-sm, 0 4px 16px rgba(11, 28, 48, 0.08));
  transition:
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.25s ease;
}

@media (min-width: 768px) {
  .template-rail-nav {
    display: inline-flex;
  }
}

.template-rail-nav:hover {
  transform: scale(1.06);
  box-shadow: var(--shadow-elevated-md, 0 6px 20px rgba(11, 28, 48, 0.12));
}

.template-rail-nav--prev {
  left: 0;
}

.template-rail-nav--next {
  right: 0;
}

.template-rail-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.25rem;
  max-width: 100%;
}

.template-rail-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-outline-variant) 70%, transparent);
  transition:
    width 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    background-color 0.3s ease;
}

.template-rail-dot.is-active {
  width: 1.25rem;
  background: var(--color-secondary);
}

@media (prefers-reduced-motion: reduce) {
  .template-rail-nav,
  .template-rail-dot {
    transition: none;
  }
}
</style>
