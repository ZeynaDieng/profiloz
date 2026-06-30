<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatXof } = useAdminFormat()

const plans = ref<Awaited<ReturnType<typeof adminService.listPlans>>['data']>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const result = await adminService.listPlans()
    plans.value = result.data
  } catch {
    error.value = 'Impossible de charger les offres.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <AdminPageHeader title="Offres & Packs" subtitle="Catalogue tarifaire Profilo’Z." />

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
      <UiSkeleton v-for="i in 4" :key="i" variant="rect" height="12rem" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
      <UiCard v-for="plan in plans" :key="String(plan.slug)" padding="lg" class="bento-card">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 class="font-bold text-on-surface">{{ plan.name }}</h3>
            <p class="text-sm text-on-surface-variant">{{ plan.description }}</p>
          </div>
          <AdminStatusBadge status="active" />
        </div>
        <p class="text-2xl font-bold text-secondary mb-3">{{ formatXof(Number(plan.priceXof)) }}</p>
        <ul class="text-sm text-on-surface-variant space-y-1 mb-4">
          <li v-for="(feature, idx) in (plan.features as string[])" :key="idx">• {{ feature }}</li>
        </ul>
        <p class="text-xs text-on-surface-variant">{{ plan.note }}</p>
      </UiCard>
    </div>
  </div>
</template>
