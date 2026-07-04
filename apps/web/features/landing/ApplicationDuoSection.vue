<script setup lang="ts">
import { buildPreviewSnapshot } from '~/features/templates/demoSnapshot'
import { buildCoverLetterDemoSnapshot } from '~/features/cover-letter-templates/demoSnapshot'

const demoResume = buildPreviewSnapshot('PROFESSIONNEL')
const demoLetter = buildCoverLetterDemoSnapshot('CLASSIQUE')

const points = [
  'CV structuré, compatible ATS et prêt à envoyer',
  'Lettres de motivation adaptées à chaque candidature',
  'Export PDF immédiat pour les deux documents',
] as const

const { target, revealed } = useScrollReveal()
</script>

<template>
  <section
    id="duo-candidature"
    class="landing-section bg-white border-t border-outline-variant/30"
  >
    <div
      ref="target"
      class="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop"
      :class="revealed ? 'scroll-reveal is-revealed' : 'scroll-reveal'"
    >
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <div class="space-y-5 order-2 lg:order-1">
          <div class="landing-section-header landing-section-header--left !mb-0">
            <p class="landing-eyebrow">Dossier complet</p>
            <UiTypewriterText
              tag="h2"
              class="landing-title"
              :active="revealed"
              :segments="[
                { text: 'CV + lettre :' },
                { text: ' le duo gagnant', class: 'text-secondary' },
              ]"
              loop
              loop-mode="tail"
            />
            <p class="landing-lead !max-w-lg">
              Créez l'ensemble de votre candidature depuis une seule plateforme, harmonisé et exportable en PDF.
            </p>
          </div>

          <ul class="space-y-3 pt-1">
            <li
              v-for="point in points"
              :key="point"
              class="flex items-start gap-3 text-sm sm:text-base text-on-surface-variant"
            >
              <UiPzIcon name="check_circle" class="text-secondary shrink-0 mt-0.5" />
              {{ point }}
            </li>
          </ul>

          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <NuxtLink to="/creer" class="btn-primary w-full sm:w-auto px-8 py-3.5 rounded-2xl premium-shadow-sm">
              Créer ma candidature
              <UiPzIcon name="arrow_forward" class="text-[17px]" />
            </NuxtLink>
            <NuxtLink
              to="/creer/lettre"
              class="btn-outline w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white"
            >
              <UiPzIcon name="mail" class="text-[17px]" />
              Rédiger une lettre
            </NuxtLink>
          </div>
        </div>

        <div class="order-1 lg:order-2">
          <FeaturesLandingProductScreenFrame label="Dossier Profilo'Z, Aminata Diallo" class="premium-shadow">
            <div class="grid grid-cols-2 gap-px bg-outline-variant/15 min-h-[240px] sm:min-h-[280px]">
              <div class="preview-canvas-bg relative overflow-hidden">
                <div class="absolute inset-0">
                  <FeatureTemplatesA4PreviewFit :resume="demoResume" />
                </div>
                <div class="absolute bottom-2 left-2 right-2 rounded-lg bg-white/90 border border-outline-variant/20 px-2 py-1.5 flex items-center gap-1.5">
                  <UiPzIcon name="description" class="text-secondary text-sm" />
                  <span class="text-[10px] font-medium text-on-surface">CV · Aminata Diallo</span>
                </div>
              </div>
              <div class="preview-canvas-bg relative overflow-hidden border-l border-outline-variant/10">
                <div class="absolute inset-0">
                  <FeatureCoverLetterTemplatesA4PreviewFit :letter="demoLetter" />
                </div>
                <div class="absolute bottom-2 left-2 right-2 rounded-lg bg-white/90 border border-outline-variant/20 px-2 py-1.5 flex items-center gap-1.5">
                  <UiPzIcon name="mail" class="text-secondary text-sm" />
                  <span class="text-[10px] font-medium text-on-surface">Lettre · Aminata Diallo</span>
                </div>
              </div>
            </div>
          </FeaturesLandingProductScreenFrame>
        </div>
      </div>
    </div>
  </section>
</template>
