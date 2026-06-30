<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import { getTemplateBySlug } from '~/features/templates/registry'
import { alignGuestSessionFromStoredDrafts } from '~/utils/guest-draft-sync'

definePageMeta({ layout: false })

const route = useRoute()
const authStore = useAuthStore()
const resumeStore = useResumeStore()
const resumeService = useResumeService()
const pdfService = usePdfService()
const paymentService = usePaymentService()
const { ensureSession } = useGuestSession()
const { isDesktop } = useBreakpoints()

const loading = ref(true)
const pageError = ref('')
const accentColor = ref('#0051d5')
const pdfLoading = ref(false)
const pdfLoadingStep = ref(0)
const pdfError = ref('')
const previewOpen = ref(false)
const actionsOpen = ref(false)
const accentColors = ['#0051d5', '#0F172A', '#10B981', '#F43F5E'] as const

const resume = computed(() => resumeStore.current)
const templateName = computed(() => {
  const slug = resumeStore.current?.templateSlug
  if (!slug) return 'Modèle'
  return getTemplateBySlug(slug)?.name ?? 'Modèle'
})

const previewResume = computed(() => {
  if (!resumeStore.current) return null
  return {
    ...resumeStore.current,
    templateConfig: {
      ...resumeStore.current.templateConfig,
      accentColor: accentColor.value,
    },
  }
})

async function persistToServer() {
  if (!authStore.isAuthenticated) return
  authStore.syncSession()
  if (!authStore.isAuthenticated) return

  const payload = resumeService.toSavePayload(currentSnapshot())
  const resumeId = (route.query.id as string | undefined) ?? resumeStore.savedResumeId ?? undefined
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
  authStore.loadFromStorage()
  alignGuestSessionFromStoredDrafts()
  await ensureSession().catch(() => {})

  const resumeId = route.query.id as string | undefined

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

  accentColor.value = resumeStore.current?.templateConfig.accentColor ?? '#0051d5'
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
  pdfLoading.value = true
  pdfLoadingStep.value = 0
  const stepTimer = window.setInterval(() => {
    if (pdfLoadingStep.value < MSG.pdf.steps.length - 1) {
      pdfLoadingStep.value += 1
    }
  }, 1200)
  try {
    await ensureSession()

    if (authStore.isAuthenticated) {
      const saved = await saveResume(true)
      if (!saved) return
      const resumeId = (route.query.id as string | undefined) ?? resumeStore.savedResumeId
      if (!resumeId) {
        pdfError.value = MSG.save.error
        return
      }
      const { filename } = await pdfService.downloadResumeCv(resumeId, currentSnapshot())
      await navigateTo({ path: '/creer/succes', query: { file: filename } })
      return
    }

    try {
      const entitlements = await paymentService.getEntitlements()
      if (!entitlements.unlimitedActive && entitlements.creditsBalance <= 0) {
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

    const { filename } = await pdfService.generateAndDownload(currentSnapshot())
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

  <div v-else-if="pageError" class="h-screen flex flex-col items-center justify-center gap-4 p-margin-mobile max-w-md w-full">
    <UiMessageBanner variant="error" :message="pageError" />
    <NuxtLink to="/tableau-de-bord">
      <UiButton variant="secondary">{{ MSG.confirm.back }}</UiButton>
    </NuxtLink>
  </div>

  <div v-else-if="resume && previewResume" class="h-screen flex flex-col overflow-hidden bg-background">
    <!-- Header compact mobile-first -->
    <header class="flex justify-between items-center px-margin-mobile md:px-gutter py-2.5 bg-surface border-b border-outline-variant shrink-0 gap-2">
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <UiAppLogo size="sm" class="shrink-0 [&_img]:h-8" />
        <span class="text-on-surface-variant text-sm truncate hidden min-[360px]:inline">{{ resume.title }}</span>
      </div>

      <p v-if="autoSaveLabel" class="text-xs text-secondary hidden lg:block truncate max-w-[280px]">
        {{ autoSaveLabel }}
      </p>

      <div class="flex items-center gap-1 shrink-0">
        <LayoutAuthStatus icon-only class="lg:hidden" />
        <LayoutAuthStatus compact class="hidden lg:flex" />

        <!-- Desktop actions -->
        <NuxtLink to="/creer/modele" class="hidden xl:inline-flex text-sm text-on-surface-variant hover:text-secondary px-2 min-h-11 items-center">
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

        <!-- Mobile : menu options -->
        <button
          type="button"
          class="lg:hidden touch-target inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container"
          aria-label="Plus d'actions"
          @click="actionsOpen = true"
        >
          <UiPzIcon name="tune" />
        </button>

        <!-- Desktop PDF -->
        <UiButton
          variant="secondary"
          size="sm"
          class="hidden md:inline-flex"
          icon="download"
          :loading="pdfLoading"
          @click="downloadPdf"
        >
          {{ MSG.buttons.downloadPdf }}
        </UiButton>
      </div>
    </header>

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
    <main class="flex-1 flex overflow-hidden pb-[4.5rem] md:pb-0">
      <div class="w-full xl:w-[42%] shrink-0 border-r border-outline-variant overflow-hidden">
        <FeatureEditorFormPanel />
      </div>

      <div v-if="isDesktop" class="flex-1 overflow-hidden min-w-0 hidden xl:block">
        <FeatureEditorPreviewPanel :resume="previewResume" />
      </div>
    </main>

    <!-- Mobile : barre d'actions sticky -->
    <UiStickyActionBar class="md:hidden">
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

    <!-- Mobile : drawer actions -->
    <UDrawer
      v-model:open="actionsOpen"
      direction="bottom"
      :ui="{ content: 'rounded-t-2xl px-margin-mobile pb-[max(1rem,env(safe-area-inset-bottom))]' }"
    >
      <template #content>
        <div class="py-4 space-y-1">
          <p class="text-xs font-bold uppercase tracking-wide text-on-surface-variant px-2 mb-2">Options</p>
          <NuxtLink
            to="/creer/modele"
            class="flex items-center min-h-11 px-3 rounded-xl text-sm text-on-surface hover:bg-surface-container"
            @click="actionsOpen = false"
          >
            <UiPzIcon name="dashboard_customize" class="mr-3" />
            Modèle · {{ templateName }}
          </NuxtLink>
          <div class="px-3 py-3 border-t border-outline-variant/30 mt-2">
            <p class="text-xs text-on-surface-variant mb-3">Couleur d'accent</p>
            <div class="flex gap-3">
              <button
                v-for="color in accentColors"
                :key="color"
                type="button"
                class="w-10 h-10 rounded-full ring-2 ring-offset-2"
                :class="accentColor === color ? 'ring-secondary' : 'ring-transparent'"
                :style="{ backgroundColor: color }"
                @click="accentColor = color"
              />
            </div>
          </div>
        </div>
      </template>
    </UDrawer>

    <UiMessageBanner
      v-if="pdfError"
      variant="error"
      :message="pdfError"
      class="rounded-none border-x-0 border-b-0"
    />

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
