<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { useResizeObserver } from '@vueuse/core'

defineProps<{ resume: ResumeSnapshot }>()

const containerRef = ref<HTMLElement | null>(null)
const scale = ref(0.3)

const MM_TO_PX = 96 / 25.4
const A4_WIDTH_PX = 210 * MM_TO_PX
const A4_HEIGHT_PX = 297 * MM_TO_PX

function updateScale() {
  const el = containerRef.value
  if (!el) return
  const { clientWidth: w, clientHeight: h } = el
  if (!w || !h) return
  scale.value = Math.min(w / A4_WIDTH_PX, h / A4_HEIGHT_PX)
}

onMounted(() => nextTick(updateScale))
useResizeObserver(containerRef, () => nextTick(updateScale))
</script>

<template>
  <div ref="containerRef" class="w-full h-full relative overflow-hidden bg-[#F1F5F9]">
    <div
      class="absolute top-0 left-1/2 pointer-events-none a4-preview-fit"
      :style="{
        transform: `translateX(-50%) scale(${scale})`,
        transformOrigin: 'top center',
      }"
    >
      <ResumePreviewA4 :resume="resume" />
    </div>
  </div>
</template>

<style scoped>
.a4-preview-fit :deep(.resume-a4) {
  box-shadow: none;
  margin: 0;
}

.a4-preview-fit :deep(.resume-a4 > p:last-child) {
  display: none;
}
</style>
