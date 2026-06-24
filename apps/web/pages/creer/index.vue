<template>
  <div class="max-w-[640px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
    <div class="text-center mb-stack-lg">
      <h1 class="text-3xl font-bold text-on-surface mb-3">Comment souhaitez-vous commencer ?</h1>
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
            <h2 class="font-bold text-xl text-on-surface mb-1">Créer mon CV</h2>
            <p class="text-on-surface-variant text-sm">Créer un CV à partir de zéro, étape par étape.</p>
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
            <p class="text-on-surface-variant text-sm">Préremplissez votre CV à partir de fichiers existants.</p>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <NuxtLink
            to="/creer/importer/cv"
            class="flex flex-col items-center gap-2 p-3 rounded-xl border border-outline-variant/30 hover:border-secondary hover:bg-secondary/5 transition-colors text-center"
          >
            <UiPzIcon name="description" class="text-secondary" />
            <span class="text-sm font-semibold text-on-surface">CV</span>
          </NuxtLink>
          <NuxtLink
            to="/creer/importer/diplome"
            class="flex flex-col items-center gap-2 p-3 rounded-xl border border-outline-variant/30 hover:border-secondary hover:bg-secondary/5 transition-colors text-center"
          >
            <UiPzIcon name="school" class="text-secondary" />
            <span class="text-sm font-semibold text-on-surface">Diplôme</span>
          </NuxtLink>
          <NuxtLink
            to="/creer/importer/attestation"
            class="flex flex-col items-center gap-2 p-3 rounded-xl border border-outline-variant/30 hover:border-secondary hover:bg-secondary/5 transition-colors text-center"
          >
            <UiPzIcon name="verified" class="text-secondary" />
            <span class="text-sm font-semibold text-on-surface">Attestation</span>
          </NuxtLink>
          <NuxtLink
            to="/creer/importer/attestation"
            class="flex flex-col items-center gap-2 p-3 rounded-xl border border-outline-variant/30 hover:border-secondary hover:bg-secondary/5 transition-colors text-center"
          >
            <UiPzIcon name="workspace_premium" class="text-secondary" />
            <span class="text-sm font-semibold text-on-surface">Certificat</span>
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

const hasDraft = computed(() =>
  Boolean(resumeStore.current?.personalInfo.fullName),
)

onMounted(() => {
  if (!hasDraft.value) {
    resumeStore.startNewDraft()
  }
})
</script>
