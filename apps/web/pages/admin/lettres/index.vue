<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatDate } = useAdminFormat()

const rows = ref<Record<string, unknown>[]>([])
const loading = ref(true)
const error = ref('')
const q = ref('')

async function load() {
  loading.value = true
  try {
    const result = await adminService.listLetters({ q: q.value || undefined })
    rows.value = result.data
  } catch {
    error.value = 'Impossible de charger les lettres.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const columns = [
  { key: 'title', label: 'Titre' },
  { key: 'owner', label: 'Propriétaire' },
  { key: 'templateId', label: 'Modèle' },
  { key: 'createdAt', label: 'Créé' },
]
</script>

<template>
  <div>
    <AdminPageHeader title="Lettres de motivation" subtitle="Historique des lettres créées.">
      <template #actions>
        <input v-model="q" type="search" placeholder="Rechercher…" class="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" @keyup.enter="load">
        <UiButton variant="secondary" @click="load">Filtrer</UiButton>
      </template>
    </AdminPageHeader>

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <AdminDataTable :columns="columns" :rows="rows" :loading="loading">
      <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt as string) }}</template>
    </AdminDataTable>
  </div>
</template>
