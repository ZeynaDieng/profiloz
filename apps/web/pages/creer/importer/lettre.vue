<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import { saveCoverLetterImportDraft } from '~/utils/cover-letter-import-draft'

definePageMeta({ layout: 'wizard' })

const { state, progress, extractedData, errorMessage, processFile, reset } = useCoverLetterImportFlow()
const { ensureSession } = useGuestSession()

onMounted(() => {
  void ensureSession()
})

function onConfirm() {
  saveCoverLetterImportDraft(extractedData.value)

  navigateTo('/creer/lettre/editeur?from=import')
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

    <div v-else-if="state === 'error'" class="max-w-md mx-auto py-stack-xl space-y-4">
      <UiMessageBanner variant="error" :message="errorMessage" />
      <UiButton variant="secondary" block @click="onReset">{{ MSG.confirm.retry }}</UiButton>
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
          {{ MSG.buttons.continue }}
        </button>
      </div>
    </div>
  </div>
</template>
