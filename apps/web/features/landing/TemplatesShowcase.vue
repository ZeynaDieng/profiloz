<script setup lang="ts">
import { buildPreviewSnapshot } from '~/features/templates/demoSnapshot'
import { buildCoverLetterDemoSnapshot } from '~/features/cover-letter-templates/demoSnapshot'
import { COVER_LETTER_TEMPLATE_REGISTRY } from '~/features/cover-letter-templates/registry'
import { TEMPLATE_REGISTRY } from '~/features/templates/registry'

const POPULAR_SLUG = 'PROFESSIONNEL'
const featuredCvTemplates = TEMPLATE_REGISTRY.slice(0, 4)
const featuredLetterTemplates = COVER_LETTER_TEMPLATE_REGISTRY.slice(0, 3)

function letterTemplateLink(slug: string) {
  return `/creer/lettre/modele?select=${slug}`
}

function cvTemplateLink(slug: string) {
  return `/creer/assistant/informations?template=${slug}`
}

const letterStartLink = '/creer/lettre/modele'

const { target, revealed } = useScrollReveal(0.25)
</script>

<template>
  <section
    id="templates"
    ref="target"
    class="landing-section max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop overflow-hidden scroll-reveal"
    :class="revealed && 'is-revealed'"
  >
    <div class="landing-section-header text-center">
      <h2 class="text-xl sm:text-2xl font-bold text-on-surface">Modèles pour votre candidature</h2>
      <p class="text-sm text-on-surface-variant max-w-2xl mx-auto hidden sm:block">
        Des modèles de CV et de lettres conçus pour impressionner les recruteurs.
      </p>
    </div>

    <!-- Modèles de CV -->
    <div class="mb-8 md:mb-20">
      <div class="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-end mb-4 md:mb-8">
        <div class="space-y-0.5">
          <div class="inline-flex items-center gap-2 text-secondary font-semibold text-sm">
            <UiPzIcon name="description" class="text-[18px]" />
            Modèles de CV
          </div>
          <p class="text-xs sm:text-sm text-on-surface-variant hidden sm:block">10 modèles pour tous les profils.</p>
        </div>
        <NuxtLink
          to="/creer/modele"
          class="text-secondary font-bold hover:underline inline-flex items-center gap-1 min-h-11"
        >
          Voir tous les modèles CV
          <UiPzIcon name="chevron_right" class="text-[20px]" />
        </NuxtLink>
      </div>

      <p class="text-xs text-on-surface-variant mb-3 sm:hidden">Glissez pour parcourir →</p>

      <div class="mobile-scroll-x sm:grid sm:grid-cols-2 xl:grid-cols-4 sm:gap-8 md:gap-10">
        <article
          v-for="template in featuredCvTemplates"
          :key="template.slug"
          class="group flex flex-col mobile-scroll-card"
          :class="template.slug === POPULAR_SLUG ? 'xl:-mt-2' : ''"
        >
          <div
            class="relative aspect-[3/4] min-h-[260px] sm:min-h-[360px] md:min-h-[400px] rounded-2xl border overflow-hidden mb-3 sm:mb-4 pz-template-card"
            :class="
              template.slug === POPULAR_SLUG
                ? 'border-secondary shadow-lg ring-2 ring-secondary/20'
                : 'border-outline-variant group-hover:border-secondary/40'
            "
          >
            <span
              v-if="template.slug === POPULAR_SLUG"
              class="absolute top-3 left-3 z-30 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-label-xs font-bold text-on-secondary shadow-md"
            >
              <UiPzIcon name="star" class="text-[14px]" />
              Populaire
            </span>

            <div class="absolute inset-0 pz-template-preview">
              <FeatureTemplatesA4PreviewFit :resume="buildPreviewSnapshot(template.slug)" />
            </div>

            <div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/60 to-transparent sm:from-black/50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <div class="flex gap-2">
                <NuxtLink
                  :to="cvTemplateLink(template.slug)"
                  class="btn-outline flex-1 !min-h-10 !py-2 !px-3 !text-xs sm:!text-sm !bg-white/95 !border-white/30"
                >
                  Aperçu
                </NuxtLink>
                <NuxtLink
                  :to="cvTemplateLink(template.slug)"
                  class="btn-secondary flex-1 !min-h-10 !py-2 !px-3 !text-xs sm:!text-sm"
                >
                  Utiliser
                </NuxtLink>
              </div>
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
    <div class="pt-6 md:pt-12 border-t border-outline-variant/30">
      <div class="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-end mb-4 md:mb-8">
        <div class="space-y-0.5">
          <div class="inline-flex items-center gap-2 text-secondary font-semibold text-sm">
            <UiPzIcon name="mail" class="text-[18px]" />
            Modèles de lettres
          </div>
          <p class="text-xs sm:text-sm text-on-surface-variant hidden sm:block">
            Cohérents avec votre CV et votre candidature.
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

      <p class="text-xs text-on-surface-variant mb-3 sm:hidden">Glissez pour parcourir →</p>

      <div class="mobile-scroll-x sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 md:gap-10">
        <article
          v-for="template in featuredLetterTemplates"
          :key="template.slug"
          class="group flex flex-col mobile-scroll-card"
        >
          <div
            class="relative aspect-[3/4] min-h-[260px] sm:min-h-[360px] md:min-h-[400px] rounded-2xl border border-outline-variant overflow-hidden mb-3 sm:mb-4 pz-template-card sm:group-hover:border-secondary/40"
          >
            <div class="absolute inset-0 pz-template-preview">
              <FeatureCoverLetterTemplatesA4PreviewFit :letter="buildCoverLetterDemoSnapshot(template.slug)" />
            </div>

            <div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/60 to-transparent sm:from-black/50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <NuxtLink
                :to="letterTemplateLink(template.slug)"
                class="btn-secondary w-full !min-h-10 !py-2 !px-3 !text-xs sm:!text-sm"
              >
                Utiliser ce modèle
              </NuxtLink>
            </div>
          </div>

          <NuxtLink :to="letterTemplateLink(template.slug)" class="px-1 block">
            <h4 class="font-bold text-on-surface text-base group-hover:text-secondary transition-colors">
              {{ template.name }}
            </h4>
            <p class="text-label-xs text-on-surface-variant mt-0.5">{{ template.category }}</p>
            <p class="text-sm text-on-surface-variant mt-1 hidden sm:block">{{ template.description }}</p>
          </NuxtLink>
        </article>
      </div>
    </div>
  </section>
</template>
