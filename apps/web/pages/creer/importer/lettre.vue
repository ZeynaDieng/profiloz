<script setup lang="ts">
import { saveCoverLetterImportDraft } from '~/utils/cover-letter-import-draft'

definePageMeta({ layout: 'wizard' })

const authStore = useAuthStore()
const { state, progress, extractedData, errorMessage, processFile, reset } = useCoverLetterImportFlow()

const { ensureSession } = useGuestSession()
onMounted(() => {
  void ensureSession()
})

function onConfirm() {
  saveCoverLetterImportDraft(extractedData.value)
  authStore.loadFromStorage()

  const redirect = '/tableau-de-bord/lettres/nouvelle?from=import'
  if (authStore.isAuthenticated) {
    navigateTo(redirect)
    return
  }

  navigateTo(`/connexion?redirect=${encodeURIComponent(redirect)}`)
}

function onReset() {
  reset()
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg pb-28">
    <NuxtLink to="/creer" class="text-sm text-secondary font-semibold hover:underline mb-4 inline-block">
      ← Retour
    </NuxtLink>

    <div class="mb-stack-lg">
      <h1 class="text-2xl font-bold text-on-surface">Importer votre lettre de motivation</h1>
      <p class="text-on-surface-variant">
        Téléversez une lettre existante pour préremplir le texte et vos coordonnées.
      </p>
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

    <div v-else class="space-y-stack-lg">
      <FeatureImportCoverLetterExtractedPreview :data="extractedData" />
      <div class="flex justify-end gap-4 border-t border-outline-variant pt-stack-md">
        <button
          type="button"
          class="px-6 py-2.5 text-on-surface-variant hover:bg-surface-container-low rounded-lg"
          @click="onReset"
        >
          Annuler
        </button>
        <button type="button" class="px-8 py-2.5 bg-secondary text-white rounded-lg font-bold" @click="onConfirm">
          Confirmer et personnaliser
        </button>
      </div>
    </div>
  </div>
</template>
