<script setup lang="ts">
import { MSG } from '@profiloz/shared'

definePageMeta({ layout: 'default' })

useSeoPage({ title: 'Paiement annulé', noindex: true })

const route = useRoute()
const resumeId = computed(() =>
  typeof route.query.resumeId === 'string' && route.query.resumeId ? route.query.resumeId : null,
)

const tarifsLink = computed(() =>
  `/tarifs${resumeId.value ? `?resumeId=${resumeId.value}&reason=unlock` : ''}`,
)
</script>

<template>
  <div class="page-container max-w-lg mx-auto py-12 md:py-20 text-center">
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-high text-on-surface-variant mb-6">
      <UiPzIcon name="info" class="text-[36px]" />
    </div>
    <h1 class="text-2xl sm:text-3xl font-bold text-on-surface mb-2">{{ MSG.payment.cancelled }}</h1>
    <p class="text-on-surface-variant mb-6 text-sm sm:text-base">
      {{ MSG.payment.cancelledDetail }}
    </p>

    <div class="flex flex-col gap-3">
      <NuxtLink :to="tarifsLink">
        <UiButton variant="primary" block>Revoir les offres</UiButton>
      </NuxtLink>
      <NuxtLink to="/tableau-de-bord">
        <UiButton variant="outline" block>Mes dossiers</UiButton>
      </NuxtLink>
    </div>
  </div>
</template>
