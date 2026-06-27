<script setup lang="ts">
import { buildPreviewSnapshot } from '~/features/templates/demoSnapshot'
import { TEMPLATE_REGISTRY } from '~/features/templates/registry'

const POPULAR_SLUG = 'PROFESSIONNEL'
const featuredCvTemplates = TEMPLATE_REGISTRY.slice(0, 4)

const letterTemplates = [
  {
    slug: 'CLASSIQUE',
    name: 'Classique',
    category: 'Corporate',
    description: 'Lettre élégante au format traditionnel.',
    variant: 'serif' as const,
  },
  {
    slug: 'MODERNE',
    name: 'Moderne',
    category: 'Professionnel',
    description: 'Mise en page claire et contemporaine.',
    variant: 'modern' as const,
  },
  {
    slug: 'ACCENT',
    name: 'Accent',
    category: 'Distinctif',
    description: 'Bandeau coloré pour se démarquer.',
    variant: 'accent' as const,
  },
]

function letterTemplateLink(slug: string) {
  return `/inscription?redirect=${encodeURIComponent(`/tableau-de-bord/lettres/nouvelle?template=${slug}`)}`
}

function cvTemplateLink(slug: string) {
  return `/creer/assistant/informations?template=${slug}`
}

const letterStartLink = '/inscription?redirect=/tableau-de-bord/modeles-lettres'
</script>

