<script setup lang="ts">
import type { AdminUserRow } from '~/services/admin.service'

definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatDate } = useAdminFormat()
const route = useRoute()
const router = useRouter()

const users = ref<AdminUserRow[]>([])
const meta = ref({ page: 1, totalPages: 1, total: 0, limit: 20 })
const loading = ref(true)
const error = ref('')
const q = ref(String(route.query.q ?? ''))

async function load(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const result = await adminService.listUsers({ page, q: q.value || undefined })
    users.value = result.data
    meta.value = result.meta
  } catch {
    error.value = 'Impossible de charger les utilisateurs.'
  } finally {
    loading.value = false
  }
}

watch(q, useDebounceFn(() => {
  router.replace({ query: q.value ? { q: q.value } : {} })
  load(1)
}, 300))

onMounted(() => load(Number(route.query.page) || 1))

const columns = [
  { key: 'name', label: 'Nom' },
  { key: 'email', label: 'Email' },
  { key: 'createdAt', label: 'Inscription' },
  { key: 'lastLoginAt', label: 'Dernière connexion' },
  { key: 'resumeCount', label: 'CV' },
  { key: 'letterCount', label: 'Lettres' },
  { key: 'paymentCount', label: 'Paiements' },
  { key: 'status', label: 'Statut' },
  { key: 'actions', label: '' },
]
</script>

<template>
  <div>
    <AdminPageHeader title="Utilisateurs" subtitle="Gestion des comptes et abonnements.">
      <template #actions>
        <UiButton variant="ghost" size="sm" icon="download" @click="adminService.exportUsersCsv()">Export CSV</UiButton>
        <input
          v-model="q"
          type="search"
          placeholder="Rechercher…"
          class="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm min-w-[220px]"
        >
      </template>
    </AdminPageHeader>

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <AdminDataTable :columns="columns" :rows="users" :loading="loading" empty-message="Aucun utilisateur.">
      <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt as string) }}</template>
      <template #cell-lastLoginAt="{ row }">{{ formatDate(row.lastLoginAt as string, true) }}</template>
      <template #cell-status="{ row }"><AdminStatusBadge :status="row.status as string" /></template>
      <template #cell-actions="{ row }">
        <NuxtLink :to="`/admin/utilisateurs/${row.id}`" class="text-sm text-secondary font-semibold hover:underline">Voir</NuxtLink>
      </template>
    </AdminDataTable>

    <div v-if="meta.totalPages > 1" class="flex justify-center gap-2 mt-4">
      <UiButton variant="ghost" :disabled="meta.page <= 1" @click="load(meta.page - 1)">Précédent</UiButton>
      <span class="text-sm text-on-surface-variant self-center">Page {{ meta.page }} / {{ meta.totalPages }}</span>
      <UiButton variant="ghost" :disabled="meta.page >= meta.totalPages" @click="load(meta.page + 1)">Suivant</UiButton>
    </div>
  </div>
</template>
