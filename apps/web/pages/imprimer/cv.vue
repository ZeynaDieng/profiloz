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

const { data: resume, error } = await useAsyncData(
  () => `cv-print-${renderId.value}`,
  async () => {
    const id = renderId.value
    if (!id || !/^[a-f0-9-]{36}$/i.test(id)) return null
    const apiBase = resolvePrintRenderApiBase({
      apiInternalBaseUrl: config.apiInternalBaseUrl,
      publicApiBaseUrl: config.public.apiBaseUrl,
    })
    return $fetch<ResumeSnapshot>(`${apiBase}/pdf/render-data/${id}`)
  },
  { watch: [renderId] },
)
</script>

<template>
  <div class="min-h-screen bg-white print:bg-white print:min-h-0">
    <div v-if="error || !resume" data-cv-error="true" class="p-8 text-center text-sm text-on-surface-variant">
      {{ MSG.error.loadPrintCv }}
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
}
</style>
