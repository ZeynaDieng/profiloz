<script setup lang="ts">
import type { TemplateSlug } from '@profiloz/shared'
import { MSG } from '@profiloz/shared'
import { TEMPLATE_FILTERS, TEMPLATE_REGISTRY } from '~/features/templates/registry'
import { cvTemplateStartLink } from '~/utils/template-links'

definePageMeta({ layout: 'dashboard' })

const resumeStore = useResumeStore()
const authStore = useAuthStore()
const toast = useAppToast()
const route = useRoute()

const activeFilter = ref('all')
const selectedSlug = ref<TemplateSlug | null>(
  (route.query.select as TemplateSlug) ?? resumeStore.current?.templateSlug ?? 'PROFESSIONNEL',
)

onMounted(() => {
  authStore.loadFromStorage()
  resumeStore.rehydrateFromStorage()
  if (resumeStore.current?.templateSlug) {
    selectedSlug.value = resumeStore.current.templateSlug
  }
})

const userSnapshotForPreview = computed(() => {
  if (!authStore.isAuthenticated) return null
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
  navigateTo('/tableau-de-bord/cv/nouveau')
}

const filteredTemplates = computed(() => {
  if (activeFilter.value === 'all') return TEMPLATE_REGISTRY
  return TEMPLATE_REGISTRY.filter((t) => t.category === activeFilter.value)
})

function useTemplate(slug: TemplateSlug) {
  selectedSlug.value = slug
  resumeStore.setTemplate(slug)

  if (import.meta.client && resumeStore.current) {
    try {
      savePaymentDraftBackup()
    } catch (_) {}
  }

  const p = resumeStore.current?.personalInfo
  const hasData = Boolean((p?.firstName || p?.lastName || p?.fullName)?.trim() || resumeStore.current?.experiences?.length || resumeStore.current?.skills?.length)
  if (hasData) {
    navigateTo('/creer/editeur')
  } else {
    navigateTo(cvTemplateStartLink(slug))
  }
}
</script>

<template>
  <div class="page-container max-w-container-max mx-auto pb-8 min-w-0 overflow-x-hidden">
    <header class="mb-stack-lg space-y-3">
      <p class="text-sm font-medium text-secondary">{{ MSG.guide.modelStep }}</p>
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-on-surface">Modèles de CV</h1>
        <p class="text-on-surface-variant mt-1 text-sm sm:text-base">
          {{ filteredTemplates.length }} modèles pour un CV clair et professionnel.
        </p>
      </div>
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
          <p class="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider">Aperçu avec vos données</p>
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
        @select="useTemplate"
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
