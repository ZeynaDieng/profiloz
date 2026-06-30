<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatXof } = useAdminFormat()

const plans = ref<Awaited<ReturnType<typeof adminService.listPlans>>['data']>([])
const loading = ref(true)
const error = ref('')
const message = ref('')
const savingSlug = ref('')

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

async function savePlan(slug: string, priceXof: number, active: boolean) {
  savingSlug.value = slug
  message.value = ''
  try {
    await adminService.updatePlan(slug, { priceXof, active })
    const result = await adminService.listPlans()
    plans.value = result.data
    message.value = 'Offre mise à jour.'
  } catch {
    message.value = 'Échec de la mise à jour.'
  } finally {
    savingSlug.value = ''
  }
}
</script>

<template>
  <div>
    <AdminPageHeader title="Offres & Packs" subtitle="Ajustez prix et activation (persistés en base)." />

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />
    <UiMessageBanner v-if="message" variant="success" :message="message" class="mb-4" />

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
      <UiSkeleton v-for="i in 4" :key="i" variant="rect" height="14rem" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
      <UiCard v-for="plan in plans" :key="String(plan.slug)" padding="lg" class="bento-card">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 class="font-bold text-on-surface">{{ plan.name }}</h3>
            <p class="text-sm text-on-surface-variant">{{ plan.description }}</p>
          </div>
          <AdminStatusBadge :status="plan.active ? 'active' : 'FAILED'" />
        </div>

        <div class="flex items-end gap-2 mb-4">
          <label class="flex-1">
            <span class="text-xs text-on-surface-variant">Prix FCFA</span>
            <input
              :value="plan.priceXof"
              type="number"
              min="0"
              class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
              @change="(e) => plan.priceXof = Number((e.target as HTMLInputElement).value)"
            >
          </label>
          <label class="flex items-center gap-2 text-sm pb-2">
            <input
              type="checkbox"
              :checked="plan.active"
              @change="(e) => savePlan(String(plan.slug), Number(plan.priceXof), (e.target as HTMLInputElement).checked)"
            >
            Actif
          </label>
        </div>

        <UiButton
          variant="secondary"
          size="sm"
          :disabled="savingSlug === plan.slug"
          @click="savePlan(String(plan.slug), Number(plan.priceXof), Boolean(plan.active))"
        >
          Enregistrer
        </UiButton>
      </UiCard>
    </div>
  </div>
</template>
