<script setup lang="ts">
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
  // On passe par l'étape Informations pour que l'utilisateur vérifie/corrige
  // son identité (le nom détecté par l'OCR peut être imparfait).
  navigateTo('/creer/assistant/informations')
}

function onReset() {
  reset()
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg pb-28">
    <div class="mb-stack-lg">
      <h1 class="text-2xl font-bold text-on-surface">{{ meta.title }}</h1>
      <p class="text-on-surface-variant">{{ meta.subtitle }}</p>
    </div>

    <FeatureImportFileDropZone
      v-if="state === 'idle'"
      accept=".pdf,.docx,.jpg,.jpeg,.png"
      @select="processFile"
    />

    <FeatureImportExtractionProgress v-else-if="state === 'processing'" :progress="progress" />

    <div v-else-if="state === 'error'" class="text-center py-stack-xl">
      <p class="text-error mb-4">{{ errorMessage }}</p>
      <button type="button" class="px-6 py-2.5 bg-secondary text-white rounded-lg font-bold" @click="onReset">
        Réessayer
      </button>
    </div>

    <FeatureImportReview
      v-else
      :data="extractedData"
      @confirm="onConfirm"
      @cancel="onReset"
    />
  </div>
</template>
