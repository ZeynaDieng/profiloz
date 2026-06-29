<script setup lang="ts">
const items = [
  {
    icon: 'verified_user',
    title: 'Compatible ATS',
    description: 'Modèles structurés pour les logiciels de recrutement.',
  },
  {
    icon: 'person_off',
    title: 'Sans inscription',
    description: 'CV en mode invité. Compte gratuit pour sauvegarder.',
  },
  {
    icon: 'bolt',
    title: 'PDF immédiat',
    description: 'Téléchargez vos documents en quelques minutes.',
  },
  {
    icon: 'lock',
    title: 'Données sécurisées',
    description: 'Vos informations protégées et conservées de manière responsable.',
  },
]

const { target, revealed } = useScrollReveal(0.15)
</script>

<template>
  <section
    id="reassurance"
    ref="target"
    class="landing-section bg-surface-container-low border-t border-outline-variant/30"
    :class="revealed ? 'scroll-reveal is-revealed' : 'scroll-reveal'"
  >
    <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop overflow-hidden">
      <ul class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-gutter pb-8 md:pb-10 mb-8 md:mb-10 border-b border-outline-variant/15">
        <FeaturesLandingStatItem :end="12000" suffix="+" label="CV créés" />
        <FeaturesLandingStatItem :end="8" suffix=" min" label="Temps moyen" />
        <FeaturesLandingStatItem :end="100" suffix="%" label="Compatible ATS" />
        <FeaturesLandingStatItem :end="24" suffix="/7" label="Disponible" />
      </ul>

      <div class="landing-section-header text-center !pt-0">
        <h2 class="text-xl sm:text-2xl font-bold text-on-surface">Simple et fiable</h2>
        <p class="text-on-surface-variant text-sm hidden sm:block max-w-2xl mx-auto">
          Préparez votre dossier en toute confiance.
        </p>
      </div>

      <div class="mobile-scroll-x sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-gutter">
        <UiCard
          v-for="item in items"
          :key="item.title"
          variant="default"
          padding="md"
          class="mobile-scroll-card-sm premium-card flex flex-col items-center text-center gap-2 sm:gap-3 !py-4 sm:!py-stack-md"
        >
          <div class="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UiPzIcon :name="item.icon" class="text-[22px] sm:text-[24px]" />
          </div>
          <h3 class="font-bold text-on-surface text-sm sm:text-base">{{ item.title }}</h3>
          <p class="text-xs sm:text-sm text-on-surface-variant leading-snug line-clamp-2 sm:line-clamp-none">
            {{ item.description }}
          </p>
        </UiCard>
      </div>
    </div>
  </section>
</template>
