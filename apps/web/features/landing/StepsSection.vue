<script setup lang="ts">
/**
 * « Comment ça marche » en 3 étapes courtes : remplace les anciennes sections Fonctionnalités,
 * Parcours en 4 étapes et Duo CV + lettre, qui répétaient le même message sur 5 écrans.
 */
const steps = [
  {
    color: 'var(--color-secondary)',
    title: 'Importez ou créez',
    text: 'Votre ancien CV (PDF, Word ou photo) ou une page blanche guidée.',
  },
  {
    color: 'var(--color-accent-green)',
    title: 'Choisissez un modèle',
    text: 'Lisible par les recruteurs et les logiciels de tri (ATS).',
  },
  {
    color: '#7c3aed',
    title: 'Téléchargez',
    text: 'Votre CV et une lettre adaptée à l’offre, en PDF.',
  },
] as const

const { target, revealed } = useScrollReveal(0.2)
</script>

<template>
  <section id="features" class="landing-section bg-surface-container-low">
    <div
      ref="target"
      class="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop scroll-reveal"
      :class="revealed && 'is-revealed'"
    >
      <div class="landing-section-header landing-section-header--left">
        <p class="landing-eyebrow">Comment ça marche</p>
        <h2 class="landing-title">Votre dossier prêt en <span class="text-secondary">3 étapes</span></h2>
      </div>

      <!-- Liste simple, sans cartes : compacte sur mobile -->
      <ol class="grid gap-5 md:grid-cols-3 md:gap-10">
        <li v-for="(step, index) in steps" :key="step.title" class="flex items-start gap-4">
          <span
            class="w-10 h-10 rounded-full text-white text-base font-bold flex items-center justify-center shrink-0 tabular-nums"
            :style="{ backgroundColor: step.color }"
          >
            {{ index + 1 }}
          </span>
          <div class="min-w-0 pt-1">
            <h3 class="font-bold text-on-surface text-base md:text-lg leading-snug">{{ step.title }}</h3>
            <p class="mt-1 text-sm text-on-surface-variant leading-relaxed">{{ step.text }}</p>
          </div>
        </li>
      </ol>

      <div class="mt-7 md:mt-10 flex flex-col sm:flex-row sm:items-center gap-3">
        <NuxtLink
          to="/creer"
          class="btn-secondary cta-primary w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm sm:text-base premium-shadow-sm"
        >
          Créer mon CV gratuitement
          <UiPzIcon name="arrow_forward" class="text-[20px]" />
        </NuxtLink>
        <p class="text-xs text-on-surface-variant">Gratuit jusqu’au téléchargement · Sans abonnement obligatoire</p>
      </div>
    </div>
  </section>
</template>
