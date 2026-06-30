<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatDate, formatXof } = useAdminFormat()
const route = useRoute()

const rows = ref<Record<string, unknown>[]>([])
const summary = ref<Record<string, number>>({})
const meta = ref({ page: 1, totalPages: 1, total: 0, limit: 20 })
const loading = ref(true)
const error = ref('')
const status = ref(String(route.query.status ?? ''))
const q = ref(String(route.query.q ?? ''))

async function load(page = 1) {
  loading.value = true
  try {
    const result = await adminService.listPayments({
      page,
      status: status.value || undefined,
      q: q.value || undefined,
    })
    rows.value = result.data
    summary.value = result.summary
    meta.value = result.meta
  } catch {
    error.value = 'Impossible de charger les paiements.'
  } finally {
    loading.value = false
  }
}

onMounted(() => load(1))

function paymentUserName(row: Record<string, unknown>) {
  const user = row.user as { name?: string } | null | undefined
  return user?.name ?? '—'
}

const columns = [
  { key: 'providerRef', label: 'Référence' },
  { key: 'user', label: 'Utilisateur' },
  { key: 'planSlug', label: 'Offre' },
  { key: 'amountXof', label: 'Montant' },
  { key: 'status', label: 'Statut' },
  { key: 'createdAt', label: 'Date' },
  { key: 'actions', label: 'Actions' },
]
</script>

<template>
  <div>
    <AdminPageHeader title="Paiements" subtitle="Suivi financier et transactions PayTech.">
      <template #actions>
        <UiButton variant="ghost" size="sm" icon="download" @click="adminService.exportPaymentsCsv()">Export CSV</UiButton>
        <select v-model="status" class="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" @change="load(1)">
          <option value="">Tous statuts</option>
          <option value="PAID">Payés</option>
          <option value="PENDING">En attente</option>
          <option value="FAILED">Échoués</option>
          <option value="CANCELED">Annulés</option>
        </select>
        <input v-model="q" type="search" placeholder="Rechercher…" class="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" @keyup.enter="load(1)">
      </template>
    </AdminPageHeader>

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <div v-if="!loading" class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-gutter mb-gutter">
      <AdminStatCard label="CA total" :value="formatXof(summary.totalRevenue ?? 0)" />
      <AdminStatCard label="Aujourd’hui" :value="formatXof(summary.todayRevenue ?? 0)" />
      <AdminStatCard label="Ce mois" :value="formatXof(summary.monthRevenue ?? 0)" />
      <AdminStatCard label="Réussis" :value="String(summary.paidCount ?? 0)" />
      <AdminStatCard label="Échoués" :value="String(summary.failedCount ?? 0)" />
      <AdminStatCard label="Annulés" :value="String(summary.canceledCount ?? summary.refundsCount ?? 0)" />
    </div>

    <AdminDataTable :columns="columns" :rows="rows" :loading="loading">
      <template #cell-user="{ row }">{{ paymentUserName(row) }}</template>
      <template #cell-amountXof="{ row }">{{ formatXof(Number(row.amountXof)) }}</template>
      <template #cell-status="{ row }"><AdminStatusBadge :status="String(row.status)" /></template>
      <template #cell-createdAt="{ row }">{{ formatDate(String(row.createdAt), true) }}</template>
      <template #cell-actions="{ row }">
        <NuxtLink :to="`/admin/paiements/${row.id}`" class="text-sm text-secondary font-semibold hover:underline">Détail</NuxtLink>
      </template>
    </AdminDataTable>

    <AdminPagination :page="meta.page" :total-pages="meta.totalPages" :total="meta.total" @change="load" />
  </div>
</template>
