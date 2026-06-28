<script setup lang="ts">
const journeySteps = [
  "CV ou lettre",
  "Choisir un modèle",
  "Exporter en PDF",
] as const;

const highlights = [
  { icon: "description", label: "CV professionnels" },
  { icon: "mail", label: "Lettres de motivation" },
  { icon: "palette", label: "Modèles modernes" },
  { icon: "download", label: "Export PDF" },
] as const;

const config = useRuntimeConfig();
const heroVariant = computed(() =>
  (config.public.heroVariant as string) === "start" ? "start" : "transform",
);
</script>

<template>
  <section
    class="hero-section max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-6 md:pt-8 pb-10 md:pb-14"
  >
    <div
      class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 xl:gap-12 items-center"
    >
      <div class="space-y-3.5 sm:space-y-4 order-1">
        <h1
          class="hero-fade hero-fade-2 text-[1.45rem] sm:text-[1.875rem] lg:text-[2.15rem] font-bold text-on-surface leading-[1.22] tracking-tight"
        >
          <template v-if="heroVariant === 'transform'">
            Créez votre CV et votre lettre de motivation<br
              class="hidden sm:block"
            />
            en quelques minutes.
          </template>
          <template v-else>
            Tout ce qu'il faut pour réussir votre candidature.
          </template>
        </h1>

        <p
          class="hero-fade hero-fade-3 text-[0.9375rem] sm:text-base text-on-surface-variant max-w-lg leading-relaxed"
        >
          Profilo'Z réunit CV, lettres de motivation, modèles professionnels et
          export PDF l'ensemble de votre dossier de candidature, au même
          endroit.
        </p>

        <ul class="hero-fade hero-fade-3b flex flex-wrap gap-2 pt-0.5">
          <li
            v-for="item in highlights"
            :key="item.label"
            class="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-3 py-1 text-xs sm:text-sm text-on-surface"
          >
            <UiPzIcon :name="item.icon" class="text-[15px] text-secondary" />
            {{ item.label }}
          </li>
        </ul>

        <div
          class="hero-fade hero-fade-4 flex flex-col sm:flex-row sm:items-center gap-2.5"
        >
          <NuxtLink
            to="/creer"
            class="hero-cta-primary inline-flex items-center justify-center gap-1.5 bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold shadow-lg w-full sm:w-auto whitespace-nowrap text-sm sm:text-base"
          >
            Commencer gratuitement
            <UiPzIcon name="arrow_forward" class="text-[17px]" />
          </NuxtLink>
          <NuxtLink
            to="/inscription?redirect=/tableau-de-bord/lettres/nouvelle"
            class="hero-cta-secondary inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:text-secondary transition-colors w-full sm:w-auto whitespace-nowrap"
          >
            <UiPzIcon name="mail" class="text-[17px] opacity-70" />
            Créer une lettre
          </NuxtLink>
        </div>

        <p class="hero-fade hero-fade-5 text-sm text-on-surface-variant/80">
          CV sans inscription · Compte gratuit pour les lettres · PDF immédiat ·
          Compatible ATS
        </p>

        <p
          class="hero-fade hero-fade-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-on-surface-variant/75"
        >
          <template v-for="(step, i) in journeySteps" :key="step">
            <span
              v-if="i > 0"
              class="text-secondary/70 font-bold select-none"
              aria-hidden="true"
              >→</span
            >
            <span>{{ step }}</span>
          </template>
        </p>
      </div>

      <div
        class="hero-fade hero-fade-7 order-2 w-full max-w-[560px] lg:max-w-none mx-auto lg:mx-0"
      >
        <FeaturesLandingHeroTransformVisual />
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-fade {
  opacity: 0;
  animation: hero-fade-up 0.55s ease forwards;
}

.hero-fade-2 {
  animation-delay: 0.06s;
}
.hero-fade-3 {
  animation-delay: 0.12s;
}
.hero-fade-3b {
  animation-delay: 0.15s;
}
.hero-fade-4 {
  animation-delay: 0.18s;
}
.hero-fade-5 {
  animation-delay: 0.24s;
}
.hero-fade-6 {
  animation-delay: 0.3s;
}
.hero-fade-7 {
  animation-delay: 0.36s;
}

@keyframes hero-fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-cta-primary {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.hero-cta-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.14);
}

.hero-cta-primary:active,
.hero-cta-secondary:active {
  transform: scale(0.98);
}
</style>
