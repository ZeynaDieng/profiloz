<script setup lang="ts">
import type { TemplateSlug } from '@profiloz/shared'
import { TEMPLATE_FILTERS, TEMPLATE_REGISTRY } from '~/features/templates/registry'
import { cvTemplateStartLink } from '~/utils/template-links'

definePageMeta({ layout: 'dashboard' })

const resumeStore = useResumeStore()
const activeFilter = ref('all')

const filteredTemplates = computed(() => {
  if (activeFilter.value === 'all') return TEMPLATE_REGISTRY
  return TEMPLATE_REGISTRY.filter((t) => t.category === activeFilter.value)
})

function useTemplate(slug: TemplateSlug) {
  navigateTo(cvTemplateStartLink(slug))
}

onMounted(() => {
  resumeStore.rehydrateFromStorage()
})
</script>

<template>
  <div class="page-container">
    <header class="mb-stack-lg">
      <h1 class="text-2xl sm:text-3xl font-bold text-on-surface">Modèles de CV</h1>
      <p class="text-on-surface-variant mt-1 text-sm sm:text-base">
        Parcourez les {{ TEMPLATE_REGISTRY.length }} modèles disponibles pour votre prochain CV.
      </p>
    </header>

    <div class="flex gap-2 mb-stack-lg overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      <button
        v-for="filter in TEMPLATE_FILTERS"
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

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
      <FeatureTemplatesPreviewCard
        v-for="template in filteredTemplates"
        :key="template.slug"
        :slug="template.slug"
        :user-snapshot="resumeStore.current"
        @select="useTemplate"
      >
        <div>
          <h2 class="font-bold text-on-surface">{{ template.name }}</h2>
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
