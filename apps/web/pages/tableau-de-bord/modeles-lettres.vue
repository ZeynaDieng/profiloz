<script setup lang="ts">
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import {
  COVER_LETTER_TEMPLATE_FILTERS,
  COVER_LETTER_TEMPLATE_REGISTRY,
} from '~/features/cover-letter-templates/registry'

definePageMeta({ layout: 'dashboard' })

const authStore = useAuthStore()
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
})
</script>

<template>
  <div class="page-container">
    <NuxtLink :to="backLink" class="text-sm text-secondary font-semibold hover:underline mb-4 inline-flex items-center gap-1 min-h-11">
      <UiPzIcon name="arrow_back" class="text-base" />
      {{ backLabel }}
    </NuxtLink>

    <header class="mb-stack-lg">
      <h1 class="text-2xl sm:text-3xl font-bold text-on-surface">Modèles de lettres</h1>
      <p class="text-on-surface-variant mt-1 text-sm sm:text-base">
        {{ COVER_LETTER_TEMPLATE_REGISTRY.length }} modèles éditables pour vos candidatures.
      </p>
    </header>

    <div class="flex gap-2 mb-stack-lg overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      <button
        v-for="filter in COVER_LETTER_TEMPLATE_FILTERS"
        :key="filter.id"
        type="button"
        class="shrink-0 min-h-11 px-4 py-2 rounded-full text-sm font-semibold border transition-colors"
        :class="
          activeFilter === filter.id
            ? 'bg-secondary text-white border-secondary'
            : 'border-outline-variant text-on-surface-variant hover:border-secondary'
        "
        @click="activeFilter = filter.id"
      >
        {{ filter.label }}
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
      <FeatureCoverLetterTemplatesPreviewCard
        v-for="template in filteredTemplates"
        :key="template.slug"
        :slug="template.slug"
        :selected="preselected === template.slug"
        :resume-id="linkedResumeId"
        class=""
        @select="selectTemplate"
      >
        <div>
          <p class="font-bold text-on-surface">{{ template.name }}</p>
          <p class="text-xs text-on-surface-variant">{{ template.category }}</p>
        </div>
      </FeatureCoverLetterTemplatesPreviewCard>
    </div>

    <UiCard variant="glass" padding="md" class="mt-stack-lg text-sm text-on-surface-variant">
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
