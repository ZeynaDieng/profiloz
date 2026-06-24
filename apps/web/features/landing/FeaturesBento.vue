<script setup lang="ts">
const features = [
  {
    icon: 'upload_file',
    title: 'Import intelligent',
    description:
      'Importez CV, diplômes et attestations. Les informations sont organisées automatiquement.',
  },
  {
    icon: 'palette',
    title: 'Modèles professionnels',
    description: 'Choisissez parmi plusieurs modèles adaptés à votre profil.',
  },
  {
    icon: 'download',
    title: 'Téléchargement PDF',
    description: 'Téléchargez immédiatement un CV prêt à envoyer.',
  },
]
</script>

<template>
  <section id="features" class="bg-surface-container-low py-12 md:py-20">
    <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
      <div class="text-center mb-8 md:mb-12 space-y-3">
        <h2 class="text-xl sm:text-2xl font-bold text-on-surface">
          Tout ce qu'il faut pour un CV prêt à envoyer
        </h2>
        <p class="text-on-surface-variant max-w-2xl mx-auto text-sm sm:text-base">
          Simple, rapide, sans jargon technique.
        </p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="bento-card p-stack-md md:p-stack-lg bg-surface-container-lowest rounded-2xl border border-outline-variant/30 flex flex-col gap-3"
        >
          <div class="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <UiPzIcon :name="feature.icon" />
          </div>
          <h3 class="font-bold text-on-surface text-lg">{{ feature.title }}</h3>
          <p class="text-on-surface-variant text-sm leading-relaxed">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
