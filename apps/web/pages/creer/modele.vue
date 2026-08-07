<script setup lang="ts">
import type { TemplateSlug } from '@profiloz/shared'
import { MSG, TEMPLATE_SLUGS } from '@profiloz/shared'
import { TEMPLATE_FILTERS, TEMPLATE_REGISTRY } from '~/features/templates/registry'
import { resolveTemplatePickerReturn } from '~/utils/template-navigation'

definePageMeta({ layout: 'wizard', wizardFooter: true })

useGuestSession()
const resumeStore = useResumeStore()
const route = useRoute()
const { goNext } = useWizardNavigation()
const formError = ref('')
const toast = useAppToast()

const returnPath = computed(() => resolveTemplatePickerReturn(route))

onMounted(() => {
  if (route.query.new === '1' || route.query.fresh === '1') {
    resumeStore.startNewDraft()
    clearPaymentDraftBackup()
  } else if (!resumeStore.current) {
    resumeStore.rehydrateFromStorage()
  }
  resumeStore.initDraft()

  const select = typeof route.query.select === 'string' ? route.query.select.toUpperCase() : ''
  const template = typeof route.query.template === 'string' ? route.query.template.toUpperCase() : ''
  const slug = (select || template) as TemplateSlug
  if (slug && TEMPLATE_SLUGS.includes(slug as TemplateSlug)) {
    selectedSlug.value = slug as TemplateSlug
    resumeStore.setTemplate(slug as TemplateSlug)
  } else if (!selectedSlug.value && resumeStore.current?.templateSlug) {
    selectedSlug.value = resumeStore.current.templateSlug
  }
  if (selectedSlug.value) {
    resumeStore.setTemplate(selectedSlug.value)
  }
})

const activeFilter = ref('all')
const selectedSlug = ref<TemplateSlug | null>(
  (route.query.select as TemplateSlug) ?? resumeStore.current?.templateSlug ?? 'PROFESSIONNEL',
)

const authStore = useAuthStore()

// Pour les utilisateurs invités (sans compte), afficher TOUJOURS le fallback démo Aminata Diallo.
// Seuls les utilisateurs connectés à un compte peuvent prévisualiser leurs propres données sur les cartes.
const userSnapshotForPreview = computed(() => {
  if (!authStore.isAuthenticated) {
    return null
  }
  return resumeStore.current
})

const activeDraftName = computed(() => {
  if (!authStore.isAuthenticated) return ''
  const p = resumeStore.current?.personalInfo
  const name = [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim() || p?.fullName?.trim()
  if (name) return name
  if (resumeStore.current?.experiences?.length || resumeStore.current?.skills?.length) return 'CV en cours'
  return ''
})

function startFreshDraft() {
  resumeStore.startNewDraft()
  clearPaymentDraftBackup()
  clearGuestDossierState()
  toast.success('Nouveau CV vierge réinitialisé !')
}

const filteredTemplates = computed(() => {
  if (activeFilter.value === 'all') return TEMPLATE_REGISTRY
  return TEMPLATE_REGISTRY.filter((t) => t.category === activeFilter.value)
})

function selectTemplate(slug: TemplateSlug) {
  selectedSlug.value = slug
  resumeStore.setTemplate(slug)
}

function onContinue() {
  formError.value = ''
  if (!selectedSlug.value) {
    formError.value = MSG.wizard.chooseTemplate
    toast.error(MSG.wizard.chooseTemplate)
    nextTick(() => {
      document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return
  }
  resumeStore.setTemplate(selectedSlug.value)

  // Persistance immédiate sécurisée dans les backups si un brouillon existe
  if (import.meta.client && resumeStore.current) {
    try {
      savePaymentDraftBackup(returnPath.value)
    } catch (_) {}
  }

  const back = returnPath.value
  if (back) {
    navigateTo(back)
    return
  }
  const isImport = route.query.flow === 'import' || route.query.imported === '1'
  const isFresh = route.query.new === '1' || route.query.fresh === '1' || route.query.flow === 'new'
  if (isImport) {
    navigateTo('/creer/editeur?imported=1')
  } else if (isFresh) {
    navigateTo('/creer/editeur?new=1')
  } else {
    navigateTo('/creer/editeur')
  }
}

useWizardStep(computed(() => ({
  onContinue,
  nextLabel: returnPath.value ? 'Appliquer ce modèle' : 'Commencer la rédaction',
})))
</script>

<template>
  <div class="page-container max-w-container-max mx-auto pb-4">
    <header class="mb-stack-lg space-y-3">
      <NuxtLink
        v-if="returnPath"
        :to="returnPath"
        class="inline-flex items-center gap-1 text-sm text-secondary font-semibold hover:underline"
      >
        <UiPzIcon name="arrow_back" class="text-[18px]" />
        Retour
      </NuxtLink>
      <p class="text-sm font-medium text-secondary">{{ MSG.guide.modelStep }}</p>
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-on-surface">Choisissez votre modèle</h1>
        <p class="text-on-surface-variant mt-1 text-sm sm:text-base">
          {{ filteredTemplates.length }} modèles pour un CV clair et professionnel.
        </p>
      </div>

      <Transition name="form-field__error">
        <UiMessageBanner
          v-if="formError"
          variant="error"
          :message="formError"
          data-form-error
        />
      </Transition>
    </header>

    <!-- Bandeau de brouillon en cours -->
    <div
      v-if="activeDraftName"
      class="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left shadow-sm"
    >
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
          <UiPzIcon name="description" class="text-lg" />
        </div>
        <div>
          <p class="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider">Données actuelles sur les modèles</p>
          <p class="text-sm font-bold text-slate-800">
            {{ activeDraftName }}
          </p>
        </div>
      </div>
      <button
        type="button"
        class="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-blue-500 text-slate-700 hover:text-blue-700 font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
        @click="startFreshDraft"
      >
        <UiPzIcon name="add" class="text-sm" />
        <span>Créer un nouveau CV vierge</span>
      </button>
    </div>

    <div class="flex gap-2 mb-stack-lg overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      <button
        v-for="filter in TEMPLATE_FILTERS"
        :key="filter.id"
        type="button"
        class="shrink-0 min-h-11 px-4 py-2 rounded-full text-sm font-medium transition-colors"
        :class="
          activeFilter === filter.id
            ? 'bg-secondary text-white'
            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
        "
        @click="activeFilter = filter.id"
      >
        {{ filter.label }}
      </button>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 w-full mx-auto">
      <FeatureTemplatesPreviewCard
        v-for="template in filteredTemplates"
        :key="template.slug"
        :slug="template.slug"
        :selected="selectedSlug === template.slug"
        :user-snapshot="userSnapshotForPreview"
        class=""
        @select="selectTemplate"
      >
        <div class="min-w-0">
          <h4 class="font-bold text-on-surface text-xs sm:text-sm truncate">{{ template.name }}</h4>
          <p class="text-[10px] sm:text-xs text-on-surface-variant truncate">{{ template.category }}</p>
        </div>
      </FeatureTemplatesPreviewCard>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
