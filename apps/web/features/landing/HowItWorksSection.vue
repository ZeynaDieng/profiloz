<script setup lang="ts">
import { buildPreviewSnapshot } from '~/features/templates/demoSnapshot'

const demoResume = buildPreviewSnapshot('PROFESSIONNEL')

const steps = [
  {
    number: 1,
    title: 'Importer ou créer',
    description: 'Partez de votre CV existant ou rédigez étape par étape.',
    screen: 'import' as const,
  },
  {
    number: 2,
    title: 'Compléter',
    description: 'Vérifiez et ajustez le contenu en quelques clics.',
    screen: 'editor' as const,
  },
  {
    number: 3,
    title: 'Choisir un modèle',
    description: 'Comparez les modèles et personnalisez les couleurs.',
    screen: 'templates' as const,
  },
  {
    number: 4,
    title: 'Télécharger',
    description: 'Exportez en PDF, compatible recruteurs et ATS.',
    screen: 'pdf' as const,
  },
]

const { target, revealed } = useScrollReveal()
</script>

<template>
  <section id="comment-ca-marche" class="landing-section bg-white border-t border-outline-variant/30">
    <div
      ref="target"
      class="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop overflow-hidden"
      :class="revealed ? 'scroll-reveal is-revealed' : 'scroll-reveal'"
    >
      <div class="landing-section-header text-center">
        <h2 class="text-xl sm:text-2xl font-bold text-on-surface">Comment ça marche</h2>
        <p class="text-on-surface-variant text-sm sm:text-base">Quatre étapes simples, sans prise de tête.</p>
      </div>

      <p class="text-xs text-on-surface-variant mb-3 md:hidden">4 étapes · glissez →</p>

      <ol class="mobile-scroll-x md:grid md:grid-cols-2 xl:grid-cols-4 md:gap-6 xl:gap-8">
        <li
          v-for="step in steps"
          :key="step.number"
          class="mobile-scroll-card flex flex-col gap-3 p-stack-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest list-none premium-card"
        >
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary text-sm font-bold"
            aria-hidden="true"
          >
            {{ step.number }}
          </span>
          <h3 class="font-bold text-on-surface text-sm sm:text-base leading-snug">
            {{ step.title }}
          </h3>
          <p class="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            {{ step.description }}
          </p>

          <FeaturesLandingProductScreenFrame :label="step.title" compact class="mt-auto hidden sm:block">
            <div v-if="step.screen === 'import'" class="p-3 h-28 flex items-center justify-center">
              <div class="w-full rounded-lg border border-dashed border-secondary/30 bg-secondary/5 py-4 text-center">
                <UiPzIcon name="upload_file" class="text-secondary text-xl" />
                <p class="text-[9px] text-on-surface-variant mt-1">Importer un CV</p>
              </div>
            </div>
            <div v-else-if="step.screen === 'editor'" class="h-28 grid grid-cols-2 gap-px bg-outline-variant/20">
              <div class="bg-white p-1.5 space-y-1">
                <div class="h-4 rounded bg-surface-container" />
                <div class="h-4 rounded bg-surface-container" />
              </div>
              <div class="bg-[#eef2ff] overflow-hidden scale-[1.35] origin-top-left w-[76%] h-[76%]">
                <FeatureTemplatesA4PreviewFit :resume="demoResume" />
              </div>
            </div>
            <div v-else-if="step.screen === 'templates'" class="p-2 h-28 grid grid-cols-3 gap-1">
              <div v-for="n in 3" :key="n" class="rounded border border-outline-variant/30 bg-white" :class="n === 2 && 'border-secondary ring-1 ring-secondary/30'" />
            </div>
            <div v-else class="p-3 h-28 flex flex-col items-center justify-center gap-1">
              <UiPzIcon name="picture_as_pdf" class="text-error text-2xl" />
              <p class="text-[10px] font-semibold text-on-surface">CV.pdf</p>
            </div>
          </FeaturesLandingProductScreenFrame>
        </li>
      </ol>
    </div>
  </section>
</template>
