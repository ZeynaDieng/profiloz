<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatNumber } = useAdminFormat()

const analytics = ref<any>(null)
const loading = ref(true)
const error = ref('')
const selectedDays = ref(90)

async function loadAnalytics() {
  loading.value = true
  error.value = ''
  try {
    analytics.value = await adminService.getAnalytics(selectedDays.value)
  } catch (err) {
    console.error('Analytics load error:', err)
    error.value = 'Impossible de charger les données d’analytics.'
  } finally {
    loading.value = false
  }
}

onMounted(loadAnalytics)

watch(selectedDays, loadAnalytics)

const totals = computed(() => analytics.value?.totals ?? {})
const funnel = computed(() => (analytics.value?.funnel as Array<{ key: string; label: string; count: number; rate: number }>) ?? [])
const pageView = computed(() => (analytics.value?.page_view as Array<{ date: string; value: number }>) ?? [])
const signup = computed(() => (analytics.value?.signup as Array<{ date: string; value: number }>) ?? [])
const cvCreated = computed(() => (analytics.value?.cv_created as Array<{ date: string; value: number }>) ?? [])
const cvImported = computed(() => (analytics.value?.cv_imported as Array<{ date: string; value: number }>) ?? [])
const cvCompleted = computed(() => (analytics.value?.cv_completed as Array<{ date: string; value: number }>) ?? [])
const applicationCreated = computed(() => (analytics.value?.application_created as Array<{ date: string; value: number }>) ?? [])
const paymentStarted = computed(() => (analytics.value?.payment_started as Array<{ date: string; value: number }>) ?? [])
const paymentSuccess = computed(() => (analytics.value?.payment_success as Array<{ date: string; value: number }>) ?? [])
const pdfDownload = computed(() => (analytics.value?.pdf_download as Array<{ date: string; value: number }>) ?? [])

const eventMetrics = computed(() => [
  { key: 'page_view', label: '1. Visites & Sessions', code: 'page_view', value: totals.value.page_view ?? 0, icon: 'visibility', color: 'bg-blue-500/10 text-blue-600' },
  { key: 'signup', label: '2. Inscriptions', code: 'signup', value: totals.value.signup ?? 0, icon: 'person_add', color: 'bg-purple-500/10 text-purple-600' },
  { key: 'cv_created', label: '3. CV créés (manuel)', code: 'cv_created', value: totals.value.cv_created ?? 0, icon: 'description', color: 'bg-emerald-500/10 text-emerald-600' },
  { key: 'cv_imported', label: '4. CV importés (PDF/Word)', code: 'cv_imported', value: totals.value.cv_imported ?? 0, icon: 'upload_file', color: 'bg-teal-500/10 text-teal-600' },
  { key: 'cv_completed', label: '5. CV complétés (+70%)', code: 'cv_completed', value: totals.value.cv_completed ?? 0, icon: 'task_alt', color: 'bg-indigo-500/10 text-indigo-600' },
  { key: 'application_created', label: '6. Lettres / Candidatures', code: 'application_created', value: totals.value.application_created ?? 0, icon: 'mail', color: 'bg-amber-500/10 text-amber-600' },
  { key: 'payment_started', label: '7. Paiements démarrés', code: 'payment_started', value: totals.value.payment_started ?? 0, icon: 'shopping_cart', color: 'bg-orange-500/10 text-orange-600' },
  { key: 'payment_success', label: '8. Paiements réussis', code: 'payment_success', value: totals.value.payment_success ?? 0, icon: 'payments', color: 'bg-green-500/10 text-green-600' },
  { key: 'pdf_download', label: '9. Téléchargements PDF', code: 'pdf_download', value: totals.value.pdf_download ?? 0, icon: 'download', color: 'bg-sky-500/10 text-sky-600' },
])

const kpiRates = computed(() => analytics.value?.kpiRates ?? { signupRate: 0, activationRate: 0, paymentRate: 0 })
</script>

