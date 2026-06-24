import { useResizeObserver } from '@vueuse/core'

export const ZOOM_LEVELS = [50, 75, 100, 125] as const

const MM_TO_PX = 96 / 25.4
export const A4_WIDTH_PX = 210 * MM_TO_PX
export const A4_HEIGHT_PX = 297 * MM_TO_PX

export function useEditorZoom(options?: { initial?: number; autoFit?: Ref<boolean> }) {
  const containerRef = ref<HTMLElement | null>(null)
  const manualZoom = ref(options?.initial ?? 75)
  const fitZoom = ref(75)
  const autoFit = options?.autoFit ?? ref(false)

  function updateFitZoom() {
    const el = containerRef.value
    if (!el) return
    const available = el.clientWidth - 16
    if (available <= 0) return
    fitZoom.value = Math.min(100, Math.max(35, Math.round((available / A4_WIDTH_PX) * 100)))
  }

  onMounted(() => nextTick(updateFitZoom))
  useResizeObserver(containerRef, () => nextTick(updateFitZoom))

  const zoom = computed(() => (autoFit.value ? fitZoom.value : manualZoom.value))

  function setZoom(value: number) {
    manualZoom.value = Math.min(150, Math.max(40, value))
  }

  function zoomIn() {
    const idx = ZOOM_LEVELS.findIndex((z) => z >= manualZoom.value)
    const next = ZOOM_LEVELS[Math.min(idx + 1, ZOOM_LEVELS.length - 1)]
    if (next) setZoom(next)
  }

  function zoomOut() {
    const idx = ZOOM_LEVELS.findIndex((z) => z >= manualZoom.value)
    const prev = ZOOM_LEVELS[Math.max(idx - 1, 0)]
    if (prev) setZoom(prev)
  }

  const previewWrapperStyle = computed(() => {
    const scale = zoom.value / 100
    return {
      width: `${A4_WIDTH_PX * scale}px`,
      height: `${A4_HEIGHT_PX * scale}px`,
    }
  })

  const scaleStyle = computed(() => ({
    width: `${A4_WIDTH_PX}px`,
    transform: `scale(${zoom.value / 100})`,
    transformOrigin: 'top left',
  }))

  return {
    zoom,
    fitZoom,
    manualZoom,
    setZoom,
    zoomIn,
    zoomOut,
    scaleStyle,
    previewWrapperStyle,
    containerRef,
    ZOOM_LEVELS,
  }
}
