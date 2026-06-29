<script setup lang="ts">
import { buildPreviewSnapshot } from '~/features/templates/demoSnapshot'

const demoResume = buildPreviewSnapshot('PROFESSIONNEL')

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
    class="landing-section hidden md:block bg-white border-t border-outline-variant/30"
  >
    <div
      ref="target"
      class="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop"
      :class="revealed ? 'scroll-reveal is-revealed' : 'scroll-reveal'"
    >
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <div class="space-y-4 order-2 lg:order-1">
          <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-on-surface leading-tight">
            CV + Lettre de motivation : le duo gagnant
          </h2>
          <p class="text-on-surface-variant text-sm sm:text-base leading-relaxed max-w-lg">
            Créez l'ensemble de votre dossier de candidature depuis une seule plateforme. Un CV percutant
            et une lettre personnalisée, harmonisés et exportables en PDF.
          </p>
          <ul class="space-y-3 pt-2">
            <li
              v-for="point in points"
              :key="point"
              class="flex items-start gap-3 text-sm text-on-surface-variant"
            >
              <UiPzIcon name="check_circle" class="text-secondary shrink-0 mt-0.5" />
              {{ point }}
            </li>
          </ul>
          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <NuxtLink to="/creer" class="btn-primary w-full sm:w-auto premium-shadow-sm">
              Créer ma candidature
              <UiPzIcon name="arrow_forward" class="text-[17px]" />
            </NuxtLink>
            <NuxtLink
              to="/inscription?redirect=/tableau-de-bord/lettres/nouvelle"
              class="btn-outline w-full sm:w-auto"
            >
              <UiPzIcon name="mail" class="text-[17px]" />
              Rédiger une lettre
            </NuxtLink>
          </div>
        </div>

        <div class="order-1 lg:order-2">
          <FeaturesLandingProductScreenFrame label="Éditeur Profilo'Z" class="premium-shadow">
            <div class="grid grid-cols-2 gap-px bg-outline-variant/15 min-h-[280px]">
              <div class="bg-white p-3 space-y-2 border-r border-outline-variant/10">
                <p class="text-[10px] font-bold uppercase text-on-surface-variant">Dashboard</p>
                <div class="rounded-lg border border-outline-variant/25 p-2 space-y-1.5">
                  <div class="h-2 w-3/4 rounded bg-surface-container" />
                  <div class="h-8 rounded bg-secondary/10 border border-secondary/20" />
                </div>
                <p class="text-[10px] font-bold uppercase text-on-surface-variant pt-1">Éditeur CV</p>
                <div class="space-y-1">
                  <div class="h-6 rounded border border-outline-variant/30 bg-surface-container-lowest" />
                  <div class="h-6 rounded border border-outline-variant/30 bg-surface-container-lowest" />
                </div>
              </div>
              <div class="bg-[#eef2ff] relative overflow-hidden">
                <div class="absolute inset-0 scale-[0.55] origin-top">
                  <FeatureTemplatesA4PreviewFit :resume="demoResume" />
                </div>
                <div class="absolute bottom-2 left-2 right-2 rounded-lg bg-white/90 border border-outline-variant/20 px-2 py-1.5 flex items-center gap-1.5">
                  <UiPzIcon name="mail" class="text-secondary text-sm" />
                  <span class="text-[10px] font-medium text-on-surface">Lettre · Aperçu PDF</span>
                </div>
              </div>
            </div>
          </FeaturesLandingProductScreenFrame>
        </div>
      </div>
    </div>
  </section>
</template>
