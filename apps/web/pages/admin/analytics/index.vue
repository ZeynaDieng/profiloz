<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatNumber } = useAdminFormat()

const analytics = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    analytics.value = await adminService.getAnalytics()
  } catch {
    error.value = 'Impossible de charger les analytics.'
  } finally {
    loading.value = false
  }
})

const signups = computed(() => (analytics.value?.signups as Array<{ date: string; value: number }>) ?? [])
const revenue = computed(() => (analytics.value?.revenue as Array<{ date: string; value: number }>) ?? [])
const downloads = computed(() => (analytics.value?.downloads as Array<{ date: string; value: number }>) ?? [])
const resumes = computed(() => (analytics.value?.resumes as Array<{ date: string; value: number }>) ?? [])
const letters = computed(() => (analytics.value?.letters as Array<{ date: string; value: number }>) ?? [])
const conversion = computed(() => analytics.value?.conversion as { visits?: number; payments?: number; rate?: number } | undefined)
</script>

<template>
  <div>
    <AdminPageHeader title="Analytics" subtitle="Tendances sur 90 jours et conversion invité → paiement." />

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <div v-if="loading" class="grid grid-cols-1 xl:grid-cols-2 gap-gutter">
      <UiSkeleton v-for="i in 4" :key="i" variant="rect" height="12rem" />
    </div>

    <template v-else-if="analytics">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-gutter mb-gutter">
        <AdminStatCard label="Sessions invité" :value="formatNumber(conversion?.visits ?? 0)" />
        <AdminStatCard label="Paiements invité" :value="formatNumber(conversion?.payments ?? 0)" />
        <AdminStatCard label="Taux conversion" :value="`${conversion?.rate ?? 0} %`" />
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-gutter">
        <AdminLineChart title="Inscriptions" :series="signups" />
        <AdminLineChart title="Revenus (FCFA)" :series="revenue" />
        <AdminLineChart title="Téléchargements PDF" :series="downloads" />
        <AdminLineChart title="CV créés" :series="resumes" />
        <AdminLineChart title="Lettres créées" :series="letters" />
      </div>
    </template>
  </div>
</template>
