<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'

/**
 * Feuille A4 réduite à une largeur donnée (prop `width`) ou à la largeur de son conteneur.
 * La boîte occupe la taille réelle de la feuille réduite : un conteneur qui défile suit le zoom.
 */
const props = defineProps<{ width?: number }>()

const MM_TO_PX = 96 / 25.4
const A4_WIDTH_PX = 210 * MM_TO_PX
const A4_HEIGHT_PX = 297 * MM_TO_PX

const rootRef = ref<HTMLElement | null>(null)
const measuredWidth = ref(0)

useResizeObserver(rootRef, (entries) => {
  measuredWidth.value = entries[0]?.contentRect.width ?? 0
})

const sheetWidth = computed(() => props.width ?? measuredWidth.value)
const scale = computed(() => (sheetWidth.value > 0 ? sheetWidth.value / A4_WIDTH_PX : 0))
</script>

<template>
  <div
    ref="rootRef"
    class="relative overflow-hidden bg-white"
    :style="{
      width: width ? `${width}px` : '100%',
      height: `${A4_HEIGHT_PX * scale}px`,
    }"
  >
    <div
      class="a4-sheet pointer-events-none absolute left-0 top-0 origin-top-left"
      :style="{ width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px`, transform: `scale(${scale})` }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.a4-sheet :deep(.resume-a4),
.a4-sheet :deep(.letter-a4) {
  margin: 0;
  box-shadow: none;
}
</style>
