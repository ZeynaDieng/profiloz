<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { normalizeCoverLetterTemplateSlug } from '~/types/cover-letter'
import { DEFAULT_CLOSING_TEXT } from '~/types/cover-letter'
import { getLetterAccentPalette, resolveLetterAccentColor } from '~/utils/template-accent-colors'
import { consumeCoverLetterImportDraft } from '~/utils/cover-letter-import-draft'
import { buildCoverLetterPdfFilename, buildCoverLetterTitle } from '~/utils/coverLetterPdfFilename'
import { ensurePaidGuestDossier, markGuestDossierDownload, restorePaidGuestSession } from '~/utils/guest-dossier-state'
import { saveLastDownloadContext } from '~/utils/last-download-context'
import { resolvePersistableResumeId } from '~/utils/resume-id'
import { clearPaymentDraftBackup } from '~/utils/payment-draft-backup'
import { buildCoverLetterPreviewSnapshot } from '~/features/cover-letter-templates/demoSnapshot'
import { AMINATA_PERSONA } from '~/features/demo/aminata-persona'

definePageMeta({ layout: false })

const route = useRoute()
const authStore = useAuthStore()
const resumeStore = useResumeStore()
const coverLetterStore = useCoverLetterStore()
const coverLetterService = useCoverLetterService()
const pdfService = usePdfService()
const resumeService = useResumeService()
const { ensureSession } = useGuestSession()
const { ensureDownloadAccess } = usePaymentEntitlements()
const { isDesktop } = useBreakpoints()
const { openMenu } = useMarketingMenuState()

const loading = ref(true)
const pdfLoading = ref(false)
const pdfLoadingStep = ref(0)
const pdfError = ref('')
const previewOpen = ref(false)
const { fieldErrors, formError, clearAll, setFieldError, announceFormError } = useFormValidation()

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
  buildCoverLetterPreviewSnapshot(
    templateId.value,
    {
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
    },
    accentColor.value,
  ),
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
  clearPaymentDraftBackup()
  authStore.loadFromStorage()
  await syncGuestSessionForEditor()
  await ensureSession().catch(() => {})

  resumeStore.rehydrateFromStorage()
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
  } else if (coverLetterStore.current?.senderName === AMINATA_PERSONA.fullName) {
    // Ancien brouillon démo → formulaire vide (aperçu garde Aminata via merge)
    coverLetterStore.startNewDraft()
    if (templateFromQuery) {
      coverLetterStore.setTemplate(normalizeCoverLetterTemplateSlug(templateFromQuery))
    }
  }

  // Pré-remplissage automatique des coordonnées et du poste visé depuis le CV s'ils sont vides
  const cvInfo = resumeStore.current?.personalInfo
  if (cvInfo) {
    if (!coverLetterStore.current?.senderName?.trim() && cvInfo.fullName) {
      coverLetterStore.patchFields({ senderName: cvInfo.fullName })
    }
    if (!coverLetterStore.current?.senderEmail?.trim() && cvInfo.email) {
      coverLetterStore.patchFields({ senderEmail: cvInfo.email })
    }
    if (!coverLetterStore.current?.senderPhone?.trim() && cvInfo.phone) {
      coverLetterStore.patchFields({ senderPhone: cvInfo.phone })
    }
    if (!coverLetterStore.current?.senderLocation?.trim() && cvInfo.location) {
      coverLetterStore.patchFields({ senderLocation: cvInfo.location })
    }
    if (!coverLetterStore.current?.position?.trim() && cvInfo.jobTitle) {
      coverLetterStore.patchFields({ position: cvInfo.jobTitle })
    }
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

async function resolveLinkedResumeId(): Promise<string | undefined> {
  const fromQuery = resolvePersistableResumeId(
    typeof route.query.resumeId === 'string' ? route.query.resumeId : undefined,
  )
  if (fromQuery) return fromQuery

  const savedId = resolvePersistableResumeId(resumeStore.savedResumeId)
  if (savedId) return savedId

  resumeStore.rehydrateFromStorage()
  if (!resumeStore.current?.personalInfo.fullName?.trim()) return undefined

  const payload = resumeService.toSavePayload({
    ...resumeStore.current,
    templateConfig: { ...resumeStore.current.templateConfig },
  })
  const saved = await resumeService.create(payload)
  resumeStore.markSaved(saved)
  return saved.id
}

async function saveLetterToServer(): Promise<string | null> {
  authStore.syncSession()
  if (!authStore.isAuthenticated) return null

  syncStoreFromRefs()
  const draft = coverLetterStore.current
  if (!draft) return null

  const resumeId = await resolveLinkedResumeId()

  const payload = {
    title: buildCoverLetterTitle(draft.senderName),
    senderName: draft.senderName || undefined,
    senderEmail: draft.senderEmail || undefined,
    senderPhone: draft.senderPhone || undefined,
    senderLocation: draft.senderLocation || undefined,
    companyName: draft.companyName || undefined,
    companyAddress: draft.companyAddress || undefined,
    position: draft.position || undefined,
    recruiterName: draft.recruiterName || undefined,
    content: draft.content,
    closingText: draft.closingText || undefined,
    templateId: draft.templateSlug,
    accentColor: draft.accentColor || undefined,
    resumeId,
  }

  const existingId =
    typeof route.query.letterId === 'string' && route.query.letterId
      ? route.query.letterId
      : null

  if (existingId) {
    await coverLetterService.update(existingId, payload)
    return existingId
  }

  const created = await coverLetterService.create(payload)
  await navigateTo(
    { path: route.path, query: { ...route.query, letterId: created.id } },
    { replace: true },
  )
  return created.id
}

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
    announceFormError(validation.formError)
    return
  }

  let stepTimer: number | undefined
  try {
    syncStoreFromRefs()
    restorePaidGuestSession()
    await syncGuestSessionForEditor()
    await ensureSession()

    if (!(await ensureDownloadAccess(route.fullPath))) return

    pdfLoading.value = true
    pdfLoadingStep.value = 0
    stepTimer = window.setInterval(() => {
      if (pdfLoadingStep.value < MSG.letterPdf.steps.length - 1) {
        pdfLoadingStep.value += 1
      }
    }, 1200)

    if (authStore.isAuthenticated) {
      const letterId = await saveLetterToServer()
      if (!letterId) {
        pdfError.value = MSG.letter.saveError
        useAppToast().error(MSG.letter.saveError)
        return
      }
      const { filename } = await coverLetterService.downloadPdf(letterId)
      saveLastDownloadContext({ kind: 'letter', filename, downloadedAt: new Date().toISOString() })
      await navigateTo({ path: '/creer/succes', query: { file: filename, type: 'letter' } })
      return
    }

    const snapshot = coverLetterStore.toSnapshot()
    if (!snapshot) throw new Error('missing snapshot')

    const linkedResumeId = resolvePersistableResumeId(resumeStore.savedResumeId)
    const { filename } = await pdfService.generateLetterAndDownload(snapshot, linkedResumeId)
    restorePaidGuestSession()
    ensurePaidGuestDossier('letter')
    markGuestDossierDownload('letter', snapshot.id)
    saveLastDownloadContext({ kind: 'letter', filename, downloadedAt: new Date().toISOString() })
    await navigateTo({ path: '/creer/succes', query: { file: filename, type: 'letter' } })
  } catch (err) {
    const problem = err as { status?: number; statusCode?: number }
    const status = problem.status ?? problem.statusCode
    if (status === 402) {
      await navigateTo({
        path: '/tarifs',
        query: { reason: 'unlock', returnTo: route.fullPath },
      })
      return
    }
    pdfError.value = MSG.letter.error
    useAppToast().error(MSG.letter.error)
  } finally {
    if (stepTimer !== undefined) window.clearInterval(stepTimer)
    pdfLoading.value = false
  }
}
</script>

