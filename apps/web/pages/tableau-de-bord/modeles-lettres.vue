<script setup lang="ts">
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { MSG } from '@profiloz/shared'
import {
  COVER_LETTER_TEMPLATE_FILTERS,
  COVER_LETTER_TEMPLATE_REGISTRY,
} from '~/features/cover-letter-templates/registry'

definePageMeta({ layout: 'dashboard' })

const authStore = useAuthStore()
const coverLetterStore = useCoverLetterStore()
const route = useRoute()
const activeFilter = ref('all')

const preselected = computed(() =>
  typeof route.query.select === 'string' ? route.query.select.toUpperCase() : null,
)
const linkedResumeId = computed(() =>
  typeof route.query.resumeId === 'string' && route.query.resumeId ? route.query.resumeId : null,
)
const blankLetterLink = computed(() =>
  linkedResumeId.value
    ? `/tableau-de-bord/lettres/nouvelle?resumeId=${linkedResumeId.value}`
    : '/tableau-de-bord/lettres/nouvelle',
)
const backLink = computed(() =>
  linkedResumeId.value ? `/tableau-de-bord/dossiers/${linkedResumeId.value}` : '/tableau-de-bord/lettres',
)
const backLabel = computed(() => (linkedResumeId.value ? 'Retour au dossier' : 'Mes lettres'))

const filteredTemplates = computed(() => {
  if (activeFilter.value === 'all') return COVER_LETTER_TEMPLATE_REGISTRY
  return COVER_LETTER_TEMPLATE_REGISTRY.filter((t) => t.category === activeFilter.value)
})

function selectTemplate(slug: CoverLetterTemplateSlug) {
  const params = new URLSearchParams()
  params.set('template', slug)
  if (linkedResumeId.value) params.set('resumeId', linkedResumeId.value)
  navigateTo(`/tableau-de-bord/lettres/nouvelle?${params.toString()}`)
}

onMounted(() => {
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) navigateTo('/connexion')
  coverLetterStore.rehydrateFromStorage()
})
</script>

<template>
  <div class="page-container max-w-container-max mx-auto pb-8">
    <NuxtLink :to="backLink" class="text-sm text-secondary font-semibold hover:underline mb-4 inline-flex items-center gap-1 min-h-11">
      <UiPzIcon name="arrow_back" class="text-base" />
      {{ backLabel }}
    </NuxtLink>

    <header class="mb-stack-lg space-y-3">
      <p class="text-sm font-medium text-secondary">{{ MSG.guide.letterModelStep }}</p>
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-on-surface">Modèles de lettres</h1>
        <p class="text-on-surface-variant mt-1 text-sm sm:text-base">
          {{ filteredTemplates.length }} modèles pour une lettre claire et professionnelle.
        </p>
      </div>
    </header>

    <div class="flex gap-2 mb-stack-lg overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      <button
        v-for="filter in COVER_LETTER_TEMPLATE_FILTERS"
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

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 lg:gap-8 max-w-md sm:max-w-none mx-auto">
      <FeatureCoverLetterTemplatesPreviewCard
        v-for="template in filteredTemplates"
        :key="template.slug"
        :slug="template.slug"
        :selected="preselected === template.slug || coverLetterStore.current?.templateSlug === template.slug"
        :resume-id="linkedResumeId"
        @select="selectTemplate"
      >
        <div>
          <h4 class="font-bold text-on-surface">{{ template.name }}</h4>
          <p class="text-xs text-on-surface-variant">{{ template.category }}</p>
        </div>
      </FeatureCoverLetterTemplatesPreviewCard>
    </div>

    <UiCard variant="glass" padding="md" class="mt-stack-lg text-sm text-on-surface-variant text-center border border-outline-variant/30 rounded-2xl">
      Cliquez sur un modèle pour l'ouvrir dans l'éditeur, ou
      <NuxtLink :to="blankLetterLink" class="text-secondary font-bold hover:underline">
        créez une lettre vierge
      </NuxtLink>.
    </UiCard>
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
