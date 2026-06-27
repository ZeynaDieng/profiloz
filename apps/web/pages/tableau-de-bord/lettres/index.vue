<script setup lang="ts">
import type { CoverLetter } from '~/services/cover-letter.service'

definePageMeta({ layout: 'dashboard' })

const authStore = useAuthStore()
const coverLetterService = useCoverLetterService()

const letters = ref<CoverLetter[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) {
    await navigateTo('/connexion')
    return
  }

  try {
    const result = await coverLetterService.list()
    letters.value = result.data
  } catch {
    error.value = 'Impossible de charger vos lettres.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="p-margin-mobile md:p-margin-desktop">
    <div class="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end mb-stack-lg">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-on-surface">Lettres de motivation</h1>
        <p class="text-on-surface-variant">Rédigez et personnalisez vos lettres avec nos modèles.</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <NuxtLink
          to="/tableau-de-bord/modeles-lettres"
          class="px-5 py-2.5 rounded-lg border border-outline-variant font-bold text-center text-on-surface hover:border-secondary min-h-11 flex items-center justify-center"
        >
          Modèles
        </NuxtLink>
        <NuxtLink
          to="/tableau-de-bord/lettres/nouvelle"
          class="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 min-h-11"
        >
          <UiPzIcon name="add" class="text-[18px]" />
          Nouvelle lettre
        </NuxtLink>
      </div>
    </div>

    <p v-if="loading" class="text-on-surface-variant">Chargement...</p>
    <p v-else-if="error" class="text-error">{{ error }}</p>

    <div v-else-if="letters.length === 0" class="max-w-xl glass-card rounded-xl p-stack-lg border border-outline-variant">
      <h2 class="font-bold text-on-surface mb-2">Aucune lettre pour le moment</h2>
      <p class="text-on-surface-variant mb-4">
        Choisissez un modèle et créez votre première lettre de motivation en quelques minutes.
      </p>
      <div class="flex flex-wrap gap-4">
        <NuxtLink to="/tableau-de-bord/modeles-lettres" class="text-secondary font-bold hover:underline">
          Voir les modèles
        </NuxtLink>
        <NuxtLink to="/tableau-de-bord/lettres/nouvelle" class="text-secondary font-bold hover:underline">
          Créer une lettre
        </NuxtLink>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
      <DashboardCoverLetterCard
        v-for="letter in letters"
        :key="letter.id"
        :id="letter.id"
        :title="letter.title"
        :company-name="letter.companyName"
        :position="letter.position"
        :template-id="letter.templateId"
        :updated-at="letter.updatedAt"
      />
    </div>
  </div>
</template>
