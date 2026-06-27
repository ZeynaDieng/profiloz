<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({ title: "Paiement annulé | Profilo'Z" })

const route = useRoute()
const resumeId = computed(() =>
  typeof route.query.resumeId === 'string' && route.query.resumeId ? route.query.resumeId : null,
)
</script>

<template>
  <div class="max-w-lg mx-auto px-margin-mobile py-20 text-center">
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-high text-on-surface-variant mb-6">
      <UiPzIcon name="info" class="text-[36px]" />
    </div>
    <h1 class="text-2xl font-bold text-on-surface mb-2">Paiement annulé</h1>
    <p class="text-on-surface-variant mb-6">
      Aucun montant n’a été débité. Vous pouvez réessayer quand vous le souhaitez.
    </p>

    <div class="flex flex-col sm:flex-row gap-3 justify-center">
      <NuxtLink
        :to="`/tarifs${resumeId ? `?resumeId=${resumeId}&reason=unlock` : ''}`"
        class="inline-flex items-center justify-center min-h-11 px-6 py-2.5 bg-primary text-on-primary rounded-lg font-bold"
      >
        Revoir les offres
      </NuxtLink>
      <NuxtLink
        to="/tableau-de-bord"
        class="inline-flex items-center justify-center min-h-11 px-6 py-2.5 border border-outline-variant rounded-lg font-bold text-on-surface hover:bg-surface-container-low"
      >
        Mes dossiers
      </NuxtLink>
    </div>
  </div>
</template>
