export interface TypewriterSegment {
  text: string
  class?: string
}

interface FlatSegment extends TypewriterSegment {
  start: number
  end: number
}

export type TypewriterLoopMode = 'none' | 'full' | 'tail' | 'accent'

export function useTypewriter(
  segments: MaybeRef<TypewriterSegment[]>,
  options: {
    active?: MaybeRef<boolean>
    speed?: number
    eraseSpeed?: number
    delay?: number
    pauseTyped?: number
    pauseEmpty?: number
    loop?: MaybeRef<boolean>
    loopMode?: TypewriterLoopMode
  } = {},
) {
  const speed = options.speed ?? 92
  const eraseSpeed = options.eraseSpeed ?? 48
  const delay = options.delay ?? 220
  const pauseTyped = options.pauseTyped ?? 3400
  const pauseEmpty = options.pauseEmpty ?? 1100
  const loopMode = options.loopMode ?? 'full'

  const visibleCount = ref(0)
  const isComplete = ref(false)
  const isAnimating = ref(false)

  function prefersReducedMotion() {
    return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  const flatMeta = computed<FlatSegment[]>(() => {
    const segs = toValue(segments)
    let pos = 0
    return segs.map((segment) => {
      const start = pos
      pos += segment.text.length
      return { ...segment, start, end: pos }
    })
  })

  const totalLength = computed(() => {
    const meta = flatMeta.value
    return meta.length ? meta[meta.length - 1]!.end : 0
  })

  const loopStart = computed(() => {
    const meta = flatMeta.value
    if (meta.length === 0) return 0

    if (loopMode === 'accent') {
      for (let i = meta.length - 1; i >= 0; i -= 1) {
        if (meta[i]!.class?.includes('text-secondary')) {
          return meta[i]!.start
        }
      }
    }

    if (loopMode === 'tail') {
      return meta[meta.length - 1]!.start
    }

    return 0
  })

  const fullText = computed(() => toValue(segments).map((segment) => segment.text).join(''))

  function charAt(index: number) {
    return fullText.value[index] ?? ''
  }

  function stepDelay(index: number, mode: 'type' | 'erase') {
    const char = charAt(index)
    const base = mode === 'type' ? speed : eraseSpeed
    let ms = base

    if (mode === 'type') {
      if (/[.!?]/.test(char)) ms += 240
      else if (/[,;:]/.test(char)) ms += 100
      else if (char === ' ') ms += 40
      else if (char === "'") ms += 60
      ms += Math.random() * 32
    } else {
      ms += Math.random() * 20
    }

    return Math.round(ms)
  }

  function visibleSlice(segment: FlatSegment) {
    const count = visibleCount.value
    if (count <= segment.start) return ''
    if (count >= segment.end) return segment.text
    return segment.text.slice(0, count - segment.start)
  }

  let runId = 0
  let timers: ReturnType<typeof setTimeout>[] = []

  function clearTimers() {
    timers.forEach(clearTimeout)
    timers = []
  }

  function schedule(fn: () => void, ms: number) {
    timers.push(setTimeout(fn, ms))
  }

  function shouldLoop() {
    return toValue(options.loop ?? false) && loopMode !== 'none'
  }

  function eraseTarget() {
    if (loopMode === 'full' || flatMeta.value.length <= 1) {
      return 0
    }
    return loopStart.value
  }

  function runTyping(id: number, from: number, to: number, isFirstCycle: boolean) {
    if (id !== runId) return

    isAnimating.value = true
    visibleCount.value = from

    if (to <= from) {
      onTyped(id, isFirstCycle)
      return
    }

    let step = from
    const tick = () => {
      if (id !== runId) return
      step += 1
      visibleCount.value = step
      if (step >= to) {
        onTyped(id, isFirstCycle)
        return
      }
      schedule(tick, stepDelay(step - 1, 'type'))
    }

    schedule(tick, from === 0 ? delay : stepDelay(from, 'type'))
  }

  function onTyped(id: number, isFirstCycle: boolean) {
    if (id !== runId) return

    if (isFirstCycle) {
      isComplete.value = true
    }

    if (!shouldLoop()) {
      isAnimating.value = false
      return
    }

    schedule(() => runErasing(id, isFirstCycle), pauseTyped)
  }

  function runErasing(id: number, _isFirstCycle: boolean) {
    if (id !== runId) return

    const target = eraseTarget()
    if (visibleCount.value <= target) {
      schedule(() => runTyping(id, target, totalLength.value, false), pauseEmpty)
      return
    }

    const tick = () => {
      if (id !== runId) return
      const removedIndex = visibleCount.value - 1
      visibleCount.value -= 1
      if (visibleCount.value <= target) {
        schedule(() => runTyping(id, target, totalLength.value, false), pauseEmpty)
        return
      }
      schedule(tick, stepDelay(Math.max(removedIndex, 0), 'erase'))
    }

    schedule(tick, stepDelay(Math.max(visibleCount.value - 1, 0), 'erase'))
  }

  function start() {
    runId += 1
    clearTimers()
    const id = runId

    if (!import.meta.client || prefersReducedMotion()) {
      visibleCount.value = totalLength.value
      isComplete.value = true
      isAnimating.value = false
      return
    }

    isComplete.value = false
    isAnimating.value = true
    runTyping(id, 0, totalLength.value, true)
  }

  function stop() {
    runId += 1
    clearTimers()
    isAnimating.value = false
  }

  watch(
    [() => toValue(options.active ?? true), () => totalLength.value],
    ([active]) => {
      if (active) start()
      else stop()
    },
    { immediate: true },
  )

  onUnmounted(stop)

  const showCursor = computed(
    () =>
      import.meta.client
      && !prefersReducedMotion()
      && toValue(options.active ?? true)
      && (isAnimating.value || shouldLoop()),
  )

  return {
    flatMeta,
    visibleSlice,
    visibleCount,
    isComplete,
    isAnimating,
    showCursor,
    fullText,
  }
}
