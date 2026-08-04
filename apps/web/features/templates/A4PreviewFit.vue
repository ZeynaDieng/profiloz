<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { useResizeObserver } from '@vueuse/core'

defineProps<{ resume: ResumeSnapshot }>()

const containerRef = ref<HTMLElement | null>(null)
const scale = ref(0.28)

const MM_TO_PX = 96 / 25.4
const A4_WIDTH_PX = 210 * MM_TO_PX
const A4_HEIGHT_PX = 297 * MM_TO_PX

function updateScale() {
  const el = containerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const w = rect.width || el.clientWidth || 280
  const h = rect.height || el.clientHeight || 390
  if (!w || !h) return

  // Utiliser une marge de sécurité de 95% pour garantir un aperçu complet sans débordement
  const computedScale = Math.min(w / A4_WIDTH_PX, h / A4_HEIGHT_PX) * 0.95
  if (computedScale > 0) {
    scale.value = computedScale
  }
}

onMounted(() => {
  nextTick(updateScale)
  setTimeout(updateScale, 50)
  setTimeout(updateScale, 200)
  setTimeout(updateScale, 500)
  if (import.meta.client) {
    window.addEventListener('resize', updateScale)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', updateScale)
  }
})

useResizeObserver(containerRef, () => {
  requestAnimationFrame(updateScale)
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full relative overflow-hidden preview-canvas-bg flex items-center justify-center">
    <div
      class="absolute top-1/2 left-1/2 pointer-events-none a4-preview-fit"
      :style="{
        width: `${A4_WIDTH_PX}px`,
        height: `${A4_HEIGHT_PX}px`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: 'center center',
      }"
    >
      <ResumePreviewA4 :resume="resume" />
    </div>
  </div>
</template>

<style scoped>
.a4-preview-fit :deep(.resume-a4) {
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.15);
  margin: 0;
}
</style>
