<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { normalizeCoverLetterTemplateSlug } from '~/types/cover-letter'
import { DEFAULT_CLOSING_TEXT } from '~/types/cover-letter'
import { getLetterAccentPalette, resolveLetterAccentColor } from '~/utils/template-accent-colors'
import { consumeCoverLetterImportDraft } from '~/utils/cover-letter-import-draft'
import { hasDossierDownloadAccess } from '~/utils/dossier-access'
import { initGuestDossier, loadGuestDossierState, markGuestDossierDownload, restorePaidGuestSession } from '~/utils/guest-dossier-state'
import { saveLastDownloadContext } from '~/utils/last-download-context'

definePageMeta({ layout: false })

const route = useRoute()
const authStore = useAuthStore()
const resumeStore = useResumeStore()
const coverLetterStore = useCoverLetterStore()
const coverLetterService = useCoverLetterService()
const pdfService = usePdfService()
const paymentService = usePaymentService()
const { ensureSession } = useGuestSession()
const { isDesktop } = useBreakpoints()
const { openMenu } = useMarketingMenuState()

const loading = ref(true)
const pdfLoading = ref(false)
const pdfLoadingStep = ref(0)
const pdfError = ref('')
const previewOpen = ref(false)
const { fieldErrors, formError, clearAll, setFieldError, scrollToFirstError } = useFormValidation()

const templateId = ref<CoverLetterTemplateSlug>('CLASSIQUE')
const accentColor = ref('#0051d5')
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

const accentColors = computed(() => getLetterAccentPalette(templateId.value))

