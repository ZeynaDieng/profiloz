<script setup lang="ts">
import type { TemplateSlug } from "@profiloz/shared";
import {
  TEMPLATE_FILTERS,
  TEMPLATE_REGISTRY,
} from "~/features/templates/registry";

definePageMeta({ layout: "wizard" });

useGuestSession();
const resumeStore = useResumeStore();
const route = useRoute();

const activeFilter = ref("all");
const selectedSlug = ref<TemplateSlug | null>(
  (route.query.select as TemplateSlug) ??
    resumeStore.current?.templateSlug ??
    null,
);

const filteredTemplates = computed(() => {
  if (activeFilter.value === "all") return TEMPLATE_REGISTRY;
  return TEMPLATE_REGISTRY.filter((t) => t.category === activeFilter.value);
});

function selectTemplate(slug: TemplateSlug) {
  selectedSlug.value = slug;
  resumeStore.setTemplate(slug);
}

function onContinue() {
  if (!selectedSlug.value) return;
  navigateTo("/creer/editeur");
}

resumeStore.initDraft();
</script>

<template>
  <WizardStep
    next-label="Ouvrir l'éditeur"
    :show-back="true"
    @continue="onContinue"
  >
    <div
      class="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto"
    >
      <div class="mb-stack-lg">
        <h1 class="text-3xl font-bold text-on-surface">
          Choisissez votre modèle
        </h1>
        <p class="text-on-surface-variant">
          {{ filteredTemplates.length }} modèles conçus pour tous les profils
          aperçu réel ci-dessous.
        </p>
      </div>

      <div class="flex flex-wrap gap-2 mb-stack-lg">
        <button
          v-for="filter in TEMPLATE_FILTERS"
          :key="filter.id"
          type="button"
          class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
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

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-gutter">
        <FeatureTemplatesPreviewCard
          v-for="template in filteredTemplates"
          :key="template.slug"
          :slug="template.slug"
          :selected="selectedSlug === template.slug"
          :user-snapshot="resumeStore.current"
          @select="selectTemplate"
        >
          <div>
            <h4 class="font-bold text-on-surface">{{ template.name }}</h4>
            <p class="text-xs text-on-surface-variant">
              {{ template.category }}
            </p>
          </div>
        </FeatureTemplatesPreviewCard>
      </div>
    </div>
  </WizardStep>
</template>
