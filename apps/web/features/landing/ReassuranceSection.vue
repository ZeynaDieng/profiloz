<script setup lang="ts">
const items = [
  {
    icon: 'verified_user',
    title: 'Compatible ATS',
    description: 'Modèles structurés pour une lecture optimale par les logiciels de recrutement.',
  },
  {
    icon: 'person_off',
    title: 'Sans inscription obligatoire',
    description: 'Créez votre CV en mode invité. Compte gratuit pour sauvegarder CV et lettres.',
  },
  {
    icon: 'bolt',
    title: 'Téléchargement PDF immédiat',
    description: 'Obtenez vos documents en PDF en quelques minutes, dès la fin du parcours.',
  },
  {
    icon: 'lock',
    title: 'Données sécurisées',
    description: 'Vos documents et informations sont protégés et conservés de façon responsable.',
  },
]
</script>

<template>
  <section id="reassurance" class="py-12 md:py-20 bg-surface-container-low border-t border-outline-variant/30">
    <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
      <div class="text-center mb-10 md:mb-12 space-y-3">
        <h2 class="text-xl sm:text-2xl font-bold text-on-surface">Simple, fiable, sans engagement</h2>
        <p class="text-on-surface-variant max-w-2xl mx-auto text-sm sm:text-base">
          Tout ce qu'il faut pour préparer votre dossier de candidature en toute confiance.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div
          v-for="item in items"
          :key="item.title"
          class="flex flex-col items-center text-center gap-3 p-stack-md rounded-2xl bg-surface-container-lowest border border-outline-variant/30"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UiPzIcon :name="item.icon" class="text-[24px]" />
          </div>
          <h3 class="font-bold text-on-surface">{{ item.title }}</h3>
          <p class="text-sm text-on-surface-variant leading-relaxed">{{ item.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
