<script setup lang="ts">
import type { AdminDashboard } from '~/services/admin.service'

definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatXof, formatNumber } = useAdminFormat()

const dashboard = ref<AdminDashboard | null>(null)
const health = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const [dash, healthData] = await Promise.all([
      adminService.getDashboard(),
      adminService.getHealth(),
    ])
    dashboard.value = dash
    health.value = healthData
  } catch {
    error.value = 'Impossible de charger le tableau de bord.'
  } finally {
    loading.value = false
  }
})

const paymentChart = computed(() =>
  dashboard.value?.charts.payments.map((p) => ({ date: p.date, value: p.count ?? p.value })) ?? [],
)

function healthPaytechStatus() {
  const payments = health.value?.payments as { paytechConfigured?: boolean } | undefined
  return payments?.paytechConfigured ? 'active' : 'FAILED'
}

function healthPdfStatus() {
  const pdf = health.value?.pdfRender as { ok?: boolean } | undefined
  return pdf?.ok ? 'active' : 'FAILED'
}

function healthStorageStatus() {
  const storage = health.value?.storage as { configured?: boolean } | undefined
  return storage?.configured ? 'active' : 'pending'
}
</script>

<template>
  <div>
    <AdminPageHeader
      title="Tableau de bord"
      subtitle="Centre de pilotage Profilo’Z — métriques, revenus et activité en temps réel."
    />

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
        <UiSkeleton v-for="i in 4" :key="i" variant="rect" height="7rem" />
      </div>
      <UiSkeleton variant="rect" height="20rem" />
    </div>

    <template v-else-if="dashboard">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter mb-gutter">
        <AdminStatCard label="Utilisateurs total" :value="formatNumber(dashboard.kpis.users.total)" icon="group" />
        <AdminStatCard label="Inscrits aujourd’hui" :value="formatNumber(dashboard.kpis.users.today)" icon="person_add" />
        <AdminStatCard label="Invités actifs" :value="formatNumber(dashboard.kpis.users.activeGuests)" icon="visibility" />
        <AdminStatCard label="Organisations Business" :value="formatNumber(dashboard.kpis.users.businessOrgs)" icon="domain" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter mb-gutter">
        <AdminStatCard label="CV créés" :value="formatNumber(dashboard.kpis.content.resumes)" :hint="`+${dashboard.kpis.content.resumesToday} aujourd’hui`" icon="description" />
        <AdminStatCard label="Lettres créées" :value="formatNumber(dashboard.kpis.content.letters)" :hint="`+${dashboard.kpis.content.lettersToday} aujourd’hui`" icon="mail" />
        <AdminStatCard label="PDF générés" :value="formatNumber(dashboard.kpis.content.pdfGenerated)" icon="picture_as_pdf" />
        <AdminStatCard label="Imports OCR" :value="formatNumber(dashboard.kpis.content.ocrImports)" icon="document_scanner" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter mb-gutter">
        <AdminStatCard label="CA aujourd’hui" :value="formatXof(dashboard.kpis.revenue.today)" icon="payments" />
        <AdminStatCard label="Cette semaine" :value="formatXof(dashboard.kpis.revenue.week)" icon="date_range" />
        <AdminStatCard label="Ce mois" :value="formatXof(dashboard.kpis.revenue.month)" icon="calendar_month" />
        <AdminStatCard label="Total" :value="formatXof(dashboard.kpis.revenue.total)" icon="account_balance_wallet" />
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-gutter mb-gutter">
        <AdminLineChart title="Inscriptions (30 jours)" :series="dashboard.charts.signups" />
        <AdminLineChart title="Paiements (30 jours)" :series="paymentChart" />
        <AdminLineChart title="CV créés (30 jours)" :series="dashboard.charts.resumes" />
        <AdminLineChart title="Lettres créées (30 jours)" :series="dashboard.charts.letters" />
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-gutter">
        <div class="xl:col-span-2">
          <AdminActivityFeed :items="dashboard.activity" />
        </div>
        <UiCard padding="lg">
          <h3 class="font-semibold text-on-surface mb-3">État de santé</h3>
          <ul class="space-y-2 text-sm">
            <li class="flex justify-between gap-2">
              <span class="text-on-surface-variant">Base de données</span>
              <AdminStatusBadge status="active" />
            </li>
            <li class="flex justify-between gap-2">
              <span class="text-on-surface-variant">PayTech</span>
              <AdminStatusBadge :status="healthPaytechStatus()" />
            </li>
            <li class="flex justify-between gap-2">
              <span class="text-on-surface-variant">Rendu PDF</span>
              <AdminStatusBadge :status="healthPdfStatus()" />
            </li>
            <li class="flex justify-between gap-2">
              <span class="text-on-surface-variant">Stockage</span>
              <AdminStatusBadge :status="healthStorageStatus()" />
            </li>
          </ul>
          <NuxtLink to="/admin/supervision" class="inline-block mt-4 text-sm text-secondary font-semibold hover:underline">
            Centre de supervision →
          </NuxtLink>
        </UiCard>
      </div>
    </template>
  </div>
</template>
