<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { useMediaQuery } from '@vueuse/core'

const props = defineProps<{
  resume: ResumeSnapshot
}>()

const isMobilePreview = useMediaQuery('(max-width: 1023px)')
const { zoom, setZoom, zoomIn, zoomOut, scaleStyle, previewWrapperStyle, containerRef, ZOOM_LEVELS } =
  useEditorZoom({ initial: 75, autoFit: isMobilePreview })
</script>

<template>
  <div class="flex flex-col h-full bg-[#F1F5F9]">
    <div class="flex items-center justify-between gap-2 px-margin-mobile md:px-4 py-2 bg-surface border-b border-outline-variant shrink-0">
      <span class="text-sm font-medium text-on-surface shrink-0">Aperçu A4</span>

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
