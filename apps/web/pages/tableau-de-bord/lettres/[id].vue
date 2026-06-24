<script setup lang="ts">
import type { CoverLetter } from '~/services/cover-letter.service'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const authStore = useAuthStore()
const coverLetterService = useCoverLetterService()

const letter = ref<CoverLetter | null>(null)
const loading = ref(true)
const saving = ref(false)
const pdfLoading = ref(false)
const error = ref('')

const companyName = ref('')
const position = ref('')
const recruiterName = ref('')
const content = ref('')

onMounted(async () => {
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) {
    await navigateTo('/connexion')
    return
  }

  try {
    const data = await coverLetterService.getById(String(route.params.id))
    letter.value = data
    companyName.value = data.companyName ?? ''
    position.value = data.position ?? ''
    recruiterName.value = data.recruiterName ?? ''
    content.value = data.content
  } catch {
    error.value = 'Lettre introuvable.'
  } finally {
    loading.value = false
  }
})

async function onSave() {
  if (!letter.value) return
  saving.value = true
  error.value = ''
  try {
    letter.value = await coverLetterService.update(letter.value.id, {
      companyName: companyName.value || null,
      position: position.value || null,
      recruiterName: recruiterName.value || null,
      content: content.value,
    })
  } catch {
    error.value = 'Impossible de sauvegarder.'
  } finally {
    saving.value = false
  }
}

async function onDownloadPdf() {
  if (!letter.value) return
  pdfLoading.value = true
  try {
    await onSave()
    await coverLetterService.downloadPdf(letter.value.id)
  } catch {
    error.value = 'Impossible de générer le PDF.'
  } finally {
    pdfLoading.value = false
  }
}

async function onDelete() {
  if (!letter.value || !confirm('Supprimer cette lettre ?')) return
  await coverLetterService.remove(letter.value.id)
  await navigateTo('/tableau-de-bord/lettres')
}
</script>

<template>
  <div class="p-margin-mobile md:p-margin-desktop">
    <NuxtLink to="/tableau-de-bord/lettres" class="text-sm text-secondary font-semibold hover:underline mb-4 inline-block">
      ← Retour aux lettres
    </NuxtLink>

    <p v-if="loading" class="text-on-surface-variant">Chargement...</p>
    <p v-else-if="error && !letter" class="text-error">{{ error }}</p>

    <div v-else-if="letter" class="grid grid-cols-1 xl:grid-cols-2 gap-gutter">
      <form class="space-y-stack-md glass-card rounded-xl p-stack-lg border border-outline-variant" @submit.prevent="onSave">
        <h1 class="text-xl font-bold text-on-surface">{{ letter.title }}</h1>
        <UiFormField label="Entreprise">
          <input v-model="companyName" type="text" class="form-input form-input--white w-full" />
        </UiFormField>
        <UiFormField label="Poste visé">
          <input v-model="position" type="text" class="form-input form-input--white w-full" />
        </UiFormField>
        <UiFormField label="Destinataire">
          <input v-model="recruiterName" type="text" class="form-input form-input--white w-full" />
        </UiFormField>
        <UiFormField label="Contenu">
          <textarea v-model="content" rows="14" required class="form-input form-input--white w-full resize-y" />
        </UiFormField>
        <p v-if="error" class="text-error text-sm">{{ error }}</p>
        <div class="flex flex-wrap gap-3">
          <button type="submit" class="px-5 py-2.5 bg-secondary text-white rounded-lg font-bold" :disabled="saving">
            {{ saving ? 'Sauvegarde...' : 'Sauvegarder' }}
          </button>
          <button
            type="button"
            class="px-5 py-2.5 border border-outline-variant rounded-lg font-bold"
            :disabled="pdfLoading"
            @click="onDownloadPdf"
          >
            {{ pdfLoading ? 'PDF...' : 'Télécharger PDF' }}
          </button>
          <button type="button" class="px-5 py-2.5 text-error hover:bg-error/5 rounded-lg" @click="onDelete">
            Supprimer
          </button>
        </div>
      </form>

      <div class="glass-card rounded-xl p-stack-lg border border-outline-variant bg-white min-h-[500px]">
        <p class="text-xs text-on-surface-variant text-right mb-6">
          {{ new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}
        </p>
        <p v-if="companyName" class="mb-4">{{ companyName }}</p>
        <p class="mb-4">{{ recruiterName ? `Madame ${recruiterName},` : 'Madame, Monsieur,' }}</p>
        <p v-if="position" class="font-bold mb-4">Objet : Candidature — {{ position }}</p>
        <div class="space-y-4 text-sm leading-relaxed whitespace-pre-wrap text-on-surface-variant">{{ content }}</div>
        <p class="mt-8 text-sm">
          Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.
        </p>
      </div>
    </div>
  </div>
</template>
