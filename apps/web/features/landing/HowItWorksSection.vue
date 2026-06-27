<script setup lang="ts">
const steps = [
  {
    number: 1,
    icon: 'upload_file',
    title: 'Importer ou créer vos documents',
    description: 'Partez de votre CV existant ou rédigez CV et lettre de motivation étape par étape.',
  },
  {
    number: 2,
    icon: 'edit_note',
    title: 'Compléter ou corriger les informations',
    description: 'Vérifiez chaque section, ajustez le contenu et ajoutez ce qui manque en quelques clics.',
  },
  {
    number: 3,
    icon: 'palette',
    title: 'Choisir un modèle professionnel',
    description: 'Comparez les modèles, personnalisez les couleurs et visualisez le rendu final en direct.',
  },
  {
    number: 4,
    icon: 'download',
    title: 'Télécharger vos PDF',
    description: 'Exportez CV et lettre en PDF prêts à envoyer, compatibles recruteurs et systèmes ATS.',
  },
]
</script>

<template>
  <section id="comment-ca-marche" class="py-12 md:py-20 bg-white border-t border-outline-variant/30">
    <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
      <div class="text-center mb-10 md:mb-14 space-y-3">
        <h2 class="text-xl sm:text-2xl font-bold text-on-surface">Comment ça marche</h2>
        <p class="text-on-surface-variant max-w-2xl mx-auto text-sm sm:text-base">
          Quatre étapes simples, sans prise de tête.
        </p>
      </div>

      <ol class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
        <li
          v-for="step in steps"
          :key="step.number"
          class="relative flex flex-col gap-4 p-stack-md md:p-stack-lg rounded-2xl border border-outline-variant/30 bg-surface-container-lowest"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary text-sm font-bold"
              aria-hidden="true"
            >
              {{ step.number }}
            </span>
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <UiPzIcon :name="step.icon" />
            </div>
          </div>
          <h3 class="font-bold text-on-surface text-base leading-snug">{{ step.title }}</h3>
          <p class="text-sm text-on-surface-variant leading-relaxed">{{ step.description }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>
