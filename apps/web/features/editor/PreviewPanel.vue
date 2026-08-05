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

const { setOverflow } = useResumePageOverflowState()
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
      setOverflow(1, false)
      return
    }

    const aside = el.querySelector('aside') as HTMLElement | null
    const main = el.querySelector('main') as HTMLElement | null
    const child = (el.firstElementChild || el) as HTMLElement

    // Unscaled A4 width = 210mm (~793.7px) -> expected A4 page height ~1122.5px
    const unscaledWidth = el.offsetWidth || 793.7
    const expectedPageHeight = unscaledWidth * (297 / 210)

    const asideHeight = aside ? Math.max(aside.scrollHeight, aside.offsetHeight) : 0
    const mainHeight = main ? Math.max(main.scrollHeight, main.offsetHeight) : 0
    const childHeight = child ? Math.max(child.scrollHeight, child.offsetHeight) : 0
    const elHeight = Math.max(el.scrollHeight, el.offsetHeight)

    const actualHeight = Math.max(asideHeight, mainHeight, childHeight, elHeight)

    const count = Math.max(1, Math.ceil((actualHeight - 20) / expectedPageHeight))
    pageCount.value = count
    isOverflowing.value = count > 1
    setOverflow(count, count > 1)
  }, 50)
}

onMounted(() => {
  nextTick(() => {
    const el = document.querySelector('.resume-a4')
    if (el) {
      checkOverflow()
      observer = new ResizeObserver(() => checkOverflow())
      observer.observe(el)
      const aside = el.querySelector('aside')
      const main = el.querySelector('main')
      if (aside) observer.observe(aside)
      if (main) observer.observe(main)
      if (el.firstElementChild) observer.observe(el.firstElementChild)
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

            <!-- Séparateurs visuels de pages A4 (découpage en feuilles séparées comme Word / Google Docs) -->
            <template v-if="isOverflowing">
              <div
                v-for="pageIdx in (pageCount - 1)"
                :key="pageIdx"
                class="absolute left-[-24px] right-[-24px] z-50 pointer-events-none flex items-center justify-center"
                :style="{ top: `calc(${pageIdx * 297}mm - 14px)`, height: '28px' }"
              >
                <!-- Fond d'espacement gris séparant physiquement les 2 feuilles A4 avec ombre 3D -->
                <div class="absolute inset-0 bg-[#F1F5F9] border-y border-slate-300 shadow-[inset_0_3px_6px_rgba(0,0,0,0.08),inset_0_-3px_6px_rgba(0,0,0,0.08)]" />

                <!-- Ligne pointillée centrale d'indication de coupure -->
                <div class="absolute inset-x-0 top-1/2 border-b border-dashed border-red-500/60" />

                <!-- Badge central élégant de séparation de page -->
                <div class="relative z-10 flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold shadow-lg border border-slate-700 select-none">
                  <UiPzIcon name="content_cut" class="text-xs text-amber-400" />
                  <span>Page {{ pageIdx }} / {{ pageCount }}</span>
                  <span class="text-slate-500">•</span>
                  <span class="text-emerald-400">Page {{ pageIdx + 1 }} / {{ pageCount }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
