<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import type { CoverLetterSnapshot } from '~/types/cover-letter'
import { toCoverLetterSnapshot } from '~/types/cover-letter'
import { resolvePrintRenderApiBase } from '~/utils/print-render-api'

definePageMeta({ layout: false })

const route = useRoute()
const config = useRuntimeConfig()
const renderId = computed(() => {
  const value = route.query.renderId
  return typeof value === 'string' ? value : ''
})

function renderDataApiBase(): string {
  return resolvePrintRenderApiBase({
    apiInternalBaseUrl: config.apiInternalBaseUrl,
    publicApiBaseUrl: config.public.apiBaseUrl,
  })
}

const { data: raw, error: fetchError } = await useAsyncData(
  () => `letter-print-${renderId.value}`,
  async () => {
    const id = renderId.value
    if (!id || !/^[a-f0-9-]{36}$/i.test(id)) {
      throw new Error('Invalid render id')
    }
    return $fetch<Record<string, unknown>>(`${renderDataApiBase()}/pdf/render-data/${id}`, {
      timeout: 20_000,
      retry: 1,
    })
  },
  { watch: [renderId] },
)

const letter = computed<CoverLetterSnapshot | null>(() => {
  if (!raw.value) return null
  return toCoverLetterSnapshot({
    templateId: String(raw.value.templateSlug ?? raw.value.templateId ?? 'CLASSIQUE'),
    title: raw.value.title as string | undefined,
    senderName: raw.value.senderName as string | undefined,
    senderEmail: raw.value.senderEmail as string | undefined,
    senderPhone: raw.value.senderPhone as string | undefined,
    senderLocation: raw.value.senderLocation as string | undefined,
    companyName: raw.value.companyName as string | undefined,
    companyAddress: raw.value.companyAddress as string | undefined,
    position: raw.value.position as string | undefined,
    recruiterName: raw.value.recruiterName as string | undefined,
    content: String(raw.value.content ?? ''),
    closingText: raw.value.closingText as string | undefined,
  })
})

const printErrorMessage = computed(
  () => fetchError.value?.message || MSG.error.loadPrintLetter,
)
</script>

<template>
  <div class="min-h-screen bg-white print:bg-white print:min-h-0">
    <div v-if="fetchError || !letter" data-cv-error="true" class="p-8 text-center text-sm text-on-surface-variant">
      {{ printErrorMessage }}
    </div>
    <div v-else data-cv-ready="true" class="flex justify-center print:block">
      <CoverLetterPreviewA4 :letter="letter" />
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
