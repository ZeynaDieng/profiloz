<script setup lang="ts">
const features = [
  {
    icon: "upload_file",
    title: "Import intelligent",
    description:
      "Importez CV Les informations sont organisées automatiquement.",
  },
  {
    icon: "palette",
    title: "Modèles professionnels",
    description:
      "Des modèles modernes pour votre CV et vos lettres de motivation.",
  },
  {
    icon: "mail",
    title: "Lettres de motivation",
    description:
      "Créez ou personnalisez une lettre professionnelle adaptée à votre candidature.",
  },
  {
    icon: "download",
    title: "Téléchargement PDF",
    description:
      "Exportez CV et lettres en PDF haute qualité, prêts à envoyer.",
  },
];
</script>

<template>
  <section id="features" class="bg-surface-container-low py-12 md:py-20">
    <div
      class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop"
    >
      <div class="text-center mb-8 md:mb-12 space-y-3">
        <h2 class="text-xl sm:text-2xl font-bold text-on-surface">
          Une plateforme complète pour votre candidature
        </h2>
        <p
          class="text-on-surface-variant max-w-2xl mx-auto text-sm sm:text-base"
        >
          CV, lettres, modèles et export PDF simple, rapide, sans jargon
          technique.
        </p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="bento-card p-stack-md md:p-stack-lg bg-surface-container-lowest rounded-2xl border border-outline-variant/30 flex flex-col gap-3"
        >
          <div
            class="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0"
          >
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
