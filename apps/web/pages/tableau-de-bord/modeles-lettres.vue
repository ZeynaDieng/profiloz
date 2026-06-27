<script setup lang="ts">
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
// Dossier d'origine : on garde le lien CV ↔ lettre à travers le choix du modèle.
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
const backLabel = computed(() => (linkedResumeId.value ? '← Retour au dossier' : '← Mes lettres'))

const filteredTemplates = computed(() => {
  if (activeFilter.value === 'all') return COVER_LETTER_TEMPLATE_REGISTRY
  return COVER_LETTER_TEMPLATE_REGISTRY.filter((t) => t.category === activeFilter.value)
})

onMounted(() => {
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) navigateTo('/connexion')
})
</script>

<template>
  <div class="p-margin-mobile md:p-margin-desktop">
    <div class="mb-stack-lg">
      <NuxtLink :to="backLink" class="text-sm text-secondary font-semibold hover:underline mb-3 inline-block">
        {{ backLabel }}
      </NuxtLink>
      <h1 class="text-2xl font-bold text-on-surface">Modèles de lettres</h1>
      <p class="text-on-surface-variant">
        {{ COVER_LETTER_TEMPLATE_REGISTRY.length }} modèles éditables pour vos candidatures.
      </p>
    </div>

    <div class="flex flex-wrap gap-2 mb-stack-lg">
      <button
        v-for="filter in COVER_LETTER_TEMPLATE_FILTERS"
        :key="filter.id"
        type="button"
        class="px-4 py-2 rounded-full text-sm font-semibold border transition-colors"
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
      >
        <div>
          <p class="font-bold text-on-surface">{{ template.name }}</p>
          <p class="text-xs text-on-surface-variant">{{ template.category }}</p>
        </div>
      </FeatureCoverLetterTemplatesPreviewCard>
    </div>

    <p class="text-sm text-on-surface-variant mt-stack-lg">
      Cliquez sur un modèle pour l’ouvrir dans l’éditeur, ou
      <NuxtLink :to="blankLetterLink" class="text-secondary font-bold hover:underline">
        créez une lettre vierge
      </NuxtLink>.
    </p>
  </div>
</template>
