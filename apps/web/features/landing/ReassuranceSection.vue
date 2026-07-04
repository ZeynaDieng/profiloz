<script setup lang="ts">
import type { LandingAccent } from '~/utils/landing-accents'
import { accentClasses } from '~/utils/landing-accents'

const items: Array<{
  icon: string
  title: string
  description: string
  accent: LandingAccent
}> = [
  {
    icon: 'verified_user',
    title: 'Compatible ATS',
    description: 'Modèles structurés pour les logiciels de recrutement.',
    accent: 'blue',
  },
  {
    icon: 'person_off',
    title: 'Sans inscription',
    description: 'CV en mode invité. Compte gratuit pour sauvegarder.',
    accent: 'teal',
  },
  {
    icon: 'bolt',
    title: 'PDF immédiat',
    description: 'Téléchargez vos documents en quelques minutes.',
    accent: 'orange',
  },
  {
    icon: 'lock',
    title: 'Données sécurisées',
    description: 'Vos informations protégées et conservées de manière responsable.',
    accent: 'green',
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
      <div class="reassurance-stats grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-gutter pb-10 md:pb-12 mb-10 md:mb-12 border-b border-outline-variant/15">
        <FeaturesLandingStatItem :end="12000" suffix="+" label="CV créés" />
        <FeaturesLandingStatItem :end="8" suffix=" min" label="Temps moyen" />
        <FeaturesLandingStatItem :end="100" suffix="%" label="Compatible ATS" />
        <FeaturesLandingStatItem :end="24" suffix="/7" label="Disponible" />
      </div>

      <div class="landing-section-header landing-section-header--left !pt-0">
        <p class="landing-eyebrow">Confiance</p>
        <h2 class="landing-title">Simple et fiable</h2>
        <p class="landing-lead !max-w-xl">
          Préparez votre dossier en toute confiance, sans compromis sur la qualité.
        </p>
      </div>

      <div class="mobile-scroll-x sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-gutter">
        <UiCard
          v-for="(item, index) in items"
          :key="item.title"
          variant="default"
          padding="md"
          class="reassurance-card mobile-scroll-card-sm premium-card flex flex-col items-center text-center gap-2 sm:gap-3 !py-4 sm:!py-stack-md"
          :class="[
            accentClasses(item.accent).border,
            revealed && 'reassurance-card--revealed',
          ]"
          :style="{ '--card-i': index }"
        >
          <div
            class="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl"
            :class="[accentClasses(item.accent).iconBg, accentClasses(item.accent).icon]"
          >
            <UiPzIcon :name="item.icon" class="text-[22px] sm:text-[24px]" />
          </div>
          <h3 class="landing-card-title">{{ item.title }}</h3>
          <p class="text-xs sm:text-sm text-on-surface-variant leading-snug line-clamp-2 sm:line-clamp-none">
            {{ item.description }}
          </p>
        </UiCard>
      </div>
    </div>
  </section>
</template>

<style scoped>
.reassurance-stats :deep(p.tabular-nums) {
  color: var(--color-secondary);
}

.reassurance-card {
  border-width: 1px;
  box-shadow: var(--shadow-elevated-sm);
  transition:
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.35s ease;
}

.reassurance-card--revealed {
  animation: reassurance-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--card-i, 0) * 80ms + 80ms);
}

@keyframes reassurance-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (hover: hover) {
  .reassurance-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-elevated-md);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reassurance-card--revealed {
    animation: none;
  }

  .reassurance-card {
    transition: none;
  }
}
</style>
