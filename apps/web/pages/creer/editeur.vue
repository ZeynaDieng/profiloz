<script setup lang="ts">
import { getTemplateBySlug } from '~/features/templates/registry'

definePageMeta({ layout: false })

const route = useRoute()
const authStore = useAuthStore()
const resumeStore = useResumeStore()
const resumeService = useResumeService()
const pdfService = usePdfService()

const loading = ref(true)
const pageError = ref('')
const accentColor = ref('#0051d5')
const pdfLoading = ref(false)
const pdfError = ref('')
const saveLoading = ref(false)
const saveMessage = ref('')
const showMobilePreview = ref(false)
const showMobileActions = ref(false)
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

async function saveResume() {
  saveMessage.value = ''
  const wasAuthenticated = authStore.isAuthenticated
  authStore.syncSession()
  if (!authStore.isAuthenticated) {
    await navigateTo({
      path: wasAuthenticated ? '/connexion' : '/inscription',
      query: { redirect: route.fullPath },
    })
    return
  }

  saveLoading.value = true
  try {
    await persistToServer()
    saveMessage.value = 'Enregistré'
  } catch (err) {
    const problem = err as { status?: number; detail?: string; errors?: Array<{ message: string }> }
    if (problem.status === 401) {
      saveMessage.value = 'Session expirée — reconnectez-vous'
      await navigateTo({ path: '/connexion', query: { redirect: route.fullPath } })
      return
    }
    saveMessage.value = problem.errors?.[0]?.message ?? problem.detail ?? 'Erreur de sauvegarde'
  } finally {
    saveLoading.value = false
  }
}

