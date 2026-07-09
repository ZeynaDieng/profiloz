<script setup lang="ts">
import type { CoverLetterSnapshot } from '~/types/cover-letter'
import { useResizeObserver } from '@vueuse/core'
import { letterPreviewWrapperStyle } from '~/utils/template-accent-colors'

const props = defineProps<{ letter: CoverLetterSnapshot }>()

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

const previewStyle = computed(() =>
  letterPreviewWrapperStyle(props.letter.templateSlug, props.letter.accentColor),
)
</script>

<template>
  <div ref="containerRef" class="w-full h-full relative overflow-hidden preview-canvas-bg--landing" :style="previewStyle">
    <div
      class="absolute top-0 left-1/2 pointer-events-none letter-a4-preview-fit"
      :style="{
        transform: `translateX(-50%) scale(${scale})`,
        transformOrigin: 'top center',
      }"
    >
      <CoverLetterPreviewA4 :letter="letter" />
    </div>
  </div>
</template>

<style scoped>
.letter-a4-preview-fit :deep(.letter-a4) {
  box-shadow: none;
  margin: 0;
}
</style>
