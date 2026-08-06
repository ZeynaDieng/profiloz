<script setup lang="ts">
import type { ResumeSnapshot, TemplateSlug } from '@profiloz/shared'
import { MSG, TEMPLATE_SLUGS } from '@profiloz/shared'
import { getTemplateBySlug } from '~/features/templates/registry'
import { getCvAccentPalette, resolveCvAccentColor } from '~/utils/template-accent-colors'
import { ensurePaidGuestDossier, markGuestDossierDownload, restorePaidGuestSession } from '~/utils/guest-dossier-state'
import { changeTemplateHrefFromRoute } from '~/utils/template-navigation'
import { resolvePersistableResumeId } from '~/utils/resume-id'
import { clearPaymentDraftBackup, loadPaymentDraftBackup } from '~/utils/payment-draft-backup'
import { findResumeSnapshotInStorage } from '~/utils/guest-draft-sync'
import { isPaymentRequiredError } from '~/utils/api-error'
import { buildPreviewSnapshot } from '~/features/templates/demoSnapshot'

definePageMeta({ layout: false })

const route = useRoute()
const authStore = useAuthStore()
const resumeStore = useResumeStore()
const resumeService = useResumeService()
const pdfService = usePdfService()
const { ensureSession } = useGuestSession()
const { ensureDownloadAccess } = usePaymentEntitlements()
const { isDesktop, isMobileOrTablet } = useBreakpoints()
const { openMenu } = useMarketingMenuState()
const editorValidation = useResumeEditorValidation()

const loading = ref(true)
const pageError = ref('')
const accentColor = ref('#0051d5')
const pdfLoading = ref(false)
const pdfLoadingStep = ref(0)
const pdfError = ref('')
const previewOpen = ref(false)
const actionsOpen = ref(false)
const tourActive = ref(false)

const previousSavedDraft = ref<ResumeSnapshot | null>(null)

