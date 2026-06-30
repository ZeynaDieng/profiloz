<script setup lang="ts">
import type { TemplateSlug } from '@profiloz/shared'
import { TEMPLATE_SLUGS } from '@profiloz/shared'
import { MSG } from '@profiloz/shared'
import type { ResumeSnapshot } from '@profiloz/shared'

const titles: Record<string, { title: string; subtitle: string; type: 'CV' }> = {
  cv: {
    title: 'Importer votre CV',
    subtitle: 'Téléversez votre CV existant pour préremplir votre profil.',
    type: 'CV',
  },
}

const route = useRoute()
const kind = computed(() => (route.path.includes('cv') ? 'cv' : 'cv'))

const meta = computed(() => titles[kind.value]!)
const { state, progress, extractedData, errorMessage, processFile, reset } = useImportFlow(meta.value.type)
const resumeStore = useResumeStore()

definePageMeta({ layout: 'wizard' })

const { ensureSession } = useGuestSession()
onMounted(() => {
  void ensureSession()
  if (route.path.includes('diplome') || route.path.includes('attestation')) {
    navigateTo('/creer/importer/cv', { replace: true })
  }
})

function onConfirm(data: Partial<ResumeSnapshot>) {
  resumeStore.mergeImportedData(data, { documentType: meta.value.type })
  const template = typeof route.query.template === 'string' ? route.query.template.toUpperCase() : ''
  if (TEMPLATE_SLUGS.includes(template as TemplateSlug)) {
    resumeStore.setTemplate(template as TemplateSlug)
    navigateTo(`/creer/modele?select=${template}&flow=import`)
    return
  }
  navigateTo('/creer/assistant/informations?fresh=1')
}

function onReset() {
  reset()
}
</script>

<template>
  <div class="max-w-4xl mx-auto page-container pb-28">
    <header class="mb-stack-lg">
      <h1 class="text-2xl sm:text-3xl font-bold text-on-surface">{{ meta.title }}</h1>
      <p class="text-on-surface-variant mt-1">{{ meta.subtitle }}</p>
    </header>

    <FeatureImportFileDropZone
      v-if="state === 'idle'"
      accept=".pdf,.docx,.jpg,.jpeg,.png"
      @select="processFile"
    />

    <FeatureImportExtractionProgress v-else-if="state === 'processing'" :progress="progress" />

    <div v-else-if="state === 'error'" class="max-w-md mx-auto py-stack-xl space-y-4">
      <UiMessageBanner variant="error" :message="errorMessage" />
      <UiButton variant="secondary" block @click="onReset">{{ MSG.confirm.retry }}</UiButton>
    </div>

    <FeatureImportReview
      v-else
      :data="extractedData"
      @confirm="onConfirm"
      @cancel="onReset"
    />
  </div>
</template>
