<script setup lang="ts">
import { buildPreviewSnapshot } from '~/features/templates/demoSnapshot'
import { TEMPLATE_REGISTRY } from '~/features/templates/registry'

const featured = TEMPLATE_REGISTRY.slice(0, 4)
</script>

<template>
  <section id="templates" class="py-12 md:py-24 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
    <div class="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end mb-8 md:mb-12">
      <div class="space-y-2 md:space-y-4">
        <h2 class="text-xl sm:text-2xl font-bold text-on-surface">Modèles sélectionnés</h2>
        <p class="text-sm sm:text-base text-on-surface-variant">10 modèles conçus pour tous les profils et secteurs.</p>
      </div>
      <NuxtLink to="/creer/modele" class="text-secondary font-bold hover:underline inline-flex items-center gap-1 min-h-11">
        Voir tous les modèles
        <UiPzIcon name="chevron_right" class="text-[20px]" />
      </NuxtLink>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
      <NuxtLink
        v-for="template in featured"
        :key="template.slug"
        :to="`/creer/modele?select=${template.slug}`"
        class="group cursor-pointer block"
      >
        <div class="aspect-[3/4] rounded-2xl border border-outline-variant overflow-hidden relative mb-3 md:mb-4">
          <FeatureTemplatesA4PreviewFit :resume="buildPreviewSnapshot(template.slug)" />
          <div class="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-on-surface px-4 py-2 rounded-lg font-bold text-sm shadow-lg z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            Utiliser ce modèle
          </div>
        </div>
        <h4 class="font-bold text-on-surface">{{ template.name }}</h4>
        <p class="text-label-xs text-on-surface-variant">{{ template.category }}</p>
      </NuxtLink>
    </div>
  </section>
</template>
