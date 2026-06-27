<script setup lang="ts">
import type { CoverLetter } from '~/services/cover-letter.service'
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { normalizeCoverLetterTemplateSlug } from '~/types/cover-letter'
import { DEFAULT_CLOSING_TEXT } from '~/types/cover-letter'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const authStore = useAuthStore()
const coverLetterService = useCoverLetterService()

const letter = ref<CoverLetter | null>(null)
const loading = ref(true)
const saving = ref(false)
const pdfLoading = ref(false)
const error = ref('')

const templateId = ref<CoverLetterTemplateSlug>('CLASSIQUE')
const senderName = ref('')
const senderEmail = ref('')
const senderPhone = ref('')
const senderLocation = ref('')
const companyName = ref('')
const companyAddress = ref('')
const position = ref('')
const recruiterName = ref('')
const content = ref('')
const closingText = ref(DEFAULT_CLOSING_TEXT)

const previewLetter = computed(() => {
  if (!letter.value) return null
  return coverLetterService.toSnapshot({
    templateId: templateId.value,
    senderName: senderName.value,
    senderEmail: senderEmail.value,
    senderPhone: senderPhone.value,
    senderLocation: senderLocation.value,
    companyName: companyName.value,
    companyAddress: companyAddress.value,
    position: position.value,
    recruiterName: recruiterName.value,
    content: content.value,
    closingText: closingText.value,
  })
})

onMounted(async () => {
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) {
    await navigateTo('/connexion')
    return
  }

  try {
    const data = await coverLetterService.getById(String(route.params.id))
    letter.value = data
    templateId.value = normalizeCoverLetterTemplateSlug(data.templateId)
    senderName.value = data.senderName ?? ''
    senderEmail.value = data.senderEmail ?? ''
    senderPhone.value = data.senderPhone ?? ''
    senderLocation.value = data.senderLocation ?? ''
    companyName.value = data.companyName ?? ''
    companyAddress.value = data.companyAddress ?? ''
    position.value = data.position ?? ''
    recruiterName.value = data.recruiterName ?? ''
    content.value = data.content
    closingText.value = data.closingText ?? DEFAULT_CLOSING_TEXT
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
      templateId: templateId.value,
      senderName: senderName.value || null,
      senderEmail: senderEmail.value || null,
      senderPhone: senderPhone.value || null,
      senderLocation: senderLocation.value || null,
      companyName: companyName.value || null,
      companyAddress: companyAddress.value || null,
      position: position.value || null,
      recruiterName: recruiterName.value || null,
      content: content.value,
      closingText: closingText.value || null,
    })
  } catch (err) {
    const problem = err as { detail?: string; title?: string }
    error.value = problem.detail || problem.title || 'Impossible de sauvegarder.'
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
      <form class="glass-card rounded-xl p-stack-lg border border-outline-variant space-y-stack-lg" @submit.prevent="onSave">
        <h1 class="text-xl font-bold text-on-surface">{{ letter.title }}</h1>

        <FeatureCoverLetterForm
          v-model:template-id="templateId"
          v-model:sender-name="senderName"
          v-model:sender-email="senderEmail"
          v-model:sender-phone="senderPhone"
          v-model:sender-location="senderLocation"
          v-model:company-name="companyName"
          v-model:company-address="companyAddress"
          v-model:position="position"
          v-model:recruiter-name="recruiterName"
          v-model:content="content"
          v-model:closing-text="closingText"
        />

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

      <div class="glass-card rounded-xl border border-outline-variant overflow-hidden bg-surface-container-low min-h-[480px] xl:sticky xl:top-4">
        <p class="text-xs font-bold uppercase tracking-wide text-on-surface-variant px-4 py-3 border-b border-outline-variant/30">
          Aperçu A4
        </p>
        <div v-if="previewLetter" class="h-[min(70vh,720px)]">
          <FeatureCoverLetterTemplatesA4PreviewFit :letter="previewLetter" />
        </div>
      </div>
    </div>
  </div>
</template>
