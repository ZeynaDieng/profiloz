<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import { getTemplateBySlug } from '~/features/templates/registry'
import { getCvAccentPalette, resolveCvAccentColor } from '~/utils/template-accent-colors'
import { ensurePaidGuestDossier, markGuestDossierDownload, restorePaidGuestSession } from '~/utils/guest-dossier-state'
import { changeTemplateHrefFromRoute } from '~/utils/template-navigation'
import { resolvePersistableResumeId } from '~/utils/resume-id'
import { clearPaymentDraftBackup } from '~/utils/payment-draft-backup'
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
  clearPaymentDraftBackup()
  authStore.loadFromStorage()
  await syncGuestSessionForEditor()
  await ensureSession().catch(() => {})

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
      loading.value = false
      return
    }
  } else {
    resumeStore.initDraft()
    if (!resumeStore.current?.personalInfo.fullName) {
      await navigateTo('/creer/assistant/informations')
      return
    }
  }

  accentColor.value = resolveCvAccentColor(
    resumeStore.current?.templateSlug ?? 'PROFESSIONNEL',
    resumeStore.current?.templateConfig.accentColor,
  )
  loading.value = false

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

async function downloadPdf() {
  pdfError.value = ''
  if (editorValidation && !editorValidation.validateAll()) {
    // validateAll annonce déjà l’erreur (banner + toast + scroll)
    pdfError.value = MSG.validation.invalidData
    return
  }
  pdfLoading.value = true
  pdfLoadingStep.value = 0
  const stepTimer = window.setInterval(() => {
    if (pdfLoadingStep.value < MSG.pdf.steps.length - 1) {
      pdfLoadingStep.value += 1
    }
  }, 1200)
  try {
    restorePaidGuestSession()
    await syncGuestSessionForEditor()
    await ensureSession()

    if (!(await ensureDownloadAccess(route.fullPath))) return

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
    const problem = err as { status?: number }
    if (problem.status === 402) {
      await navigateTo({
        path: '/tarifs',
        query: { reason: 'unlock', returnTo: route.fullPath },
      })
      return
    }
    pdfError.value = MSG.pdf.error
    useAppToast().error(MSG.pdf.error)
  } finally {
    window.clearInterval(stepTimer)
    pdfLoading.value = false
  }
}
</script>

<template>
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

  <div v-else-if="resume && previewResume" class="h-screen flex flex-col overflow-hidden bg-background">
    <!-- Header compact mobile-first -->
    <header class="grid grid-cols-[minmax(0,1fr)_auto] items-center px-margin-mobile md:px-gutter py-2 bg-surface border-b border-outline-variant shrink-0 gap-2 min-h-[3.25rem]">
      <div class="flex items-center gap-2 min-w-0">
        <UiAppLogo size="sm" class="shrink-0 [&_img]:h-8" />
        <span class="text-on-surface-variant text-sm truncate hidden lg:inline">{{ resume.title }}</span>
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

        <LayoutAuthStatus icon-only show-guest-badge="false" class="lg:hidden" />

        <button
          type="button"
          class="lg:hidden touch-target inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container"
          aria-label="Options du CV"
          @click="actionsOpen = true"
        >
          <UiPzIcon name="tune" class="text-[22px]" />
        </button>

        <LayoutAuthStatus compact class="hidden lg:flex" />

        <NuxtLink
          :to="changeTemplateHref"
          class="hidden xl:inline-flex text-sm text-on-surface-variant hover:text-secondary px-2 min-h-11 items-center gap-1"
        >
          <UiPzIcon name="dashboard_customize" class="text-[18px]" />
          {{ templateName }}
        </NuxtLink>
        <div class="hidden lg:flex gap-1">
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
          variant="secondary"
          size="sm"
          class="hidden xl:inline-flex"
          icon="download"
          :loading="pdfLoading"
          @click="downloadPdf"
        >
          {{ MSG.buttons.downloadPdf }}
        </UiButton>
      </div>
    </header>

    <p v-if="autoSaveLabel" class="hidden lg:block text-xs text-secondary text-right px-gutter -mt-1 pb-1 truncate">
      {{ autoSaveLabel }}
    </p>

    <Transition name="form-field__error">
      <UiMessageBanner
        v-if="pdfError"
        variant="error"
        :message="pdfError"
        class="mx-margin-mobile md:mx-margin-tablet xl:mx-gutter mt-2 mb-1 shrink-0"
      />
    </Transition>

    <!-- Status bar mobile -->
    <div
      v-if="autoSaveLabel"
      class="lg:hidden px-margin-mobile py-2 bg-surface border-b border-outline-variant"
    >
      <UiMessageBanner
        variant="info"
        :message="autoSaveLabel"
      />
    </div>

    <!-- Contenu : formulaire seul sur mobile, split sur desktop -->
    <main class="flex-1 flex overflow-hidden pb-[4.5rem] xl:pb-0">
      <div class="w-full xl:w-[42%] shrink-0 border-r border-outline-variant overflow-hidden">
        <FeatureEditorFormPanel />
      </div>

      <div v-if="isDesktop" class="flex-1 overflow-hidden min-w-0 hidden xl:block">
        <FeatureEditorPreviewPanel :resume="previewResume" />
      </div>
    </main>

    <!-- Mobile & tablette : barre d'actions sticky -->
    <UiStickyActionBar v-if="isMobileOrTablet">
      <div class="flex gap-2">
        <UiButton variant="outline" block icon="visibility" @click="previewOpen = true">
          Aperçu
        </UiButton>
        <UiButton variant="secondary" block icon="download" :loading="pdfLoading" @click="downloadPdf">
          {{ MSG.buttons.downloadPdf }}
        </UiButton>
      </div>
    </UiStickyActionBar>

    <!-- Mobile : aperçu plein écran -->
    <UiFullScreenSheet v-model:open="previewOpen" title="Aperçu du CV">
      <FeatureEditorPreviewPanel :resume="previewResume" />
      <template #footer>
        <UiButton variant="secondary" block @click="previewOpen = false">
          Retour à l'édition
        </UiButton>
      </template>
    </UiFullScreenSheet>

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
</template>
