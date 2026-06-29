<script setup lang="ts">
defineProps<{
  title: string
  updated?: string
}>()
</script>

<template>
  <article class="page-container max-w-3xl mx-auto py-8 md:py-16">
    <NuxtLink
      to="/"
      class="inline-flex items-center gap-1 text-secondary font-medium text-sm mb-6 min-h-11 hover:underline"
    >
      <UiPzIcon name="arrow_back" class="text-[18px]" />
      Retour à l'accueil
    </NuxtLink>

    <header class="mb-8 md:mb-10">
      <h1 class="text-2xl sm:text-3xl font-bold text-on-surface mb-2">{{ title }}</h1>
      <p v-if="updated" class="text-sm text-on-surface-variant">Dernière mise à jour : {{ updated }}</p>
    </header>

    <div class="prose-legal">
      <slot />
    </div>
  </article>
</template>
