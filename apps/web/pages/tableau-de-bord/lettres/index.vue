<script setup lang="ts">
import { MSG } from '@profiloz/shared'
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
    error.value = MSG.error.loadLetters
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-container">
    <header class="flex flex-col gap-4 mb-stack-lg">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-on-surface">Lettres de motivation</h1>
        <p class="text-on-surface-variant mt-1 text-sm sm:text-base">Rédigez et personnalisez vos lettres avec nos modèles.</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-2">
        <NuxtLink to="/tableau-de-bord/modeles-lettres" class="flex-1 sm:flex-initial">
          <UiButton variant="outline" block class="sm:!w-auto">Modèles</UiButton>
        </NuxtLink>
        <NuxtLink to="/tableau-de-bord/lettres/nouvelle" class="flex-1 sm:flex-initial">
          <UiButton variant="primary" block icon="add" class="sm:!w-auto">Nouvelle lettre</UiButton>
        </NuxtLink>
      </div>
    </header>

    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
      <UiSkeleton v-for="i in 4" :key="i" variant="card" />
    </div>
    <UiMessageBanner v-else-if="error" variant="error" :message="error" class="mb-4" />

    <UiCard v-else-if="letters.length === 0" variant="glass" padding="lg" class="max-w-xl">
      <h2 class="font-bold text-on-surface mb-2">{{ MSG.empty.noLetter }}</h2>
      <p class="text-on-surface-variant mb-4 text-sm sm:text-base">
        Choisissez un modèle et créez votre première lettre de motivation en quelques minutes.
      </p>
      <div class="flex flex-col sm:flex-row gap-3">
        <NuxtLink to="/tableau-de-bord/modeles-lettres">
          <UiButton variant="outline" block class="sm:!w-auto">Voir les modèles</UiButton>
        </NuxtLink>
        <NuxtLink to="/tableau-de-bord/lettres/nouvelle">
          <UiButton variant="secondary" block class="sm:!w-auto">Créer une lettre</UiButton>
        </NuxtLink>
      </div>
    </UiCard>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-gutter">
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
