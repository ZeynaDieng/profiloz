<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import type { ResumeSnapshot } from '@profiloz/shared'
import { useMediaQuery } from '@vueuse/core'

const props = defineProps<{
  resume: ResumeSnapshot
}>()

const isMobilePreview = useMediaQuery('(max-width: 1023px)')
const { zoom, setZoom, zoomIn, zoomOut, scaleStyle, previewWrapperStyle, containerRef, ZOOM_LEVELS } =
  useEditorZoom({ initial: 75, autoFit: isMobilePreview })

const isOverflowing = ref(false)
let observer: ResizeObserver | null = null
let overflowTimer: ReturnType<typeof setTimeout> | null = null

function checkOverflow() {
  if (overflowTimer) clearTimeout(overflowTimer)
  overflowTimer = setTimeout(async () => {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      try {
        await document.fonts.ready
      } catch (_) {}
    }

    const el = document.querySelector('.resume-a4') as HTMLElement | null
    if (!el) {
      isOverflowing.value = false
      return
    }

    // Ratio A4 exact: 297mm / 210mm = 1.4142857...
    const expectedHeight = el.clientWidth * (297 / 210)
    // scrollHeight donne la hauteur réelle occupée par le contenu
    const actualHeight = Math.max(el.scrollHeight, el.clientHeight)
    // Marge de tolérance de 35px pour éviter tout faux positif lié aux arrondis sous-pixels et au chargement des polices
    isOverflowing.value = actualHeight > expectedHeight + 35
  }, 100)
}

onMounted(() => {
  nextTick(() => {
    const el = document.querySelector('.resume-a4')
    if (el) {
      checkOverflow()
      observer = new ResizeObserver(() => checkOverflow())
      observer.observe(el)
    }
  })
})

onUnmounted(() => {
  if (overflowTimer) clearTimeout(overflowTimer)
  observer?.disconnect()
})

watch(
  () => [props.resume.templateSlug, props.resume.accentColor],
  () => {
    if (overflowTimer) clearTimeout(overflowTimer)
    overflowTimer = setTimeout(checkOverflow, 200)
  },
)

watch(
  () => props.resume,
  () => {
    checkOverflow()
  },
  { deep: true },
)
</script>

<template>
  <div class="flex flex-col h-full bg-[#F1F5F9]">
    <div class="flex items-center justify-between gap-2 px-margin-mobile md:px-4 py-2 bg-surface border-b border-outline-variant shrink-0">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-sm font-medium text-on-surface shrink-0">Aperçu A4</span>
        <span
          v-if="isOverflowing"
          class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/25 animate-pulse shrink-0"
        >
          ⚠️ Dépasse 1 page
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 shrink-0"
        >
          ✅ Tient sur 1 page
        </span>
      </div>

      <p v-if="isMobilePreview" class="text-xs text-on-surface-variant truncate">
        Ajusté à l'écran · {{ zoom }}%
      </p>

      <div v-else class="flex items-center gap-1 min-w-0">
        <button
          type="button"
          class="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant"
          aria-label="Zoom arrière"
          @click="zoomOut"
        >
          <UiPzIcon name="remove" class="text-[18px]" />
        </button>
        <div class="hidden sm:flex gap-0.5">
          <button
            v-for="level in ZOOM_LEVELS"
            :key="level"
            type="button"
            class="min-h-11 px-2 text-xs rounded-md transition-colors"
            :class="zoom === level ? 'bg-secondary text-white font-bold' : 'text-on-surface-variant hover:bg-surface-container'"
            @click="setZoom(level)"
          >
            {{ level }}%
          </button>
        </div>
        <button
          type="button"
          class="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant"
          aria-label="Zoom avant"
          @click="zoomIn"
        >
          <UiPzIcon name="add" class="text-[18px]" />
        </button>
      </div>
    </div>

    <!-- Bannière d'avertissement de dépassement -->
    <div
      v-if="isOverflowing"
      class="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-800 flex items-start gap-2.5 shrink-0 transition-all duration-300"
    >
      <UiPzIcon name="warning" class="text-amber-600 shrink-0 text-base mt-0.5" />
      <div>
        <p class="font-extrabold text-[12px]">Votre CV dépasse sur une deuxième page</p>
        <p class="text-amber-700/90 mt-0.5 leading-relaxed">
          Le PDF généré comportera 2 pages. Si vous préférez un format compact sur 1 page, essayez de raccourcir vos descriptions ou de masquer des détails secondaires.
        </p>
      </div>
    </div>

    <div ref="containerRef" class="flex-1 overflow-auto p-3 md:p-stack-md">
      <div class="flex justify-center">
        <div :style="previewWrapperStyle">
          <div :style="scaleStyle">
            <ResumePreviewA4 :resume="resume" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
