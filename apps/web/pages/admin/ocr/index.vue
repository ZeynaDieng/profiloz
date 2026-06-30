<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatNumber, formatMs } = useAdminFormat()

const stats = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    stats.value = await adminService.getOcrStats()
  } catch {
    error.value = 'Impossible de charger les statistiques OCR.'
  } finally {
    loading.value = false
  }
})

const formats = computed(() => (stats.value?.formats as Array<{ mimeType: string; count: number }>) ?? [])
const errors = computed(() => (stats.value?.recentErrors as Array<{ id: string; name: string; at: string }>) ?? [])
</script>

<template>
  <div>
    <AdminPageHeader title="OCR & IA" subtitle="Performance d’analyse documentaire." />

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <div v-if="loading" class="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
      <UiSkeleton v-for="i in 4" :key="i" variant="rect" height="7rem" />
    </div>

    <template v-else-if="stats">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-gutter mb-gutter">
        <AdminStatCard label="Fichiers analysés" :value="formatNumber(Number(stats.analyzedFiles))" />
        <AdminStatCard label="Taux de réussite" :value="`${stats.successRate} %`" />
        <AdminStatCard label="Temps moyen" :value="formatMs(Number(stats.averageProcessingMs))" />
        <AdminStatCard label="Erreurs" :value="formatNumber(Number(stats.failed))" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <UiCard padding="lg">
          <h3 class="font-semibold text-on-surface mb-3">Formats utilisés</h3>
          <ul class="space-y-2">
            <li v-for="f in formats" :key="f.mimeType" class="flex justify-between text-sm">
              <span class="text-on-surface-variant">{{ f.mimeType }}</span>
              <span class="font-semibold">{{ f.count }}</span>
            </li>
          </ul>
        </UiCard>

        <UiCard padding="lg">
          <h3 class="font-semibold text-on-surface mb-3">Erreurs récentes</h3>
          <ul v-if="errors.length" class="space-y-2 text-sm">
            <li v-for="e in errors" :key="e.id" class="flex justify-between gap-2">
              <span class="truncate">{{ e.name }}</span>
              <AdminStatusBadge status="FAILED" />
            </li>
          </ul>
          <p v-else class="text-sm text-on-surface-variant">Aucune erreur récente.</p>
        </UiCard>
      </div>
    </template>
  </div>
</template>
