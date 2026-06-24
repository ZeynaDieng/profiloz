<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const authStore = useAuthStore()
const coverLetterService = useCoverLetterService()

const companyName = ref('')
const position = ref('')
const recruiterName = ref('')
const content = ref(
  "Je me permets de vous adresser ma candidature pour le poste mentionné ci-dessus.\n\nFort(e) de mon expérience et de ma motivation, je serais ravi(e) de contribuer aux objectifs de votre entreprise.\n\nJe reste à votre disposition pour un entretien.",
)
const loading = ref(false)
const error = ref('')

onMounted(() => {
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) navigateTo('/connexion')
})

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const letter = await coverLetterService.create({
      companyName: companyName.value || undefined,
      position: position.value || undefined,
      recruiterName: recruiterName.value || undefined,
      content: content.value,
    })
    await navigateTo(`/tableau-de-bord/lettres/${letter.id}`)
  } catch {
    error.value = 'Impossible de créer la lettre.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-margin-mobile md:p-margin-desktop max-w-3xl">
    <NuxtLink to="/tableau-de-bord/lettres" class="text-sm text-secondary font-semibold hover:underline mb-4 inline-block">
      ← Retour aux lettres
    </NuxtLink>
    <h1 class="text-2xl font-bold text-on-surface mb-2">Nouvelle lettre</h1>
    <p class="text-on-surface-variant mb-stack-lg">Renseignez les informations de votre candidature.</p>

    <form class="space-y-stack-md glass-card rounded-xl p-stack-lg border border-outline-variant" @submit.prevent="onSubmit">
      <UiFormField label="Entreprise">
        <input v-model="companyName" type="text" class="form-input form-input--white w-full" placeholder="Acme Corp" />
      </UiFormField>
      <UiFormField label="Poste visé">
        <input v-model="position" type="text" class="form-input form-input--white w-full" placeholder="Designer UX Senior" />
      </UiFormField>
      <UiFormField label="Destinataire (optionnel)">
        <input v-model="recruiterName" type="text" class="form-input form-input--white w-full" placeholder="Marie Dupont" />
      </UiFormField>
      <UiFormField label="Contenu">
        <textarea v-model="content" rows="12" required class="form-input form-input--white w-full resize-y" />
      </UiFormField>
      <p v-if="error" class="text-error text-sm">{{ error }}</p>
      <div class="flex justify-end gap-3">
        <NuxtLink to="/tableau-de-bord/lettres" class="px-5 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low">
          Annuler
        </NuxtLink>
        <button type="submit" class="px-6 py-2.5 bg-secondary text-white rounded-lg font-bold" :disabled="loading">
          {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </div>
</template>