<template>
  <div class="space-y-6 pb-12">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <AdminPageHeader
        title="Rapport d'Analytics & Tunnel de Conversion"
        subtitle="Suivi complet des 9 événements clés pour analyser le comportement des visiteurs avant lancement de trafic."
      />
      <div class="flex items-center gap-2 self-start sm:self-auto">
        <label class="text-xs font-semibold text-on-surface-variant">Période :</label>
        <select
          v-model="selectedDays"
          class="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
        >
          <option :value="7">7 derniers jours</option>
          <option :value="30">30 derniers jours</option>
          <option :value="90">90 derniers jours</option>
          <option :value="365">1 an</option>
        </select>
      </div>
    </div>

    <UiMessageBanner v-if="error" variant="error" :message="error" />

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UiSkeleton v-for="i in 9" :key="i" variant="rect" height="6rem" />
    </div>

    <template v-else-if="analytics">
      <!-- 🎯 LES 3 TAUX CLÉS DE PERFORMANCES -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Taux d'inscription -->
        <div class="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 shadow-xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase tracking-wider text-blue-700">Taux d'inscription</span>
            <div class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
              <UiPzIcon name="person_add" />
            </div>
          </div>
          <p class="text-3xl font-black text-blue-900">{{ kpiRates.signupRate }} %</p>
          <p class="text-[11px] font-medium text-slate-600">
            Formule : Inscriptions / Visiteurs × 100
          </p>
        </div>

        <!-- Taux d'activation -->
        <div class="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 shadow-xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase tracking-wider text-emerald-700">Taux d'activation</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
              <UiPzIcon name="bolt" />
            </div>
          </div>
          <p class="text-3xl font-black text-emerald-900">{{ kpiRates.activationRate }} %</p>
          <p class="text-[11px] font-medium text-slate-600">
            Formule : CV créés / Inscriptions × 100
          </p>
        </div>

        <!-- Taux de paiement -->
        <div class="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 shadow-xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase tracking-wider text-amber-700">Taux de paiement</span>
            <div class="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center text-sm font-bold">
              <UiPzIcon name="payments" />
            </div>
          </div>
          <p class="text-3xl font-black text-amber-900">{{ kpiRates.paymentRate }} %</p>
          <p class="text-[11px] font-medium text-slate-600">
            Formule : Paiements réussis / Candidatures × 100
          </p>
        </div>
      </div>
      <!-- 🏆 LES 9 ÉVÉNEMENTS CLÉS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="item in eventMetrics"
          :key="item.code"
          class="p-4 rounded-2xl bg-surface border border-outline-variant/50 shadow-xs flex items-center justify-between gap-3"
        >
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">{{ item.code }}</span>
            </div>
            <p class="text-xs font-bold text-on-surface truncate">{{ item.label }}</p>
            <p class="text-xl sm:text-2xl font-black text-on-surface">{{ formatNumber(item.value) }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" :class="item.color">
            <UiPzIcon :name="item.icon" class="text-2xl" />
          </div>
        </div>
      </div>

      <!-- 📊 RAPPORT DE TUNNEL DE CONVERSION -->
      <div class="p-6 rounded-2xl bg-surface border border-outline-variant/60 shadow-sm space-y-4">
        <div class="flex items-center justify-between border-b border-outline-variant/40 pb-4">
          <div>
            <h3 class="text-lg font-bold text-on-surface flex items-center gap-2">
              <UiPzIcon name="filter_alt" class="text-secondary" />
              Rapport de Tunnel de Conversion (Funnel)
            </h3>
            <p class="text-xs text-on-surface-variant mt-0.5">Taux de passage entre chaque étape du parcours visiteur.</p>
          </div>
          <span class="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-extrabold">
            {{ selectedDays }} jours
          </span>
        </div>

        <div class="space-y-3">
          <div
            v-for="(step, idx) in funnel"
            :key="step.key"
            class="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div class="flex items-center gap-3 min-w-0 sm:w-1/3">
              <div class="w-7 h-7 rounded-lg bg-surface-container text-on-surface font-extrabold text-xs flex items-center justify-center shrink-0">
                {{ idx + 1 }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-on-surface truncate">{{ step.label }}</p>
                <p class="text-xs text-on-surface-variant font-mono">{{ formatNumber(step.count) }} événements</p>
              </div>
            </div>

            <!-- Barre de progression -->
            <div class="flex-1 max-w-md w-full">
              <div class="w-full h-3 rounded-full bg-surface-container overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="idx === 0 ? 'bg-blue-600' : idx <= 3 ? 'bg-teal-500' : idx <= 5 ? 'bg-amber-500' : 'bg-emerald-600'"
                  :style="{ width: `${Math.min(100, Math.max(2, step.rate))}%` }"
                />
              </div>
            </div>

            <div class="sm:w-28 text-right shrink-0">
              <span class="text-sm font-black text-on-surface">{{ step.rate }} %</span>
              <span class="text-[11px] text-on-surface-variant block">{{ idx === 0 ? 'du trafic total' : 'étape précédente' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 📈 EVOLUTION QUOTIDIENNE DE CHAQUE ÉVÉNEMENT -->
      <div class="space-y-4">
        <h3 class="text-lg font-bold text-on-surface">Évolution quotidienne des 9 événements</h3>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-gutter">
          <AdminLineChart title="1. Visites (page_view)" :series="pageView" />
          <AdminLineChart title="2. Inscriptions (signup)" :series="signup" />
          <AdminLineChart title="3. CV créés manuellement (cv_created)" :series="cvCreated" />
          <AdminLineChart title="4. CV importés (cv_imported)" :series="cvImported" />
          <AdminLineChart title="5. CV complétés (+70%) (cv_completed)" :series="cvCompleted" />
          <AdminLineChart title="6. Lettres / Candidatures (application_created)" :series="applicationCreated" />
          <AdminLineChart title="7. Paiements démarrés (payment_started)" :series="paymentStarted" />
          <AdminLineChart title="8. Paiements réussis (payment_success)" :series="paymentSuccess" />
          <AdminLineChart title="9. Téléchargements PDF (pdf_download)" :series="pdfDownload" />
        </div>
      </div>
    </template>
  </div>
</template>
