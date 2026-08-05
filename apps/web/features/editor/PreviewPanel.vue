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
const pageCount = ref(1)
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
      pageCount.value = 1
      return
    }

    const child = (el.firstElementChild || el) as HTMLElement
    const expectedPageHeight = el.clientWidth * (297 / 210)
    const actualHeight = Math.max(
      child.scrollHeight,
      child.offsetHeight,
      el.scrollHeight,
      el.clientHeight
    )

    const count = Math.max(1, Math.ceil((actualHeight - 15) / expectedPageHeight))
    pageCount.value = count
    isOverflowing.value = count > 1
  }, 100)
}

onMounted(() => {
  nextTick(() => {
    const el = document.querySelector('.resume-a4')
    if (el) {
      checkOverflow()
      observer = new ResizeObserver(() => checkOverflow())
      observer.observe(el)
      if (el.firstElementChild) {
        observer.observe(el.firstElementChild)
      }
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
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30 animate-pulse shrink-0"
        >
          <UiPzIcon name="warning" class="text-sm text-amber-600" />
          <span>{{ pageCount }} pages (Dépassement A4)</span>
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 shrink-0"
        >
          <UiPzIcon name="check_circle" class="text-sm text-emerald-600" />
          <span>1 page A4 (Parfait)</span>
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
      class="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-900 flex items-start gap-2.5 shrink-0 transition-all duration-300"
    >
      <UiPzIcon name="warning" class="text-amber-600 shrink-0 text-base mt-0.5" />
      <div>
        <p class="font-extrabold text-[12px]">Votre CV comporte actuellement {{ pageCount }} pages</p>
        <p class="text-amber-800/90 mt-0.5 leading-relaxed">
          Le PDF généré comportera {{ pageCount }} pages. La ligne rouge pointillée sur l'aperçu indique l'endroit exact de la coupure de la Page 1 (297 mm).
        </p>
      </div>
    </div>

    <div ref="containerRef" class="flex-1 overflow-auto p-3 md:p-stack-md">
      <div class="flex justify-center">
        <div :style="previewWrapperStyle">
          <div :style="scaleStyle" class="relative">
            <ResumePreviewA4 :resume="resume" />

            <!-- Ligne rouge de délimitation visuelle de la Page 1 (A4) -->
            <div
              v-if="isOverflowing"
              class="absolute left-0 right-0 border-b-2 border-dashed border-red-500 z-50 pointer-events-none flex items-center justify-center"
              style="top: 297mm;"
            >
              <span class="bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg transform -translate-y-1/2 tracking-wider flex items-center gap-1.5">
                <UiPzIcon name="content_cut" class="text-xs" />
                Fin de la Page 1 (297 mm) — Début Page 2
              </span>
            </div>

            <!-- Ligne de délimitation pour la Page 2 si pageCount > 2 -->
            <div
              v-if="pageCount > 2"
              class="absolute left-0 right-0 border-b-2 border-dashed border-red-500 z-50 pointer-events-none flex items-center justify-center"
              style="top: 594mm;"
            >
              <span class="bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg transform -translate-y-1/2 tracking-wider flex items-center gap-1.5">
                <UiPzIcon name="content_cut" class="text-xs" />
                Fin de la Page 2 (594 mm) — Début Page 3
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
