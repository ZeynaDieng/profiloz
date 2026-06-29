<script setup lang="ts">
import type { TemplateSlug } from '@profiloz/shared'
import { MSG } from '@profiloz/shared'
import { TEMPLATE_FILTERS, TEMPLATE_REGISTRY } from '~/features/templates/registry'

definePageMeta({ layout: 'wizard', wizardFooter: true })

useGuestSession()
const { error: toastError } = useAppToast()
const resumeStore = useResumeStore()
const route = useRoute()
const { goNext } = useWizardNavigation()

onMounted(() => {
  if (!resumeStore.current?.personalInfo.fullName) {
    resumeStore.rehydrateFromStorage()
  }
  resumeStore.initDraft()
  if (!selectedSlug.value && resumeStore.current?.templateSlug) {
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

const filteredTemplates = computed(() => {
  if (activeFilter.value === 'all') return TEMPLATE_REGISTRY
  return TEMPLATE_REGISTRY.filter((t) => t.category === activeFilter.value)
})

function selectTemplate(slug: TemplateSlug) {
  selectedSlug.value = slug
  resumeStore.setTemplate(slug)
}

function onContinue() {
  if (!selectedSlug.value) {
    toastError(MSG.wizard.chooseTemplate)
    return
  }
  resumeStore.setTemplate(selectedSlug.value)
  if (route.query.flow === 'import') {
    navigateTo('/creer/editeur')
    return
  }
  goNext()
}

useWizardStep({ onContinue })
</script>

<template>
  <div class="page-container max-w-container-max mx-auto pb-4">
    <header class="mb-stack-lg space-y-3">
      <p class="text-sm font-medium text-secondary">{{ MSG.guide.modelStep }}</p>
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-on-surface">Choisissez votre modèle</h1>
        <p class="text-on-surface-variant mt-1 text-sm sm:text-base">
          {{ filteredTemplates.length }} modèles — une colonne sur mobile pour comparer facilement.
        </p>
      </div>
      <UiMessageBanner
        v-if="selectedSlug"
        variant="success"
        :message="MSG.guide.modelSelected"
      />
    </header>

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

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
      <FeatureTemplatesPreviewCard
        v-for="template in filteredTemplates"
        :key="template.slug"
        :slug="template.slug"
        :selected="selectedSlug === template.slug"
        :user-snapshot="resumeStore.current"
        class=""
        @select="selectTemplate"
      >
        <div>
          <h4 class="font-bold text-on-surface">{{ template.name }}</h4>
          <p class="text-xs text-on-surface-variant">{{ template.category }}</p>
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
