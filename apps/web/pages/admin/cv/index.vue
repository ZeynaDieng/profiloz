<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatDate } = useAdminFormat()
const route = useRoute()

const rows = ref<Record<string, unknown>[]>([])
const meta = ref({ page: 1, totalPages: 1, total: 0, limit: 20 })
const loading = ref(true)
const error = ref('')
const q = ref(String(route.query.q ?? ''))
const guest = ref('')
const userOnly = ref('')

async function load(page = 1) {
  loading.value = true
  try {
    const result = await adminService.listResumes({
      page,
      q: q.value || undefined,
      guest: guest.value === 'guest' ? '1' : undefined,
      user: userOnly.value === 'user' ? '1' : undefined,
    })
    rows.value = result.data
    meta.value = result.meta
  } catch {
    error.value = 'Impossible de charger les CV.'
  } finally {
    loading.value = false
  }
}

onMounted(() => load(1))

const columns = [
  { key: 'title', label: 'Titre' },
  { key: 'owner', label: 'Propriétaire' },
  { key: 'templateSlug', label: 'Modèle' },
  { key: 'isGuest', label: 'Type' },
  { key: 'createdAt', label: 'Créé' },
  { key: 'status', label: 'Statut' },
  { key: 'actions', label: 'Actions' },
]
</script>

<template>
  <div>
    <AdminPageHeader title="CV" subtitle="Tous les CV créés sur la plateforme.">
      <template #actions>
        <select v-model="guest" class="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" @change="load(1)">
          <option value="">Tous</option>
          <option value="guest">Invités</option>
        </select>
        <select v-model="userOnly" class="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" @change="load(1)">
          <option value="">Tous comptes</option>
          <option value="user">Connectés</option>
        </select>
        <input v-model="q" type="search" placeholder="Rechercher…" class="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" @keyup.enter="load(1)">
      </template>
    </AdminPageHeader>

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <AdminDataTable :columns="columns" :rows="rows" :loading="loading">
      <template #cell-isGuest="{ row }">{{ row.isGuest ? 'Invité' : 'Compte' }}</template>
      <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt as string) }}</template>
      <template #cell-status="{ row }"><AdminStatusBadge :status="String(row.status).toLowerCase()" /></template>
      <template #cell-actions="{ row }">
        <NuxtLink :to="`/admin/cv/${row.id}`" class="text-sm text-secondary font-semibold hover:underline">Gérer</NuxtLink>
      </template>
    </AdminDataTable>

    <AdminPagination :page="meta.page" :total-pages="meta.totalPages" :total="meta.total" @change="load" />
  </div>
</template>