<template>
  <!-- Skeleton Loader de l'éditeur de lettre -->
  <div v-if="loading" class="h-screen flex flex-col overflow-hidden bg-background">
    <!-- Topbar skeleton -->
    <header class="flex items-center justify-between px-margin-mobile py-2 bg-surface border-b border-outline-variant/30 shrink-0 min-h-[3.25rem]">
      <div class="flex items-center gap-2">
        <UiSkeleton variant="circle" width="2rem" height="2rem" />
        <UiSkeleton variant="rect" width="10rem" height="1.25rem" class="rounded animate-pulse" />
      </div>
      <div class="flex items-center gap-2">
        <UiSkeleton variant="rect" width="8rem" height="2.25rem" class="rounded-xl animate-pulse" />
      </div>
    </header>

    <!-- Content skeleton -->
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      <!-- Form column -->
      <div class="flex flex-col overflow-y-auto p-4 md:p-6 border-r border-outline-variant/30 space-y-6">
        <div class="space-y-4">
          <UiSkeleton variant="rect" width="40%" height="1.25rem" class="rounded animate-pulse" />
          <UiSkeleton variant="rect" height="3.5rem" class="rounded-xl animate-pulse" />
          <UiSkeleton variant="rect" height="3.5rem" class="rounded-xl animate-pulse" />
        </div>
        <div class="space-y-4">
          <UiSkeleton variant="rect" width="30%" height="1.25rem" class="rounded animate-pulse" />
          <UiSkeleton variant="rect" height="12rem" class="rounded-xl animate-pulse" />
        </div>
      </div>

      <!-- Preview column (Hidden on mobile) -->
      <div class="hidden lg:flex flex-col items-center justify-center p-8 bg-surface-container-lowest overflow-y-auto">
        <div class="w-full max-w-[21cm] aspect-[1/1.414] bg-white rounded-xl shadow-lg border border-outline-variant/30 p-12 space-y-6">
          <div class="space-y-2">
            <UiSkeleton variant="rect" width="30%" height="1.5rem" class="rounded animate-pulse" />
            <UiSkeleton variant="rect" width="25%" height="1rem" class="rounded animate-pulse" />
          </div>
          <div class="space-y-2 text-right self-end ml-auto flex flex-col items-end">
            <UiSkeleton variant="rect" width="40%" height="1.25rem" class="rounded animate-pulse" />
            <UiSkeleton variant="rect" width="35%" height="1rem" class="rounded animate-pulse" />
          </div>
          <div class="mt-12 space-y-4">
            <UiSkeleton variant="rect" width="45%" height="1.25rem" class="rounded animate-pulse" />
            <UiSkeleton variant="text" :lines="6" class="animate-pulse" />
            <UiSkeleton variant="rect" width="30%" height="1.25rem" class="rounded animate-pulse" style="margin-top: 2rem;" />
          </div>
        </div>
      </div>
    </div>
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
          <FeatureCoverLetterForm
            v-model:template-id="templateId"
            v-model:accent-color="accentColor"
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
            :accent-colors="accentColors"
            :show-template-picker="true"
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
