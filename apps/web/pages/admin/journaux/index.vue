<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatDate } = useAdminFormat()

const rows = ref<Record<string, unknown>[]>([])
const loading = ref(true)
const error = ref('')
const type = ref('all')
const q = ref('')

async function load() {
  loading.value = true
  try {
    const result = await adminService.getLogs({ type: type.value, q: q.value || undefined })
    rows.value = result.data
  } catch {
    error.value = 'Impossible de charger les journaux.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const columns = [
  { key: 'type', label: 'Type' },
  { key: 'message', label: 'Événement' },
  { key: 'meta', label: 'Détail' },
  { key: 'at', label: 'Date' },
]
</script>

<template>
  <div>
    <AdminPageHeader title="Journaux" subtitle="Connexions, paiements, téléchargements, erreurs et OCR.">
      <template #actions>
        <select v-model="type" class="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" @change="load">
          <option value="all">Tous</option>
          <option value="connections">Connexions</option>
          <option value="payments">Paiements</option>
          <option value="downloads">Téléchargements</option>
          <option value="errors">Erreurs</option>
          <option value="ocr">OCR</option>
          <option value="admin">Actions admin</option>
        </select>
        <input v-model="q" type="search" placeholder="Rechercher…" class="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" @keyup.enter="load">
        <UiButton variant="secondary" @click="load">Filtrer</UiButton>
      </template>
    </AdminPageHeader>

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <AdminDataTable :columns="columns" :rows="rows" :loading="loading">
      <template #cell-type="{ row }"><AdminStatusBadge :status="String(row.type)" /></template>
      <template #cell-at="{ row }">{{ formatDate(row.at as string, true) }}</template>
    </AdminDataTable>
  </div>
</template>