<template>
  <section id="templates" class="py-12 md:py-24 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
    <div class="text-center mb-10 md:mb-14 space-y-3">
      <h2 class="text-xl sm:text-2xl font-bold text-on-surface">Modèles pour votre candidature</h2>
      <p class="text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto">
        Des modèles de CV et de lettres de motivation conçus pour impressionner les recruteurs.
      </p>
    </div>

    <!-- Modèles de CV -->
    <div class="mb-14 md:mb-20">
      <div class="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end mb-6 md:mb-8">
        <div class="space-y-1">
          <div class="inline-flex items-center gap-2 text-secondary font-semibold text-sm">
            <UiPzIcon name="description" class="text-[18px]" />
            Modèles de CV
          </div>
          <p class="text-sm text-on-surface-variant">10 modèles pour tous les profils et secteurs.</p>
        </div>
        <NuxtLink
          to="/creer/modele"
          class="text-secondary font-bold hover:underline inline-flex items-center gap-1 min-h-11"
        >
          Voir tous les modèles CV
          <UiPzIcon name="chevron_right" class="text-[20px]" />
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 md:gap-10">
        <article
          v-for="template in featuredCvTemplates"
          :key="template.slug"
          class="group flex flex-col"
          :class="template.slug === POPULAR_SLUG ? 'xl:-mt-2' : ''"
        >
          <div
            class="relative aspect-[3/4] min-h-[320px] sm:min-h-[360px] md:min-h-[400px] rounded-2xl border overflow-hidden mb-4 transition-shadow duration-300"
            :class="
              template.slug === POPULAR_SLUG
                ? 'border-secondary shadow-lg ring-2 ring-secondary/20'
                : 'border-outline-variant group-hover:border-secondary/40 group-hover:shadow-md'
            "
          >
            <span
              v-if="template.slug === POPULAR_SLUG"
              class="absolute top-3 left-3 z-30 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-label-xs font-bold text-on-secondary shadow-md"
            >
              <UiPzIcon name="star" class="text-[14px]" />
              Le plus populaire
            </span>

            <div
              class="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.08] origin-center will-change-transform"
            >
              <FeatureTemplatesA4PreviewFit :resume="buildPreviewSnapshot(template.slug)" />
            </div>

            <div
              class="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            />

            <div
              class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap justify-center gap-2 w-[calc(100%-2rem)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300"
            >
              <NuxtLink
                :to="cvTemplateLink(template.slug)"
                class="inline-flex items-center justify-center gap-1 min-h-10 px-4 rounded-lg bg-white/95 text-on-surface font-bold text-sm shadow-lg hover:bg-white transition-colors"
              >
                <UiPzIcon name="visibility" class="text-[18px]" />
                Aperçu
              </NuxtLink>
              <NuxtLink
                :to="cvTemplateLink(template.slug)"
                class="inline-flex items-center justify-center min-h-10 px-4 rounded-lg bg-secondary text-on-secondary font-bold text-sm shadow-lg hover:bg-secondary/90 transition-colors"
              >
                Utiliser
              </NuxtLink>
            </div>
          </div>

          <div class="px-1">
            <h4 class="font-bold text-on-surface text-base">{{ template.name }}</h4>
            <p class="text-label-xs text-on-surface-variant mt-0.5">{{ template.category }}</p>
          </div>
        </article>
      </div>
    </div>

    <!-- Modèles de lettres -->
    <div class="pt-10 md:pt-12 border-t border-outline-variant/30">
      <div class="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end mb-6 md:mb-8">
        <div class="space-y-1">
          <div class="inline-flex items-center gap-2 text-secondary font-semibold text-sm">
            <UiPzIcon name="mail" class="text-[18px]" />
            Modèles de lettres de motivation
          </div>
          <p class="text-sm text-on-surface-variant">
            Rédigez une lettre cohérente avec votre CV et votre candidature.
          </p>
        </div>
        <NuxtLink
          :to="letterStartLink"
          class="text-secondary font-bold hover:underline inline-flex items-center gap-1 min-h-11"
        >
          Créer une lettre
          <UiPzIcon name="chevron_right" class="text-[20px]" />
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        <article
          v-for="template in letterTemplates"
          :key="template.slug"
          class="group flex flex-col"
        >
          <NuxtLink :to="letterTemplateLink(template.slug)" class="block">
            <div
              class="relative aspect-[3/4] min-h-[300px] sm:min-h-[340px] rounded-2xl border border-outline-variant overflow-hidden mb-4 bg-white transition-all duration-300 group-hover:border-secondary/40 group-hover:shadow-md"
            >
              <div
                class="absolute inset-0 p-5 sm:p-6 transition-transform duration-500 ease-out group-hover:scale-[1.04] origin-center"
                :class="{
                  'font-[Georgia,Times,serif] text-on-surface': template.variant === 'serif',
                  'font-sans text-on-surface': template.variant === 'modern',
                  'font-sans text-on-surface': template.variant === 'accent',
                }"
              >
                <p class="text-[10px] text-on-surface-variant text-right mb-4">15 juin 2026</p>
                <p class="text-[11px] font-semibold mb-3">Madame, Monsieur,</p>
                <p
                  class="text-[10px] leading-relaxed text-on-surface-variant mb-3"
                  :class="template.variant === 'accent' ? 'text-secondary font-medium' : ''"
                >
                  Objet : Candidature — Poste visé
                </p>
                <p class="text-[10px] leading-relaxed text-on-surface-variant">
                  Je me permets de vous adresser ma candidature pour le poste mentionné. Mon parcours
                  et mes compétences correspondent aux exigences de votre organisation...
                </p>
                <div
                  v-if="template.variant === 'accent'"
                  class="absolute bottom-0 left-0 right-0 h-1 bg-secondary"
                />
              </div>

              <div
                class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              />

              <div
                class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300"
              >
                <span
                  class="inline-flex items-center justify-center gap-1 min-h-10 px-4 rounded-lg bg-secondary text-on-secondary font-bold text-sm shadow-lg"
                >
                  <UiPzIcon name="edit" class="text-[18px]" />
                  Voir le modèle
                </span>
              </div>
            </div>

            <div class="px-1">
              <h4 class="font-bold text-on-surface text-base group-hover:text-secondary transition-colors">
                {{ template.name }}
              </h4>
              <p class="text-label-xs text-on-surface-variant mt-0.5">{{ template.category }}</p>
              <p class="text-sm text-on-surface-variant mt-1">{{ template.description }}</p>
            </div>
          </NuxtLink>
        </article>
      </div>
    </div>
  </section>
</template>