async function downloadPdf() {
  pdfError.value = ''
  pdfLoading.value = true
  try {
    if (authStore.isAuthenticated && resumeStore.isDirty) {
      await saveResume()
    }
    await pdfService.generateAndDownload(currentSnapshot())
    await navigateTo('/creer/succes')
  } catch {
    pdfError.value = 'Impossible de générer le PDF. Réessayez dans un instant.'
  } finally {
    pdfLoading.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="h-screen flex items-center justify-center text-on-surface-variant">
    Chargement de l'éditeur...
  </div>

  <div v-else-if="pageError" class="h-screen flex flex-col items-center justify-center gap-4">
    <p class="text-error">{{ pageError }}</p>
    <NuxtLink to="/tableau-de-bord" class="text-secondary font-bold hover:underline">Retour au tableau de bord</NuxtLink>
  </div>

  <div v-else-if="resume && previewResume" class="h-screen flex flex-col overflow-hidden bg-background">
    <header class="relative flex justify-between items-center px-margin-mobile md:px-gutter py-3 bg-surface border-b border-outline-variant shrink-0 gap-2">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <UiAppLogo size="sm" class="shrink-0" />
        <span class="text-on-surface-variant text-sm truncate">{{ resume.title }}</span>
      </div>

      <p v-if="autoSaveLabel" class="text-xs text-secondary hidden md:block truncate max-w-[280px]">
        {{ autoSaveLabel }}
      </p>

      <div class="flex items-center gap-1 sm:gap-2 shrink-0">
        <p v-if="saveMessage" class="text-sm hidden lg:block" :class="saveMessage === 'Enregistré' ? 'text-secondary' : 'text-error'">
          {{ saveMessage }}
        </p>
        <button
          type="button"
          class="lg:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
          :aria-label="showMobilePreview ? 'Modifier le contenu' : 'Voir l’aperçu'"
          @click="showMobilePreview = !showMobilePreview"
        >
          <UiPzIcon :name="showMobilePreview ? 'edit' : 'visibility'" />
        </button>
        <button
          type="button"
          class="md:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
          aria-label="Plus d’actions"
          @click="showMobileActions = !showMobileActions"
        >
          <UiPzIcon name="more_vert" />
        </button>
        <NuxtLink to="/creer/modele" class="hidden md:inline-flex text-sm text-on-surface-variant hover:text-secondary px-2 min-h-11 items-center">
          {{ templateName }}
        </NuxtLink>
        <div class="hidden sm:flex gap-1">
          <button
            v-for="color in accentColors"
            :key="color"
            type="button"
            class="w-8 h-8 sm:w-6 sm:h-6 rounded-full ring-2 ring-offset-1"
            :class="accentColor === color ? 'ring-secondary' : 'ring-transparent'"
            :style="{ backgroundColor: color }"
            :aria-label="`Couleur ${color}`"
            @click="accentColor = color"
          />
        </div>
        <button
          type="button"
          class="hidden sm:inline-flex min-h-11 px-3 py-2 text-sm text-on-surface-variant hover:text-secondary items-center"
          :disabled="saveLoading"
          @click="saveResume"
        >
          {{ saveLoading ? '…' : 'Enregistrer' }}
        </button>
        <button
          type="button"
          class="min-h-11 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-secondary text-white rounded-lg font-bold text-sm disabled:opacity-60"
          :disabled="pdfLoading"
          :aria-label="pdfLoading ? 'Génération du PDF' : 'Télécharger le PDF'"
          @click="downloadPdf"
        >
          <UiPzIcon name="download" />
          <span class="hidden sm:inline">{{ pdfLoading ? '…' : 'Télécharger' }}</span>
        </button>
      </div>

      <div
        v-if="showMobileActions"
        class="md:hidden absolute top-full right-4 mt-1 w-56 rounded-xl border border-outline-variant bg-surface shadow-lg z-50 py-2"
      >
        <NuxtLink
          to="/creer/modele"
          class="flex items-center min-h-11 px-4 text-sm text-on-surface hover:bg-surface-container"
          @click="showMobileActions = false"
        >
          Modèle · {{ templateName }}
        </NuxtLink>
        <button
          type="button"
          class="w-full flex items-center min-h-11 px-4 text-sm text-on-surface hover:bg-surface-container"
          :disabled="saveLoading"
          @click="showMobileActions = false; saveResume()"
        >
          {{ saveLoading ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
        <div class="px-4 py-2 border-t border-outline-variant/30">
          <p class="text-xs text-on-surface-variant mb-2">Couleur d’accent</p>
          <div class="flex gap-2">
            <button
              v-for="color in accentColors"
              :key="color"
              type="button"
              class="w-9 h-9 rounded-full ring-2 ring-offset-1"
              :class="accentColor === color ? 'ring-secondary' : 'ring-transparent'"
              :style="{ backgroundColor: color }"
              @click="accentColor = color"
            />
          </div>
        </div>
      </div>
    </header>

    <p v-if="autoSaveLabel || saveMessage" class="text-xs px-margin-mobile md:px-gutter py-1.5 md:hidden bg-surface border-b border-outline-variant flex flex-wrap gap-x-2">
      <span v-if="autoSaveLabel" class="text-secondary">{{ autoSaveLabel }}</span>
      <span v-if="saveMessage" :class="saveMessage === 'Enregistré' ? 'text-secondary' : 'text-error'">{{ saveMessage }}</span>
    </p>

    <main class="flex-1 flex overflow-hidden">
      <div
        class="w-full lg:w-[42%] xl:w-[38%] shrink-0 border-r border-outline-variant overflow-hidden"
        :class="showMobilePreview ? 'hidden lg:block' : 'block'"
      >
        <FeatureEditorFormPanel />
      </div>

      <div
        class="flex-1 overflow-hidden min-w-0"
        :class="showMobilePreview ? 'block' : 'hidden lg:block'"
      >
        <FeatureEditorPreviewPanel :resume="previewResume" />
      </div>
    </main>

    <p v-if="pdfError" class="text-error text-sm text-center py-2 bg-surface border-t border-outline-variant">
      {{ pdfError }}
    </p>
  </div>
</template>
