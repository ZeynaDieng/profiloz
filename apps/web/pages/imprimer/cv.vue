<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { MSG } from '@profiloz/shared'
import { resolvePrintRenderApiBase } from '~/utils/print-render-api'

definePageMeta({ layout: false })

const route = useRoute()
const config = useRuntimeConfig()
const renderId = computed(() => {
  const value = route.query.renderId
  return typeof value === 'string' ? value : ''
})

const { data: resume, error: fetchError } = await useAsyncData(
  () => `cv-print-${renderId.value}`,
  async () => {
    const id = renderId.value
    if (!id || !/^[a-f0-9-]{36}$/i.test(id)) {
      throw new Error('Invalid render id')
    }
    const apiBase = resolvePrintRenderApiBase({
      apiInternalBaseUrl: config.apiInternalBaseUrl,
      publicApiBaseUrl: config.public.apiBaseUrl,
    })
    return $fetch<ResumeSnapshot>(`${apiBase}/pdf/render-data/${id}`, {
      timeout: 20_000,
      retry: 1,
    })
  },
  { watch: [renderId] },
)

onMounted(() => {
  if (import.meta.client) {
    const applySinglePageClass = async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready.catch(() => {})
      }
      const el = document.querySelector('.resume-a4') as HTMLElement | null
      if (el) {
        const expectedHeight = el.offsetWidth * (297 / 210)
        let maxBottom = 0
        const children = el.querySelectorAll('aside, main, section, div, p, li')
        children.forEach((child) => {
          const r = (child as HTMLElement).getBoundingClientRect()
          const sheetRect = el.getBoundingClientRect()
          if (r.height > 0) {
            const bottom = r.bottom - sheetRect.top
            if (bottom > maxBottom) maxBottom = bottom
          }
        })
        if (maxBottom > 0 && maxBottom <= expectedHeight + 10) {
          el.classList.add('single-page-strict')
        }
      }
    }
    nextTick(applySinglePageClass)
    setTimeout(applySinglePageClass, 150)
  }
})
</script>

<template>
  <div class="min-h-screen bg-white print:bg-white print:min-h-0">
    <div v-if="fetchError || !resume" data-cv-error="true" class="p-8 text-center text-sm text-on-surface-variant">
      {{ printErrorMessage }}
    </div>
    <div v-else data-cv-ready="true" class="flex justify-center print:block">
      <ResumePreviewA4 :resume="resume" />
    </div>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4;
    margin: 0;
  }
  html,
  body {
    margin: 0;
    padding: 0;
    background: white;
  }
  .resume-a4.single-page-strict {
    max-height: 297mm !important;
    overflow: hidden !important;
  }
}
</style>
