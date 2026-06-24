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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="p-margin-mobile md:p-margin-desktop">
    <div class="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end mb-stack-lg">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-on-surface">Lettres de motivation</h1>
        <p class="text-on-surface-variant">Rédigez des lettres adaptées à vos candidatures.</p>
      </div>
      <NuxtLink
        to="/tableau-de-bord/lettres/nouvelle"
        class="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 w-full sm:w-auto min-h-11"
      >
        <UiPzIcon name="add" class="text-[18px]" />
        Nouvelle lettre
      </NuxtLink>
    </div>

    <p v-if="loading" class="text-on-surface-variant">Chargement...</p>
    <p v-else-if="error" class="text-error">{{ error }}</p>

    <div v-else-if="letters.length === 0" class="max-w-xl glass-card rounded-xl p-stack-lg border border-outline-variant">
      <h2 class="font-bold text-on-surface mb-2">Aucune lettre pour le moment</h2>
      <p class="text-on-surface-variant mb-4">Créez votre première lettre de motivation en quelques minutes.</p>
      <NuxtLink to="/tableau-de-bord/lettres/nouvelle" class="text-secondary font-bold hover:underline">
        Commencer
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
      <NuxtLink
        v-for="letter in letters"
        :key="letter.id"
        :to="`/tableau-de-bord/lettres/${letter.id}`"
        class="glass-card rounded-xl p-stack-md border border-outline-variant hover:border-secondary transition-colors"
      >
        <h2 class="font-bold text-on-surface line-clamp-1">{{ letter.title }}</h2>
        <p v-if="letter.companyName" class="text-sm text-on-surface-variant mt-1">{{ letter.companyName }}</p>
        <p v-if="letter.position" class="text-xs text-on-surface-variant/70 mt-1">{{ letter.position }}</p>
        <p class="text-xs text-on-surface-variant mt-4">Modifiée le {{ formatDate(letter.updatedAt) }}</p>
      </NuxtLink>
    </div>
  </div>
</template>
