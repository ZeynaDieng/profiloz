<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatDate } = useAdminFormat()

const rows = ref<Record<string, unknown>[]>([])
const meta = ref({ page: 1, totalPages: 1, total: 0, limit: 20 })
const loading = ref(true)
const error = ref('')
const q = ref('')

async function load(page = 1) {
  loading.value = true
  try {
    const result = await adminService.listLetters({ page, q: q.value || undefined })
    rows.value = result.data
    meta.value = result.meta
  } catch {
    error.value = 'Impossible de charger les lettres.'
  } finally {
    loading.value = false
  }
}

onMounted(() => load(1))

const columns = [
  { key: 'title', label: 'Titre' },
  { key: 'owner', label: 'Propriétaire' },
  { key: 'templateId', label: 'Modèle' },
  { key: 'createdAt', label: 'Créé' },
  { key: 'actions', label: 'Actions' },
]
</script>

<template>
  <div>
    <AdminPageHeader title="Lettres de motivation" subtitle="Historique des lettres créées.">
      <template #actions>
        <input v-model="q" type="search" placeholder="Rechercher…" class="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" @keyup.enter="load(1)">
        <UiButton variant="secondary" @click="load(1)">Filtrer</UiButton>
      </template>
    </AdminPageHeader>

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <AdminDataTable :columns="columns" :rows="rows" :loading="loading">
      <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt as string) }}</template>
      <template #cell-actions="{ row }">
        <NuxtLink :to="`/admin/lettres/${row.id}`" class="text-sm text-secondary font-semibold hover:underline">Gérer</NuxtLink>
      </template>
    </AdminDataTable>

    <AdminPagination :page="meta.page" :total-pages="meta.totalPages" :total="meta.total" @change="load" />
  </div>
</template>