const previousDraftName = computed(() => {
  const snap = previousSavedDraft.value
  if (!snap) return ''
  const p = snap.personalInfo
  const name = [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim() || p?.fullName?.trim()
  return name || (snap.experiences?.length ? 'Dernier CV rédigé' : '')
})

function restorePreviousDraft() {
  if (previousSavedDraft.value) {
    resumeStore.loadSnapshot(previousSavedDraft.value)
    useAppToast().success(`Brouillon "${previousDraftName.value}" chargé dans l'éditeur !`)
  }
}

function handleResetToBlank() {
  if (import.meta.client && confirm('Voulez-vous effacer le formulaire pour repartir d\'un CV vierge ?')) {
    resumeStore.startNewDraft()
    clearPaymentDraftBackup()
    clearGuestDossierState()
    useAppToast().success('Formulaire réinitialisé à zéro !')
  }
}

const { pageCount, isOverflowing } = useResumePageOverflowState()

const accentColors = computed(() =>
  getCvAccentPalette(resumeStore.current?.templateSlug ?? 'PROFESSIONNEL'),
)

const resume = computed(() => resumeStore.current)
const templateName = computed(() => {
  const slug = resumeStore.current?.templateSlug
  if (!slug) return 'Modèle'
  return getTemplateBySlug(slug)?.name ?? 'Modèle'
})

const changeTemplateHref = computed(() => changeTemplateHrefFromRoute(route))

const previewResume = computed(() => {
  if (!resumeStore.current) return null
  return buildPreviewSnapshot(
    resumeStore.current.templateSlug,
    accentColor.value,
    resumeStore.current,
  )
})

async function persistToServer() {
  if (!authStore.isAuthenticated) return
  authStore.syncSession()
  if (!authStore.isAuthenticated) return

  const payload = resumeService.toSavePayload(currentSnapshot())
  const resumeId = resolvePersistableResumeId(
    (route.query.id as string | undefined) ?? resumeStore.savedResumeId ?? undefined,
  )
  const saved = resumeId
    ? await resumeService.update(resumeId, payload)
    : await resumeService.create(payload)
  resumeStore.markSaved(saved)
  if (!route.query.id && saved.id) {
    await navigateTo({ path: '/creer/editeur', query: { id: saved.id } }, { replace: true })
  }
}

const { statusLabel: autoSaveLabel } = useAutoSave({
  enabled: computed(() => !loading.value && Boolean(resumeStore.current)),
  isDirty: computed(() => resumeStore.isDirty),
  onSave: async () => {
    if (authStore.isAuthenticated) {
      await persistToServer()
    } else {
      resumeStore.markDraftSynced()
    }
  },
})

onMounted(async () => {
  try {
    authStore.loadFromStorage()

    // Lancement asynchrone non bloquant des vérifications réseau
    void syncGuestSessionForEditor().catch(() => {})
    void ensureSession().catch(() => {})

    const resumeId = resolvePersistableResumeId(route.query.id as string | undefined)

    if (resumeId) {
      if (!authStore.isAuthenticated) {
        await navigateTo('/connexion')
        return
      }
      try {
        const snapshot = await resumeService.getById(resumeId)
        resumeStore.loadSnapshot(snapshot)
      } catch {
        pageError.value = 'CV introuvable.'
        return
      }
    } else {
      const templateQuery = typeof route.query.template === 'string' ? route.query.template.toUpperCase() : ''
      const requestedSlug = (templateQuery && TEMPLATE_SLUGS.includes(templateQuery as TemplateSlug))
        ? (templateQuery as TemplateSlug)
        : (resumeStore.current?.templateSlug ?? 'PROFESSIONNEL')

      // Recherche du dernier brouillon rédigé dans le localStorage
      if (import.meta.client) {
        const backup = loadPaymentDraftBackup()
        if (backup?.kind === 'resume' && backup.snapshot) {
          previousSavedDraft.value = backup.snapshot
        } else {
          previousSavedDraft.value = findResumeSnapshotInStorage()
        }
      }

      function isResumeSnapshotValid(snap: any): boolean {
        if (!snap || typeof snap !== 'object') return false
        const p = snap.personalInfo || {}
        const hasName = Boolean((p.firstName || p.lastName || p.fullName)?.trim())
        const hasExp = Boolean(snap.experiences?.length)
        const hasSkills = Boolean(snap.skills?.length)
        const hasSummary = Boolean(snap.summary?.trim())
        return hasName || hasExp || hasSkills || hasSummary
      }

      // Déterminer intelligemment le mode d'ouverture :
      // 1. Clic explicite pour Créer un NOUVEAU CV vierge (new=1 / flow=new)
      const isExplicitNew = route.query.new === '1' || route.query.fresh === '1' || route.query.flow === 'new'
      // 2. Importation de document PDF/Word (imported=1 / flow=import)
      const isImport = (route.query.imported === '1' || route.query.flow === 'import') && !isExplicitNew
      // 3. Restauration du dernier brouillon (restore=1)
      const isExplicitRestore = route.query.restore === '1'

      if (isExplicitRestore && previousSavedDraft.value) {
        // Restauration explicite du brouillon précédent
        resumeStore.loadSnapshot(previousSavedDraft.value)
      } else if (isExplicitNew) {
        // Clic sur "Créer mon CV" de zéro -> OUVRIR UN FORMULAIRE 100% VIERGE SANS ANCIENNES DONNÉES
        resumeStore.startNewDraft()
        resumeStore.setTemplate(requestedSlug)
      } else if (isImport || (resumeStore.current && isResumeSnapshotValid(resumeStore.current))) {
        // Importation de document -> CONSERVER ET PRÉ-REMPLIR TOUTES LES DONNÉES EXTRAITES !
        if (requestedSlug) {
          resumeStore.setTemplate(requestedSlug)
        }
      } else {
        // Par défaut, nouveau formulaire vierge
        resumeStore.startNewDraft()
        resumeStore.setTemplate(requestedSlug)
      }
    }

    if (!resumeStore.current) {
      resumeStore.initDraft()
    }

    accentColor.value = resolveCvAccentColor(
      resumeStore.current?.templateSlug ?? 'PROFESSIONNEL',
      resumeStore.current?.templateConfig?.accentColor,
    )
  } catch (err) {
    console.error('Error mounting editeur:', err)
    if (!resumeStore.current) {
      resumeStore.initDraft()
    }
  } finally {
    loading.value = false
  }

  const autoOnboardingPref = localStorage.getItem('profiloz:settings:auto-onboarding')
  const isAutoOnboardingEnabled = autoOnboardingPref === null ? true : autoOnboardingPref === 'true'
  const tourCompleted = localStorage.getItem('profiloz:onboarding-completed')

  if (isAutoOnboardingEnabled && !tourCompleted) {
    setTimeout(() => {
      tourActive.value = true
    }, 800)
  }

  if (route.query.download === '1') {
    await nextTick()
    await downloadPdf()
    const { download: _removed, ...restQuery } = route.query
    await navigateTo({ path: route.path, query: restQuery }, { replace: true })
  }
})

watch(accentColor, (color) => {
  resumeStore.setTemplateConfig({ accentColor: color })
})

watch(
  () => resumeStore.current?.templateConfig?.accentColor,
  (color) => {
    if (color && color !== accentColor.value) {
      accentColor.value = color
    }
  }
)

watch(
  () => resumeStore.current?.templateSlug,
  (slug) => {
    if (!slug) return
    accentColor.value = resumeStore.current?.templateConfig.accentColor
      ?? resolveCvAccentColor(slug)
  },
)

function currentSnapshot() {
  return {
    ...resumeStore.current!,
    templateConfig: {
      ...resumeStore.current!.templateConfig,
      accentColor: accentColor.value,
    },
  }
}

const pdfLoadingMessage = computed(() => {
  const steps = MSG.pdf.steps
  return steps[Math.min(pdfLoadingStep.value, steps.length - 1)]
})

async function saveResume(silent = false) {
  const wasAuthenticated = authStore.isAuthenticated
  authStore.syncSession()
  if (!authStore.isAuthenticated) {
    await navigateTo({
      path: wasAuthenticated ? '/connexion' : '/inscription',
      query: { redirect: route.fullPath },
    })
    return false
  }

  try {
    await persistToServer()
    return true
  } catch (err) {
    if (!silent) {
      const problem = err as { status?: number; detail?: string; errors?: Array<{ message: string }> }
      if (problem.status === 401) {
        pdfError.value = MSG.auth.sessionExpired
        await navigateTo({ path: '/connexion', query: { redirect: route.fullPath } })
        return false
      }
      pdfError.value = problem.errors?.[0]?.message ?? problem.detail ?? MSG.save.error
    }
    return false
  }
}

const confirmModalOpen = ref(false)

function promptDownloadPdf() {
  pdfError.value = ''
  if (editorValidation && !editorValidation.validateAll()) {
    pdfError.value = MSG.validation.invalidData
    return
  }
  confirmModalOpen.value = true
}

function cancelConfirmModal() {
  confirmModalOpen.value = false
  previewOpen.value = false
}

async function confirmAndDownload() {
  confirmModalOpen.value = false
  previewOpen.value = false
  await executePdfDownload()
}

async function executePdfDownload() {
  pdfError.value = ''
  if (editorValidation && !editorValidation.validateAll()) {
    // validateAll annonce déjà l’erreur (banner + toast + scroll)
    pdfError.value = MSG.validation.invalidData
    return
  }
  let stepTimer: number | undefined
  try {
    pdfLoading.value = true
    pdfLoadingStep.value = 0

    restorePaidGuestSession()
    await syncGuestSessionForEditor()
    await ensureSession()

    if (!(await ensureDownloadAccess(route.fullPath))) return

    stepTimer = window.setInterval(() => {
      if (pdfLoadingStep.value < MSG.pdf.steps.length - 1) {
        pdfLoadingStep.value += 1
      }
    }, 1200)

    if (authStore.isAuthenticated) {
      const saved = await saveResume(true)
      if (!saved) return
      const resumeId = resolvePersistableResumeId(
        (route.query.id as string | undefined) ?? resumeStore.savedResumeId,
      )
      if (!resumeId) {
        pdfError.value = MSG.save.error
        useAppToast().error(MSG.save.error)
        return
      }
      const { filename } = await pdfService.downloadResumeCv(resumeId, currentSnapshot())
      await navigateTo({ path: '/creer/succes', query: { file: filename } })
      return
    }

    const { filename } = await pdfService.generateAndDownload(currentSnapshot())
    restorePaidGuestSession()
    ensurePaidGuestDossier('cv')
    markGuestDossierDownload('cv', currentSnapshot().id)
    saveLastDownloadContext({ kind: 'cv', filename, downloadedAt: new Date().toISOString() })
    await navigateTo({ path: '/creer/succes', query: { file: filename } })
  } catch (err) {
    if (isPaymentRequiredError(err)) {
      const dossier = loadGuestDossierState()
      const reason = (dossier?.cvDownloaded && dossier?.letterDownloaded) ? 'completed' : 'unlock'
      await navigateTo({
        path: '/tarifs',
        query: { reason, returnTo: route.fullPath },
      })
      return
    }
    pdfError.value = MSG.pdf.error
    useAppToast().error(MSG.pdf.error)
  } finally {
    if (stepTimer !== undefined) window.clearInterval(stepTimer)
    pdfLoading.value = false
  }
}
async function downloadPdf() {
  await executePdfDownload()
}
</script>

<template>
  <ClientOnly>
    <div class="editor-page-root min-h-screen">
    <!-- Skeleton Loader de l'éditeur de CV -->
    <div v-if="loading" class="h-screen flex flex-col overflow-hidden bg-background">
    <!-- Topbar skeleton -->
    <header class="flex items-center justify-between px-margin-mobile md:px-gutter py-2 bg-surface border-b border-outline-variant shrink-0 min-h-[3.25rem]">
      <div class="flex items-center gap-2">
        <UiSkeleton variant="circle" width="2rem" height="2rem" />
        <UiSkeleton variant="rect" width="6rem" height="1.25rem" class="rounded animate-pulse" />
      </div>
      <div class="flex items-center gap-2">
        <UiSkeleton variant="rect" width="8rem" height="2.25rem" class="rounded-xl animate-pulse" />
      </div>
    </header>

    <!-- Content skeleton -->
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      <!-- Form column -->
      <div class="flex flex-col overflow-y-auto p-4 md:p-6 border-r border-outline-variant space-y-6">
        <div class="space-y-3">
          <UiSkeleton variant="rect" width="40%" height="1.5rem" class="rounded animate-pulse" />
          <UiSkeleton variant="rect" width="90%" height="3rem" class="rounded-xl animate-pulse" />
        </div>
        <div class="space-y-4">
          <UiSkeleton variant="rect" width="30%" height="1.25rem" class="rounded animate-pulse" />
          <div class="grid grid-cols-2 gap-4">
            <UiSkeleton variant="rect" height="3.5rem" class="rounded-xl animate-pulse" />
            <UiSkeleton variant="rect" height="3.5rem" class="rounded-xl animate-pulse" />
          </div>
          <UiSkeleton variant="rect" height="3.5rem" class="rounded-xl animate-pulse" />
        </div>
        <div class="space-y-3">
          <UiSkeleton variant="rect" width="50%" height="1.25rem" class="rounded animate-pulse" />
          <UiSkeleton variant="rect" height="8rem" class="rounded-xl animate-pulse" />
        </div>
      </div>

      <!-- Preview column (Hidden on mobile) -->
      <div class="hidden lg:flex flex-col items-center justify-center p-8 bg-surface-container-lowest overflow-y-auto">
        <div class="w-full max-w-[21cm] aspect-[1/1.414] bg-white rounded-xl shadow-lg border border-outline-variant/30 p-12 space-y-6">
          <div class="flex items-center gap-4">
            <UiSkeleton variant="circle" width="5rem" height="5rem" class="animate-pulse" />
            <div class="space-y-2 flex-1">
              <UiSkeleton variant="rect" width="60%" height="2rem" class="rounded animate-pulse" />
              <UiSkeleton variant="rect" width="40%" height="1.25rem" class="rounded animate-pulse" />
            </div>
          </div>
          <hr class="border-outline-variant/30" />
          <div class="space-y-4">
            <UiSkeleton variant="rect" width="30%" height="1.5rem" class="rounded animate-pulse" />
            <UiSkeleton variant="text" :lines="4" class="animate-pulse" />
          </div>
          <div class="space-y-4">
            <UiSkeleton variant="rect" width="40%" height="1.5rem" class="rounded animate-pulse" />
            <UiSkeleton variant="text" :lines="3" class="animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="pageError" class="h-screen flex flex-col items-center justify-center gap-4 p-margin-mobile max-w-md w-full">
    <UiMessageBanner variant="error" :message="pageError" />
    <NuxtLink to="/tableau-de-bord">
      <UiButton variant="secondary">{{ MSG.confirm.back }}</UiButton>
    </NuxtLink>
  </div>

  <div v-else class="h-screen flex flex-col overflow-hidden bg-background">
    <!-- Header compact mobile-first -->
    <header class="grid grid-cols-[minmax(0,1fr)_auto] items-center px-margin-mobile md:px-gutter py-2 bg-surface border-b border-outline-variant shrink-0 gap-2 min-h-[3.25rem]">
      <div class="flex items-center gap-2 min-w-0">
        <UiAppLogo size="sm" variant="full" class="shrink-0 [&_img]:h-8" />
      </div>

      <div class="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          class="lg:hidden touch-target inline-flex items-center justify-center rounded-xl text-on-surface hover:bg-surface-container"
          aria-label="Menu"
          @click="openMenu($event.currentTarget as HTMLElement)"
        >
          <UiPzIcon name="menu" class="text-[22px]" />
        </button>

        <LayoutAuthStatus icon-only :show-guest-badge="false" class="lg:hidden" />

        <button
          type="button"
          class="lg:hidden touch-target inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container"
          aria-label="Options du CV"
          @click="actionsOpen = true"
        >
          <UiPzIcon name="tune" class="text-[22px]" />
        </button>

        <LayoutAuthStatus compact class="hidden lg:flex" />

        <button
          type="button"
          class="hidden sm:inline-flex text-sm text-on-surface-variant hover:text-secondary px-2 min-h-11 items-center gap-1 mr-1 font-semibold"
          @click="tourActive = true"
        >
          <UiPzIcon name="help_outline" class="text-[18px]" />
          Guide
        </button>

        <!-- Bouton Reprendre le dernier brouillon rédigé -->
        <button
          v-if="previousSavedDraft && previousDraftName"
          type="button"
          class="hidden sm:inline-flex text-xs font-extrabold text-[#2F5BFF] hover:text-blue-700 px-3 py-1.5 min-h-9 items-center gap-1.5 mr-2 bg-[#EEF4FF] hover:bg-blue-100 rounded-xl transition-all border border-[#2F5BFF]/30 cursor-pointer shadow-sm"
          :title="`Charger le brouillon de ${previousDraftName}`"
          @click="restorePreviousDraft"
        >
          <UiPzIcon name="restore" class="text-[16px]" />
          <span>Reprendre : {{ previousDraftName }}</span>
        </button>

        <!-- Bouton Vider/Réinitialiser si le formulaire contient déjà du texte -->
        <button
          v-else-if="resumeStore.current?.personalInfo?.fullName?.trim() || resumeStore.current?.experiences?.length"
          type="button"
          class="hidden sm:inline-flex text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 min-h-9 items-center gap-1 mr-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300/60 cursor-pointer"
          title="Réinitialiser à zéro"
          @click="handleResetToBlank"
        >
          <UiPzIcon name="delete_sweep" class="text-[16px]" />
          <span>Effacer</span>
        </button>

        <NuxtLink
          id="tour-template-selector"
          :to="changeTemplateHref"
          class="hidden xl:inline-flex text-sm text-on-surface-variant hover:text-secondary px-2 min-h-11 items-center gap-1"
        >
          <UiPzIcon name="dashboard_customize" class="text-[18px]" />
          {{ templateName }}
        </NuxtLink>
        <div id="tour-color-picker" class="hidden lg:flex gap-1">
          <button
            v-for="color in accentColors"
            :key="color"
            type="button"
            class="w-7 h-7 rounded-full ring-2 ring-offset-1"
            :class="accentColor === color ? 'ring-secondary' : 'ring-transparent'"
            :style="{ backgroundColor: color }"
            :aria-label="`Couleur ${color}`"
            @click="accentColor = color"
          />
        </div>

        <UiButton
          id="tour-download-btn"
          variant="secondary"
          size="sm"
          class="!hidden xl:!inline-flex"
          icon="download"
          :loading="pdfLoading"
          @click="promptDownloadPdf"
        >
          {{ MSG.buttons.downloadPdf }}
        </UiButton>
      </div>
    </header>

    <Transition name="form-field__error">
      <UiMessageBanner
        v-if="pdfError"
        variant="error"
        :message="pdfError"
        class="mx-margin-mobile md:mx-margin-tablet xl:mx-gutter mt-2 mb-1 shrink-0"
      />
    </Transition>

    <!-- Contenu : formulaire seul sur mobile, split sur desktop -->
    <main class="flex-1 flex overflow-hidden pb-[4.5rem] xl:pb-0">
      <div class="w-full xl:w-[42%] shrink-0 border-r border-outline-variant overflow-hidden">
        <FeatureEditorFormPanel />
      </div>

      <div id="tour-preview-panel" v-if="isDesktop" class="flex-1 overflow-hidden min-w-0 hidden xl:block">
        <FeatureEditorPreviewPanel v-if="previewResume" :resume="previewResume" />
      </div>
    </main>

    <!-- Mobile & tablette : barre d'actions sticky -->
    <UiStickyActionBar v-if="isMobileOrTablet">
      <div class="flex gap-2">
        <UiButton
          :variant="previewOpen ? 'outline' : (isOverflowing ? 'danger' : 'outline')"
          block
          :icon="previewOpen ? 'edit' : 'visibility'"
          @click="previewOpen = !previewOpen"
        >
          <span v-if="previewOpen">✏️ Revenir à la saisie</span>
          <span v-else-if="isOverflowing">Aperçu ({{ pageCount }} pages ⚠️)</span>
          <span v-else>Aperçu (1 page A4)</span>
        </UiButton>
        <UiButton variant="secondary" block icon="download" :loading="pdfLoading" @click="promptDownloadPdf">
          {{ MSG.buttons.downloadPdf }}
        </UiButton>
      </div>
    </UiStickyActionBar>

    <!-- Mobile : aperçu plein écran -->
    <UiFullScreenSheet v-model:open="previewOpen" title="Aperçu du CV">
      <FeatureEditorPreviewPanel v-if="previewResume" :resume="previewResume" />
      <template #footer>
        <div class="grid grid-cols-2 gap-3 w-full">
          <UiButton variant="outline" block icon="edit" @click="previewOpen = false">
            ✏️ Revenir à la saisie
          </UiButton>
          <UiButton variant="secondary" block icon="download" :loading="pdfLoading" @click="promptDownloadPdf">
            📥 Télécharger mon PDF
          </UiButton>
        </div>
      </template>
    </UiFullScreenSheet>

    <!-- Modal de confirmation avant téléchargement CV -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="confirmModalOpen"
          class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          @click.self="cancelConfirmModal"
        >
          <div class="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5 text-center">
            <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl font-black">
              📄
            </div>

            <div class="space-y-1.5">
              <h3 class="text-lg font-black text-slate-900 leading-snug">
                Prêt à télécharger votre CV ?
              </h3>
              <p class="text-xs text-slate-500 leading-relaxed">
                Votre document est prêt. Vérifiez une dernière fois sa longueur avant de générer le fichier PDF final.
              </p>
            </div>

            <!-- Badges de statut du CV -->
            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-left text-xs">
              <div class="flex items-center justify-between">
                <span class="text-slate-500 font-medium">Format de page</span>
                <span
                  class="font-extrabold px-2.5 py-0.5 rounded-full text-[11px]"
                  :class="isOverflowing ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'"
                >
                  {{ isOverflowing ? `⚠️ ${pageCount} pages A4` : '🟢 1 page A4 (Parfait)' }}
                </span>
              </div>
              <div class="flex items-center justify-between border-t border-slate-200/60 pt-2">
                <span class="text-slate-500 font-medium">Qualité & Compatibilité</span>
                <span class="font-extrabold text-blue-600 flex items-center gap-1">
                  <UiPzIcon name="verified" class="text-sm" /> 100% Compatible ATS
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                class="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer touch-manipulation"
                @click="cancelConfirmModal"
              >
                Vérifier encore
              </button>

              <button
                type="button"
                class="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
                @click="confirmAndDownload"
              >
                <span>Lancer le PDF</span>
                <UiPzIcon name="arrow_forward" class="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Mobile : options plein écran -->
    <UiFullScreenSheet v-model:open="actionsOpen" title="Options">
      <div class="px-margin-mobile py-4 space-y-1 bg-surface min-h-full">
        <NuxtLink
          :to="changeTemplateHref"
          class="flex items-center min-h-11 px-3 rounded-xl text-sm text-on-surface hover:bg-surface-container"
          @click="actionsOpen = false"
        >
          <UiPzIcon name="dashboard_customize" class="mr-3 text-secondary" />
          Modèle · {{ templateName }}
        </NuxtLink>

        <button
          type="button"
          class="w-full flex items-center min-h-11 px-3 rounded-xl text-sm text-on-surface hover:bg-surface-container text-left"
          @click="actionsOpen = false; tourActive = true"
        >
          <UiPzIcon name="help_outline" class="mr-3 text-secondary" />
          Guide interactif
        </button>

        <button
          v-if="previousSavedDraft && previousDraftName"
          type="button"
          class="w-full flex items-center min-h-11 px-3 rounded-xl text-sm text-[#2F5BFF] font-extrabold hover:bg-blue-50 text-left"
          @click="actionsOpen = false; restorePreviousDraft()"
        >
          <UiPzIcon name="restore" class="mr-3 text-[#2F5BFF]" />
          Reprendre : {{ previousDraftName }}
        </button>

        <button
          v-else-if="resumeStore.current?.personalInfo?.fullName?.trim() || resumeStore.current?.experiences?.length"
          type="button"
          class="w-full flex items-center min-h-11 px-3 rounded-xl text-sm text-slate-700 font-semibold hover:bg-slate-100 text-left"
          @click="actionsOpen = false; handleResetToBlank()"
        >
          <UiPzIcon name="delete_sweep" class="mr-3 text-slate-500" />
          Effacer et recommencer à zéro
        </button>

        <div class="px-3 py-4 border-t border-outline-variant/30 mt-2">
          <p class="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-3">Couleur d'accent</p>
          <div class="flex flex-wrap gap-3">
            <button
              v-for="color in accentColors"
              :key="color"
              type="button"
              class="w-11 h-11 rounded-full ring-2 ring-offset-2"
              :class="accentColor === color ? 'ring-secondary' : 'ring-transparent'"
              :style="{ backgroundColor: color }"
              :aria-label="`Couleur ${color}`"
              @click="accentColor = color"
            />
          </div>
        </div>

        <div
          v-if="!authStore.isAuthenticated"
          class="px-3 py-4 border-t border-outline-variant/30"
        >
          <NuxtLink
            :to="{ path: '/connexion', query: { redirect: route.fullPath } }"
            class="flex items-center min-h-11 px-3 rounded-xl text-sm text-secondary font-semibold hover:bg-surface-container"
            @click="actionsOpen = false"
          >
            <UiPzIcon name="login" class="mr-3" />
            Se connecter pour sauvegarder
          </NuxtLink>
        </div>
      </div>
      <template #footer>
        <UiButton variant="outline" block @click="actionsOpen = false">
          Fermer
        </UiButton>
      </template>
    </UiFullScreenSheet>

    <LayoutGuestFlowDrawer />
    <EditorOnboardingTour v-model="tourActive" />

    <!-- Chargement PDF narratif -->
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
  </div>
  </ClientOnly>
</template>
