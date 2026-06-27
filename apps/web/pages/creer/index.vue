<template>
  <div class="max-w-[640px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
    <div class="text-center mb-stack-lg">
      <h1 class="text-3xl font-bold text-on-surface mb-3">Créons votre dossier de candidature</h1>
      <p class="text-on-surface-variant">Comment souhaitez-vous commencer ?</p>
    </div>

    <div class="space-y-4">
      <NuxtLink
        to="/creer/assistant/informations"
        class="bento-card block p-stack-lg bg-surface-container-lowest rounded-2xl border border-outline-variant/30 hover:border-secondary transition-colors"
      >
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary shrink-0">
            <UiPzIcon name="edit_note" />
          </div>
          <div>
            <h2 class="font-bold text-xl text-on-surface mb-1">Partir de zéro</h2>
            <p class="text-on-surface-variant text-sm">Construisez votre dossier étape par étape, avec un assistant qui vous guide.</p>
          </div>
        </div>
      </NuxtLink>

      <div class="bento-card p-stack-lg bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
        <div class="flex items-start gap-4 mb-4">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <UiPzIcon name="upload_file" />
          </div>
          <div>
            <h2 class="font-bold text-xl text-on-surface mb-1">Importer mes documents</h2>
            <p class="text-on-surface-variant text-sm">Préremplissez votre CV ou votre lettre de motivation à partir de fichiers existants.</p>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <NuxtLink
            to="/creer/importer/cv"
            class="flex flex-col items-center gap-2 p-3 rounded-xl border border-outline-variant/30 hover:border-secondary hover:bg-secondary/5 transition-colors text-center"
          >
            <UiPzIcon name="description" class="text-secondary" />
            <span class="text-sm font-semibold text-on-surface">CV</span>
          </NuxtLink>
          <NuxtLink
            to="/creer/importer/lettre"
            class="flex flex-col items-center gap-2 p-3 rounded-xl border border-outline-variant/30 hover:border-secondary hover:bg-secondary/5 transition-colors text-center"
          >
            <UiPzIcon name="mail" class="text-secondary" />
            <span class="text-sm font-semibold text-on-surface">Lettre de motivation</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'wizard' })

useGuestSession()
const resumeStore = useResumeStore()

onMounted(() => {
  resumeStore.rehydrateFromStorage()
  if (!resumeStore.current?.personalInfo.fullName) {
    resumeStore.startNewDraft()
  }
})
</script>
