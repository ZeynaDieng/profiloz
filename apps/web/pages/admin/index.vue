<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const stats = ref<Awaited<ReturnType<typeof adminService.getStats>> | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    stats.value = await adminService.getStats()
  } catch {
    error.value = 'Impossible de charger les statistiques admin.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <header class="mb-stack-lg">
      <h1 class="text-2xl md:text-3xl font-bold text-on-surface">Administration Profilo’Z</h1>
      <p class="text-on-surface-variant mt-1">Vue d’ensemble de la plateforme.</p>
    </header>

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
      <UiSkeleton v-for="i in 4" :key="i" variant="rect" height="7rem" />
    </div>

    <div v-else-if="stats" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter mb-stack-lg">
      <UiCard padding="lg" class="bento-card">
        <p class="text-sm text-on-surface-variant">Organisations</p>
        <p class="text-3xl font-bold text-on-surface mt-1">{{ stats.organizations }}</p>
      </UiCard>
      <UiCard padding="lg" class="bento-card">
        <p class="text-sm text-on-surface-variant">Utilisateurs</p>
        <p class="text-3xl font-bold text-on-surface mt-1">{{ stats.users }}</p>
      </UiCard>
      <UiCard padding="lg" class="bento-card">
        <p class="text-sm text-on-surface-variant">Paiements confirmés</p>
        <p class="text-3xl font-bold text-on-surface mt-1">{{ stats.paidPayments }}</p>
      </UiCard>
      <UiCard padding="lg" class="bento-card">
        <p class="text-sm text-on-surface-variant">Business actifs</p>
        <p class="text-3xl font-bold text-on-surface mt-1">{{ stats.activeBusinessOrganizations }}</p>
      </UiCard>
    </div>

    <UiCard padding="lg">
      <h2 class="font-bold text-on-surface mb-2">Gestion</h2>
      <p class="text-sm text-on-surface-variant mb-4">
        Consultez et gérez les organisations clientes (abonnements Business, membres, dossiers).
      </p>
      <NuxtLink to="/admin/organisations">
        <UiButton variant="secondary" icon="domain">Voir les organisations</UiButton>
      </NuxtLink>
    </UiCard>
  </div>
</template>
