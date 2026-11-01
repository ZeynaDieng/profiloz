<script setup lang="ts">
/**
 * « Comment ça marche » en 3 étapes courtes : remplace les anciennes sections Fonctionnalités,
 * Parcours en 4 étapes et Duo CV + lettre, qui répétaient le même message sur 5 écrans.
 */
const steps = [
  {
    icon: 'upload_file',
    title: 'Importez ou partez de zéro',
    text: 'Envoyez votre ancien CV (PDF, Word ou photo) : l’IA remplit tout. Ou laissez-vous guider étape par étape.',
  },
  {
    icon: 'palette',
    title: 'Choisissez un modèle',
    text: 'Des modèles pensés pour les recruteurs et lisibles par les logiciels de tri (ATS). L’IA vous aide à rédiger.',
  },
  {
    icon: 'download',
    title: 'Téléchargez CV et lettre',
    text: 'Votre CV et une lettre de motivation adaptée à l’offre, en PDF prêt à envoyer depuis votre téléphone.',
  },
] as const

const { target, revealed } = useScrollReveal(0.2)
</script>

<template>
  <section id="features" class="landing-section border-t border-outline-variant/20">
    <div
      ref="target"
      class="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop scroll-reveal"
      :class="revealed && 'is-revealed'"
    >
      <div class="landing-section-header landing-section-header--left">
        <p class="landing-eyebrow">Comment ça marche</p>
        <h2 class="landing-title">Votre dossier prêt en <span class="text-secondary">3 étapes</span></h2>
      </div>

      <ol class="grid gap-4 md:grid-cols-3 md:gap-6">
        <li
          v-for="(step, index) in steps"
          :key="step.title"
          class="relative rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 md:p-6"
        >
          <div class="flex items-center gap-3 mb-3">
            <span class="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <UiPzIcon :name="step.icon" class="text-[22px]" />
            </span>
            <span class="text-xs font-bold text-on-surface-variant">Étape {{ index + 1 }}</span>
          </div>
          <h3 class="font-bold text-on-surface text-base md:text-lg">{{ step.title }}</h3>
          <p class="mt-1.5 text-sm text-on-surface-variant leading-relaxed">{{ step.text }}</p>
        </li>
      </ol>

      <div class="mt-6 md:mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
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