const previewLetter = computed(() =>
  coverLetterService.toSnapshot({
    templateId: templateId.value,
    accentColor: accentColor.value,
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

function syncStoreFromRefs() {
  coverLetterStore.patchFields({
    templateSlug: templateId.value,
    accentColor: accentColor.value,
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
}

function loadRefsFromStore() {
  const draft = coverLetterStore.current
  if (!draft) return
  templateId.value = draft.templateSlug
  accentColor.value = resolveLetterAccentColor(draft.templateSlug, draft.accentColor)
  senderName.value = draft.senderName
  senderEmail.value = draft.senderEmail
  senderPhone.value = draft.senderPhone
  senderLocation.value = draft.senderLocation
  companyName.value = draft.companyName
  companyAddress.value = draft.companyAddress
  position.value = draft.position
  recruiterName.value = draft.recruiterName
  content.value = draft.content
  closingText.value = draft.closingText
}

watch(
  [
    templateId,
    accentColor,
    senderName,
    senderEmail,
    senderPhone,
    senderLocation,
    companyName,
    companyAddress,
    position,
    recruiterName,
    content,
    closingText,
  ],
  () => {
    if (loading.value) return
    syncStoreFromRefs()
  },
)

const { statusLabel: autoSaveLabel } = useAutoSave({
  enabled: computed(() => !loading.value),
  isDirty: computed(() => coverLetterStore.isDirty),
  onSave: async () => {
    coverLetterStore.markDraftSynced()
  },
})

watch(templateId, (slug, previous) => {
  if (loading.value || !previous || slug === previous) return
  accentColor.value = resolveLetterAccentColor(slug)
})

const pdfLoadingMessage = computed(() => {
  const steps = MSG.letterPdf.steps
  return steps[Math.min(pdfLoadingStep.value, steps.length - 1)]
})

onMounted(async () => {
  authStore.loadFromStorage()
  await syncGuestSessionForEditor()
  await ensureSession().catch(() => {})

  coverLetterStore.rehydrateFromStorage()
  coverLetterStore.initDraft()

  const templateFromQuery =
    typeof route.query.template === 'string' ? route.query.template : undefined
  if (templateFromQuery) {
    coverLetterStore.setTemplate(normalizeCoverLetterTemplateSlug(templateFromQuery))
  }

  const importDraft = consumeCoverLetterImportDraft()
  if (importDraft) {
    coverLetterStore.applyImport({
      senderName: importDraft.senderName ?? '',
      senderEmail: importDraft.senderEmail ?? '',
      senderPhone: importDraft.senderPhone ?? '',
      senderLocation: importDraft.senderLocation ?? '',
      companyName: importDraft.companyName ?? '',
      position: importDraft.position ?? '',
      recruiterName: importDraft.recruiterName ?? '',
      content: importDraft.content ?? '',
      closingText: importDraft.closingText ?? DEFAULT_CLOSING_TEXT,
    })
  } else if (!coverLetterStore.current?.senderName?.trim()) {
    resumeStore.rehydrateFromStorage()
    coverLetterStore.loadDemoPersona(resumeStore.current)
  }

  loadRefsFromStore()
  loading.value = false

  if (route.query.download === '1') {
    await nextTick()
    await downloadPdf()
    const { download: _removed, ...restQuery } = route.query
    await navigateTo({ path: route.path, query: restQuery }, { replace: true })
  }
})

async function downloadPdf() {
  pdfError.value = ''
  clearAll()
  const validation = validateCoverLetterFields({
    senderName: senderName.value,
    senderEmail: senderEmail.value,
    companyName: companyName.value,
    position: position.value,
    content: content.value,
  })
  for (const [key, message] of Object.entries(validation.fieldErrors)) {
    setFieldError(key, message)
  }
  formError.value = validation.formError
  if (validation.formError) {
    pdfError.value = validation.formError
    scrollToFirstError()
    return
  }

  pdfLoading.value = true
  pdfLoadingStep.value = 0
  const stepTimer = window.setInterval(() => {
    if (pdfLoadingStep.value < MSG.letterPdf.steps.length - 1) {
      pdfLoadingStep.value += 1
    }
  }, 1200)
  try {
    syncStoreFromRefs()
    restorePaidGuestSession()
    await syncGuestSessionForEditor()
    await ensureSession()

    try {
      const entitlements = await paymentService.getEntitlements()
      if (!hasDossierDownloadAccess(entitlements)) {
        await navigateTo({
          path: '/tarifs',
          query: { reason: 'unlock', returnTo: route.fullPath },
        })
        return
      }
    } catch (err) {
      const problem = err as { status?: number }
      if (problem.status === 402) {
        await navigateTo({
          path: '/tarifs',
          query: { reason: 'unlock', returnTo: route.fullPath },
        })
        return
      }
      throw err
    }

    const snapshot = coverLetterStore.toSnapshot()
    if (!snapshot) throw new Error('missing snapshot')

    const { filename } = await pdfService.generateLetterAndDownload(snapshot)
    restorePaidGuestSession()
    const guestId = import.meta.client ? localStorage.getItem('profiloz:guest-session') : null
    if (guestId && !loadGuestDossierState()) initGuestDossier(guestId, 'letter')
    markGuestDossierDownload('letter')
    saveLastDownloadContext({ kind: 'letter', filename, downloadedAt: new Date().toISOString() })
    await navigateTo({ path: '/creer/succes', query: { file: filename, type: 'letter' } })
  } catch (err) {
    const problem = err as { status?: number }
    if (problem.status === 402) {
      await navigateTo({
        path: '/tarifs',
        query: { reason: 'unlock', returnTo: route.fullPath },
      })
      return
    }
    pdfError.value = MSG.letter.error
  } finally {
    window.clearInterval(stepTimer)
    pdfLoading.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="h-screen flex flex-col items-center justify-center gap-4 text-on-surface-variant p-margin-mobile">
    <UiSkeleton variant="circle" width="3rem" height="3rem" />
    <p>Chargement de l'éditeur...</p>
  </div>

  <div v-else class="min-h-screen flex flex-col bg-background">
    <header class="flex items-center justify-between gap-3 px-margin-mobile py-2.5 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-sm shrink-0">
      <div class="flex items-center gap-2 min-w-0">
        <NuxtLink to="/creer/lettre/modele" class="text-secondary shrink-0 min-h-11 min-w-11 inline-flex items-center justify-center">
          <UiPzIcon name="arrow_back" />
        </NuxtLink>
        <div class="min-w-0">
          <p class="text-xs text-on-surface-variant truncate">{{ autoSaveLabel }}</p>
          <h1 class="font-bold text-on-surface truncate">Ma lettre de motivation</h1>
        </div>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button
          type="button"
          class="sm:hidden touch-target inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container"
          aria-label="Menu"
          @click="openMenu($event.currentTarget as HTMLElement)"
        >
          <UiPzIcon name="menu" />
        </button>
        <LayoutAuthStatus icon-only class="sm:hidden" />
        <LayoutAuthStatus compact class="hidden sm:flex" />
      </div>
    </header>

    <LayoutAppMarketingDrawer />

    <main class="flex-1 page-container pb-28 xl:pb-6">
      <div class="flex flex-col xl:grid xl:grid-cols-2 gap-gutter mt-4">
        <UiCard variant="glass" padding="lg">
          <Transition name="form-field__error">
            <UiMessageBanner
              v-if="formError"
              variant="error"
              :message="formError"
              class="mb-4"
            />
          </Transition>
          <div class="mb-5">
            <p class="text-sm font-semibold text-on-surface mb-2">Couleur d’accent</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="color in accentColors"
                :key="color"
                type="button"
                class="w-9 h-9 rounded-full ring-2 ring-offset-2 transition-transform hover:scale-105"
                :class="accentColor === color ? 'ring-secondary' : 'ring-transparent'"
                :style="{ backgroundColor: color }"
                :aria-label="`Couleur ${color}`"
                @click="accentColor = color"
              />
            </div>
          </div>
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
          <UiMessageBanner v-if="pdfError" variant="error" :message="pdfError" class="mt-4" />
          <div class="hidden md:flex justify-end mt-stack-lg">
            <UiButton variant="secondary" icon="download" :loading="pdfLoading" @click="downloadPdf">
              {{ MSG.buttons.downloadPdf }}
            </UiButton>
          </div>
        </UiCard>

        <UiCard v-if="isDesktop" variant="glass" padding="sm" class="overflow-hidden bg-surface-container-low min-h-[480px] xl:sticky xl:top-4">
          <p class="text-xs font-bold uppercase tracking-wide text-on-surface-variant px-4 py-3 border-b border-outline-variant/30">
            Aperçu A4
          </p>
          <div class="h-[min(70vh,720px)]">
            <FeatureCoverLetterTemplatesA4PreviewFit :letter="previewLetter" />
          </div>
        </UiCard>
      </div>
    </main>

    <UiStickyActionBar class="md:hidden">
      <div class="grid grid-cols-2 gap-2">
        <UiButton variant="outline" block icon="visibility" @click="previewOpen = true">
          Aperçu
        </UiButton>
        <UiButton variant="secondary" block icon="download" :loading="pdfLoading" @click="downloadPdf">
          {{ MSG.buttons.downloadPdf }}
        </UiButton>
      </div>
    </UiStickyActionBar>

    <UiFullScreenSheet v-model:open="previewOpen" title="Aperçu A4">
      <div class="h-full min-h-[70vh] bg-surface-container-low">
        <FeatureCoverLetterTemplatesA4PreviewFit :letter="previewLetter" />
      </div>
      <template #footer>
        <UiButton variant="secondary" block @click="previewOpen = false">
          Retour au formulaire
        </UiButton>
      </template>
    </UiFullScreenSheet>

    <div
      v-if="pdfLoading"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 backdrop-blur-[2px] p-margin-mobile"
      role="status"
      aria-live="polite"
    >
      <UiCard variant="glass" padding="lg" class="w-full max-w-sm text-center shadow-lg">
        <UiPzIcon name="picture_as_pdf" class="text-4xl text-secondary mb-4 animate-pulse" />
        <p class="font-bold text-on-surface mb-2">{{ pdfLoadingMessage }}</p>
        <p class="text-sm text-on-surface-variant">Quelques instants suffisent.</p>
        <UiSkeleton variant="text" width="100%" class="mt-4" />
      </UiCard>
    </div>
  </div>
</template>
