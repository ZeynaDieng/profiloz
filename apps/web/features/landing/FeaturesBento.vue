<script setup lang="ts">
const features = [
  {
    icon: 'document_scanner',
    title: 'Importez votre ancien CV en quelques secondes',
    description: 'PDF, Word ou photo : on extrait l\'essentiel pour que vous n\'ayez pas à tout retaper.',
  },
  {
    icon: 'design_services',
    title: 'Un CV qui fait bonne impression',
    description: 'Des modèles pensés pour les recruteurs et les logiciels de sélection (ATS).',
  },
  {
    icon: 'edit_note',
    title: 'Une lettre pour chaque candidature',
    description: 'Personnalisez votre message de motivation sans repartir d\'une page blanche.',
  },
  {
    icon: 'picture_as_pdf',
    title: 'Téléchargez et envoyez',
    description: 'Obtenez un PDF propre et prêt à envoyer, directement depuis votre téléphone.',
  },
]

const { target, revealed } = useScrollReveal()
</script>

<template>
  <section id="features" class="landing-section bg-surface-container-low">
    <div
      ref="target"
      class="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop overflow-hidden"
      :class="revealed ? 'scroll-reveal is-revealed' : 'scroll-reveal'"
    >
      <div class="landing-section-header text-center">
        <h2 class="text-xl sm:text-2xl font-bold text-on-surface">
          Une plateforme complète pour votre candidature
        </h2>
        <p class="text-on-surface-variant max-w-2xl mx-auto text-sm sm:text-base">
          Simple, rapide, sans jargon technique.
        </p>
      </div>

      <p class="text-xs text-on-surface-variant mb-3 sm:hidden">Glissez pour découvrir →</p>

      <div class="mobile-scroll-x sm:grid sm:grid-cols-2 xl:grid-cols-4 sm:gap-gutter">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="mobile-scroll-card bento-card premium-card p-stack-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 flex flex-col gap-3"
        >
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-secondary/15 to-secondary/5 text-secondary flex items-center justify-center shrink-0 premium-icon-wrap pz-icon-hover">
            <UiPzIcon :name="feature.icon" class="text-[22px]" />
          </div>
          <h3 class="font-bold text-on-surface text-base leading-snug">{{ feature.title }}</h3>
          <p class="text-on-surface-variant text-sm leading-relaxed">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
