<script setup lang="ts">
const titles: Record<string, { title: string; subtitle: string; type: 'CV' | 'DIPLOMA' | 'CERTIFICATE' }> = {
  cv: {
    title: 'Importer votre CV',
    subtitle: 'Téléversez votre CV existant pour préremplir votre profil.',
    type: 'CV',
  },
  diplome: {
    title: 'Importer un diplôme',
    subtitle: 'Ajoutez une formation à partir de votre diplôme.',
    type: 'DIPLOMA',
  },
  attestation: {
    title: 'Importer une attestation',
    subtitle: 'Ajoutez une certification ou attestation professionnelle.',
    type: 'CERTIFICATE',
  },
}

const route = useRoute()
const kind = computed(() => {
  if (route.path.includes('diplome')) return 'diplome'
  if (route.path.includes('attestation')) return 'attestation'
  return 'cv'
})

const meta = computed(() => titles[kind.value]!)
const { state, progress, extractedData, errorMessage, processFile, reset } = useImportFlow(meta.value.type)
const resumeStore = useResumeStore()

definePageMeta({ layout: 'wizard' })
useGuestSession()
resumeStore.initDraft()

function onConfirm() {
  resumeStore.mergeImportedData(extractedData.value)
  navigateTo('/creer/modele')
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
      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      @select="processFile"
    />

    <FeatureImportExtractionProgress v-else-if="state === 'processing'" :progress="progress" />

    <div v-else-if="state === 'error'" class="text-center py-stack-xl">
      <p class="text-error mb-4">{{ errorMessage }}</p>
      <button type="button" class="px-6 py-2.5 bg-secondary text-white rounded-lg font-bold" @click="onReset">
        Réessayer
      </button>
    </div>

    <div v-else class="space-y-stack-lg">
      <FeatureImportExtractedPreview :data="extractedData" />
      <div class="flex justify-end gap-4 border-t border-outline-variant pt-stack-md">
        <button type="button" class="px-6 py-2.5 text-on-surface-variant hover:bg-surface-container-low rounded-lg" @click="onReset">
          Annuler
        </button>
        <button type="button" class="px-8 py-2.5 bg-secondary text-white rounded-lg font-bold" @click="onConfirm">
          Confirmer et choisir un modèle
        </button>
      </div>
    </div>
  </div>
</template>
