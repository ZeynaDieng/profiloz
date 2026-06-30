<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatDate } = useAdminFormat()

const rows = ref<Record<string, unknown>[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const result = await adminService.listPdfJobs()
    rows.value = result.data
  } catch {
    error.value = 'Impossible de charger les PDF.'
  } finally {
    loading.value = false
  }
})

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'resumeId', label: 'CV' },
  { key: 'status', label: 'Statut' },
  { key: 'createdAt', label: 'Créé' },
  { key: 'completedAt', label: 'Terminé' },
]
</script>

<template>
  <div>
    <AdminPageHeader title="Documents PDF" subtitle="Jobs de génération PDF et exports." />

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <AdminDataTable :columns="columns" :rows="rows" :loading="loading">
      <template #cell-id="{ row }"><span class="font-mono text-xs">{{ String(row.id).slice(0, 8) }}…</span></template>
      <template #cell-status="{ row }"><AdminStatusBadge :status="String(row.status)" /></template>
      <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt as string, true) }}</template>
      <template #cell-completedAt="{ row }">{{ formatDate(row.completedAt as string, true) }}</template>
    </AdminDataTable>
  </div>
</template>
