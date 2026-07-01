<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import type { CoverLetter } from '~/services/cover-letter.service'
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { normalizeCoverLetterTemplateSlug } from '~/types/cover-letter'
import { DEFAULT_CLOSING_TEXT } from '~/types/cover-letter'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const authStore = useAuthStore()
const coverLetterService = useCoverLetterService()
const { isDesktop } = useBreakpoints()
const { confirm: confirmAction } = useConfirm()

const letter = ref<CoverLetter | null>(null)
const loading = ref(true)
const saving = ref(false)
const pdfLoading = ref(false)
const pageError = ref('')
const previewOpen = ref(false)
const { fieldErrors, formError, clearAll, setFieldError, scrollToFirstError } = useFormValidation()

function validateForm(): boolean {
  clearAll()
  const result = validateCoverLetterFields({
    senderName: senderName.value,
    senderEmail: senderEmail.value,
    companyName: companyName.value,
    position: position.value,
    content: content.value,
  })
  for (const [key, message] of Object.entries(result.fieldErrors)) {
    setFieldError(key, message)
  }
  formError.value = result.formError
  if (result.formError) {
    scrollToFirstError()
    return false
  }
  return true
}

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
    pageError.value = 'Lettre introuvable.'
  } finally {
    loading.value = false
  }
})

async function onSave() {
  if (!letter.value) return
  if (!validateForm()) return

  saving.value = true
  clearAll()
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
    formError.value = problem.detail || problem.title || MSG.letter.saveError
  } finally {
    saving.value = false
  }
}

async function onDownloadPdf() {
  if (!letter.value) return
  if (!validateForm()) return

  pdfLoading.value = true
  try {
    await onSave()
    if (formError.value) return
    await coverLetterService.downloadPdf(letter.value.id)
  } catch {
    formError.value = MSG.pdf.error
  } finally {
    pdfLoading.value = false
  }
}

async function onDelete() {
  if (!letter.value) return
  const ok = await confirmAction(MSG.delete.confirmLetter, {
    title: MSG.delete.title,
    confirmLabel: MSG.delete.confirmLabel,
    destructive: true,
  })
  if (!ok) return
  await coverLetterService.remove(letter.value.id)
  await navigateTo('/tableau-de-bord/lettres')
}
</script>

<template>
  <div class="page-container pb-28 xl:pb-0">
    <NuxtLink to="/tableau-de-bord/lettres" class="text-sm text-secondary font-semibold hover:underline mb-4 inline-flex items-center gap-1 min-h-11">
      <UiPzIcon name="arrow_back" class="text-base" />
      Retour aux lettres
    </NuxtLink>

    <div v-if="loading" class="space-y-stack-md">
      <UiSkeleton variant="text" :lines="2" />
      <UiSkeleton variant="rect" height="12rem" />
    </div>
    <UiMessageBanner v-else-if="pageError && !letter" variant="error" :message="pageError" class="mb-4" />

    <div v-else-if="letter" class="flex flex-col xl:grid xl:grid-cols-2 gap-gutter">
      <form class="glass-card rounded-xl p-stack-md md:p-stack-lg border border-outline-variant space-y-stack-lg" @submit.prevent="onSave">
        <h1 class="text-xl md:text-2xl font-bold text-on-surface">{{ letter.title }}</h1>

        <Transition name="form-field__error">
          <UiMessageBanner
            v-if="formError"
            variant="error"
            :message="formError"
            class="mb-4"
          />
        </Transition>

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
          :field-errors="fieldErrors"
        />

        <!-- Actions desktop -->
        <div class="hidden md:flex flex-wrap gap-3">
          <UiButton variant="secondary" icon="download" :loading="pdfLoading" @click="onDownloadPdf">
            {{ MSG.buttons.downloadPdf }}
          </UiButton>
          <UiButton variant="ghost" @click="onDelete">
            Supprimer
          </UiButton>
        </div>
      </form>

      <!-- Aperçu desktop -->
      <div v-if="isDesktop" class="glass-card rounded-xl border border-outline-variant overflow-hidden bg-surface-container-low min-h-[480px] xl:sticky xl:top-4">
        <p class="text-xs font-bold uppercase tracking-wide text-on-surface-variant px-4 py-3 border-b border-outline-variant/30">
          Aperçu A4
        </p>
        <div v-if="previewLetter" class="h-[min(70vh,720px)]">
          <FeatureCoverLetterTemplatesA4PreviewFit :letter="previewLetter" />
        </div>
      </div>
    </div>

    <!-- Mobile : barre d'actions sticky -->
    <UiStickyActionBar v-if="letter && !loading" class="xl:hidden">
      <div class="flex gap-2">
        <UiButton variant="outline" block icon="visibility" @click="previewOpen = true">
          Aperçu
        </UiButton>
        <UiButton variant="secondary" block icon="download" :loading="pdfLoading" @click="onDownloadPdf">
          {{ MSG.buttons.downloadPdf }}
        </UiButton>
      </div>
    </UiStickyActionBar>

    <UiFullScreenSheet v-if="previewLetter" v-model:open="previewOpen" title="Aperçu A4">
      <div class="h-full min-h-[70vh] bg-surface-container-low">
        <FeatureCoverLetterTemplatesA4PreviewFit :letter="previewLetter" />
      </div>
      <template #footer>
        <UiButton variant="secondary" block @click="previewOpen = false">
          Retour à l'édition
        </UiButton>
      </template>
    </UiFullScreenSheet>
  </div>
</template>
