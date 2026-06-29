<script setup lang="ts">
const journeySteps = [
  'CV ou lettre',
  'Choisir un modèle',
  'Exporter en PDF',
] as const

const config = useRuntimeConfig()
const heroVariant = computed(() =>
  (config.public.heroVariant as string) === 'start' ? 'start' : 'transform',
)
</script>

<template>
  <section
    class="hero-section max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop pt-6 md:pt-8 pb-10 md:pb-14"
  >
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 xl:gap-12 items-center">
      <div class="space-y-3.5 sm:space-y-4 order-1">
        <h1
          class="hero-enter text-[1.45rem] sm:text-[1.875rem] lg:text-[2.15rem] font-bold text-on-surface leading-[1.22] tracking-tight"
          style="animation-delay: 0ms"
        >
          <template v-if="heroVariant === 'transform'">
            Créez votre CV et votre lettre de motivation<br class="hidden sm:block">
            en quelques minutes.
          </template>
          <template v-else>
            Tout ce qu'il faut pour réussir votre candidature.
          </template>
        </h1>

        <p
          class="hero-enter text-[0.9375rem] sm:text-base text-on-surface-variant max-w-lg leading-relaxed"
          style="animation-delay: 80ms"
        >
          Profilo'Z réunit CV, lettres de motivation, modèles professionnels et export PDF.
          L'ensemble de votre dossier de candidature, au même endroit.
        </p>

        <div
          class="hero-enter flex flex-col sm:flex-row sm:items-center gap-2.5"
          style="animation-delay: 120ms"
        >
          <NuxtLink
            to="/creer"
            class="btn-primary w-full sm:w-auto whitespace-nowrap text-sm sm:text-base premium-shadow-sm"
          >
            Commencer gratuitement
            <UiPzIcon name="arrow_forward" class="text-[17px]" />
          </NuxtLink>
          <NuxtLink
            to="/creer/lettre"
            class="btn-outline w-full sm:w-auto whitespace-nowrap text-sm"
          >
            <UiPzIcon name="mail" class="text-[17px] opacity-70" />
            Créer une lettre
          </NuxtLink>
        </div>

        <p
          class="hero-enter text-sm text-on-surface-variant/80"
          style="animation-delay: 200ms"
        >
          CV et lettre sans inscription · PDF immédiat · Compatible ATS
        </p>

        <p
          class="hero-enter flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-on-surface-variant/75"
          style="animation-delay: 260ms"
        >
          <template v-for="(step, i) in journeySteps" :key="step">
            <span v-if="i > 0" class="text-secondary/70 font-bold select-none" aria-hidden="true">→</span>
            <span>{{ step }}</span>
          </template>
        </p>
      </div>

      <div
        class="hero-enter order-2 w-full max-w-[560px] lg:max-w-none mx-auto lg:mx-0"
        style="animation-delay: 420ms"
      >
        <FeaturesLandingHeroProductDemo />
      </div>
    </div>
  </section>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .hero-enter {
    opacity: 1;
    animation: none;
  }
}
</style>
