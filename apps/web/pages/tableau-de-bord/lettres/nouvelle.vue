<script setup lang="ts">
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { normalizeCoverLetterTemplateSlug } from '~/types/cover-letter'
import { DEFAULT_LETTER_CONTENT } from '~/features/cover-letter-templates/registry'
import { DEFAULT_CLOSING_TEXT } from '~/types/cover-letter'
import { consumeCoverLetterImportDraft } from '~/utils/cover-letter-import-draft'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const authStore = useAuthStore()
const coverLetterService = useCoverLetterService()
const resumeService = useResumeService()

// Dossier d'origine : la lettre créée sera rattachée à ce CV.
const linkedResumeId = computed(() =>
  typeof route.query.resumeId === 'string' && route.query.resumeId ? route.query.resumeId : null,
)
const backLink = computed(() =>
  linkedResumeId.value ? `/tableau-de-bord/dossiers/${linkedResumeId.value}` : '/tableau-de-bord/lettres',
)
const backLabel = computed(() => (linkedResumeId.value ? '← Retour au dossier' : '← Retour aux lettres'))
const browseModelsLink = computed(() =>
  linkedResumeId.value
    ? `/tableau-de-bord/modeles-lettres?resumeId=${linkedResumeId.value}`
    : '/tableau-de-bord/modeles-lettres',
)

const templateId = ref<CoverLetterTemplateSlug>(
  normalizeCoverLetterTemplateSlug(typeof route.query.template === 'string' ? route.query.template : undefined),
)
const senderName = ref('')
const senderEmail = ref('')
const senderPhone = ref('')
const senderLocation = ref('')
const companyName = ref('')
const companyAddress = ref('')
const position = ref('')
const recruiterName = ref('')
const content = ref(DEFAULT_LETTER_CONTENT)
const closingText = ref(DEFAULT_CLOSING_TEXT)

const loading = ref(false)
const error = ref('')

const previewLetter = computed(() =>
  coverLetterService.toSnapshot({
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
  }),
)

onMounted(async () => {
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) {
    await navigateTo('/connexion')
    return
  }

  try {
    const importDraft = consumeCoverLetterImportDraft()
    if (importDraft) {
      if (importDraft.senderName) senderName.value = importDraft.senderName
      if (importDraft.senderEmail) senderEmail.value = importDraft.senderEmail
      if (importDraft.senderPhone) senderPhone.value = importDraft.senderPhone
      if (importDraft.senderLocation) senderLocation.value = importDraft.senderLocation
      if (importDraft.companyName) companyName.value = importDraft.companyName
      if (importDraft.position) position.value = importDraft.position
      if (importDraft.recruiterName) recruiterName.value = importDraft.recruiterName
      if (importDraft.content) content.value = importDraft.content
      if (importDraft.closingText) closingText.value = importDraft.closingText
      return
    }

    let resumeId = linkedResumeId.value
    if (!resumeId) {
      const { data } = await resumeService.listResumes()
      resumeId = data[0]?.id ?? null
    }
    if (!resumeId) return
    const snapshot = await resumeService.getById(resumeId)
    const p = snapshot.personalInfo
    if (p?.fullName) senderName.value = p.fullName
    if (p?.email) senderEmail.value = p.email
    if (p?.phone) senderPhone.value = p.phone
    if (p?.location) senderLocation.value = p.location
    if (p?.jobTitle && !position.value) position.value = p.jobTitle
  } catch {
    /* optional prefill */
  }
})

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const letter = await coverLetterService.create({
      templateId: templateId.value,
      senderName: senderName.value || undefined,
      senderEmail: senderEmail.value || undefined,
      senderPhone: senderPhone.value || undefined,
      senderLocation: senderLocation.value || undefined,
      companyName: companyName.value || undefined,
      companyAddress: companyAddress.value || undefined,
      position: position.value || undefined,
      recruiterName: recruiterName.value || undefined,
      content: content.value,
      closingText: closingText.value || undefined,
      resumeId: linkedResumeId.value ?? undefined,
    })
    await navigateTo(`/tableau-de-bord/lettres/${letter.id}`)
  } catch (err) {
    const problem = err as { detail?: string; title?: string }
    error.value = problem.detail || problem.title || 'Impossible de créer la lettre.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-margin-mobile md:p-margin-desktop">
    <NuxtLink :to="backLink" class="text-sm text-secondary font-semibold hover:underline mb-4 inline-block">
      {{ backLabel }}
    </NuxtLink>
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-stack-lg">
      <div>
        <h1 class="text-2xl font-bold text-on-surface">Nouvelle lettre</h1>
        <p class="text-on-surface-variant">Choisissez un modèle et personnalisez votre candidature.</p>
      </div>
      <NuxtLink :to="browseModelsLink" class="text-secondary text-sm font-bold hover:underline">
        Parcourir les modèles
      </NuxtLink>
    </div>

    <form class="grid grid-cols-1 xl:grid-cols-2 gap-gutter" @submit.prevent="onSubmit">
      <div class="glass-card rounded-xl p-stack-lg border border-outline-variant">
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
        <p v-if="error" class="text-error text-sm mt-4">{{ error }}</p>
        <div class="flex flex-wrap justify-end gap-3 mt-stack-lg">
          <NuxtLink :to="backLink" class="px-5 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low">
            Annuler
          </NuxtLink>
          <button type="submit" class="px-6 py-2.5 bg-secondary text-white rounded-lg font-bold" :disabled="loading">
            {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </div>

      <div class="glass-card rounded-xl border border-outline-variant overflow-hidden bg-surface-container-low min-h-[480px] sticky top-4">
        <p class="text-xs font-bold uppercase tracking-wide text-on-surface-variant px-4 py-3 border-b border-outline-variant/30">
          Aperçu A4
        </p>
        <div class="h-[min(70vh,720px)]">
          <FeatureCoverLetterTemplatesA4PreviewFit :letter="previewLetter" />
        </div>
      </div>
    </form>
  </div>
</template>
