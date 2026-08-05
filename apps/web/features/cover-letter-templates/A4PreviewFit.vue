<script setup lang="ts">
import type { CoverLetterSnapshot } from '~/types/cover-letter'
import { useResizeObserver } from '@vueuse/core'
import { letterPreviewWrapperStyle } from '~/utils/template-accent-colors'

const props = defineProps<{ letter?: CoverLetterSnapshot | null }>()

const containerRef = ref<HTMLElement | null>(null)
const scale = ref(0.3)
const pageCount = ref(1)
const isOverflowing = ref(false)

const MM_TO_PX = 96 / 25.4
const A4_WIDTH_PX = 210 * MM_TO_PX
const A4_HEIGHT_PX = 297 * MM_TO_PX

const { updatePageOverflow } = useCoverLetterPageOverflowState()

function updateScale() {
  const el = containerRef.value
  if (!el) return
  const { clientWidth: w, clientHeight: h } = el
  if (!w || !h) return
  // Calculer l'échelle en tenant compte de la hauteur totale du nombre de pages
  const totalTargetHeight = A4_HEIGHT_PX * pageCount.value
  scale.value = Math.min(w / A4_WIDTH_PX, (h - 20) / totalTargetHeight)
  checkOverflow()
}

function checkOverflow() {
  const container = containerRef.value
  if (!container) return
  const sheet = container.querySelector('.letter-a4') as HTMLElement | null
  if (!sheet) return

  const sheetRect = sheet.getBoundingClientRect()
  const currentScale = sheetRect.width > 0 ? sheetRect.width / A4_WIDTH_PX : scale.value

  let maxBottom = 0
  const children = sheet.querySelectorAll('*')
  children.forEach((child) => {
    const rect = child.getBoundingClientRect()
    if (rect.height > 0 && rect.width > 0) {
      const relativeBottom = (rect.bottom - sheetRect.top) / (currentScale || 1)
      if (relativeBottom > maxBottom) {
        maxBottom = relativeBottom
      }
    }
  })

  const count = Math.max(1, Math.ceil((maxBottom + 10) / A4_HEIGHT_PX))
  if (count !== pageCount.value) {
    pageCount.value = count
    sheet.style.minHeight = `${count * 297}mm`
  }
  isOverflowing.value = count > 1
  updatePageOverflow(count, count > 1)
}

onMounted(() => {
  nextTick(() => {
    updateScale()
    setTimeout(checkOverflow, 150)
  })
})

watch(() => props.letter, () => {
  nextTick(() => {
    checkOverflow()
    updateScale()
  })
}, { deep: true })

useResizeObserver(containerRef, () => {
  nextTick(() => {
    updateScale()
    checkOverflow()
  })
})

const previewStyle = computed(() =>
  letterPreviewWrapperStyle(
    props.letter?.templateSlug ?? 'CLASSIQUE',
    props.letter?.accentColor,
  ),
)
</script>

<template>
  <div ref="containerRef" class="w-full h-full relative overflow-y-auto preview-canvas-bg--landing p-4 flex flex-col items-center justify-start" :style="previewStyle">
    <!-- Badge de statut de page -->
    <div
      class="sticky top-2 z-20 mb-3 px-3 py-1 rounded-full text-xs font-bold shadow-md backdrop-blur-md transition-all flex items-center gap-1.5"
      :class="isOverflowing ? 'bg-amber-500 text-white' : 'bg-slate-900/80 text-white'"
    >
      <UiPzIcon :name="isOverflowing ? 'warning' : 'description'" class="text-sm" />
      <span>{{ isOverflowing ? `⚠️ Lettre sur ${pageCount} pages A4` : '🟢 1 page A4 (Parfait)' }}</span>
    </div>

    <!-- Conteneur A4 avec mise à l'échelle -->
    <div
      class="relative pointer-events-none letter-a4-preview-fit shadow-2xl rounded-sm transition-all"
      :style="{
        width: `${A4_WIDTH_PX}px`,
        height: `${A4_HEIGHT_PX * pageCount}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        marginBottom: `-${(1 - scale) * (A4_HEIGHT_PX * pageCount)}px`,
      }"
    >
      <CoverLetterPreviewA4 :letter="letter" />

      <!-- Lignes de séparation 3D de pages A4 si plusieurs pages -->
      <template v-if="pageCount > 1">
        <div
          v-for="pageIndex in (pageCount - 1)"
          :key="pageIndex"
          class="absolute left-0 right-0 z-30 pointer-events-none flex items-center justify-center"
          :style="{ top: `${pageIndex * 297}mm` }"
        >
          <!-- Ligne pointillée de découpe 3D -->
          <div class="w-full border-b-2 border-dashed border-red-400/80 shadow-sm relative">
            <!-- Badge central indiquant la séparation de page -->
            <div class="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-extrabold shadow-lg flex items-center gap-1">
              <span>✂️ Saut de page • Page {{ pageIndex }} / {{ pageCount }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.letter-a4-preview-fit :deep(.letter-a4) {
  margin: 0;
}
</style>
