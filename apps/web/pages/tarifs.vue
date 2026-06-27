<script setup lang="ts">
import { formatXof } from '@profiloz/shared'
import type { PlanDto } from '~/services/payment.service'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: "Tarifs | Profilo'Z",
  description: "Choisissez l'offre qui vous correspond. Paiement uniquement au téléchargement de votre dossier.",
})

const route = useRoute()
const authStore = useAuthStore()
const paymentService = usePaymentService()

const plans = ref<PlanDto[]>([])
const entitlements = ref<{ creditsBalance: number; unlimitedActive: boolean } | null>(null)
const loading = ref(true)
const checkingOut = ref<string | null>(null)
const error = ref('')

// Contexte : on peut arriver ici depuis un dossier verrouillé.
const resumeId = computed(() =>
  typeof route.query.resumeId === 'string' && route.query.resumeId ? route.query.resumeId : null,
)
const fromPaywall = computed(() => route.query.reason === 'unlock')

onMounted(async () => {
  authStore.loadFromStorage()
  try {
    const { data } = await paymentService.listPlans()
    plans.value = data
  } catch {
    error.value = 'Impossible de charger les offres.'
  } finally {
    loading.value = false
  }

  if (authStore.isAuthenticated) {
    try {
      const e = await paymentService.getEntitlements()
      entitlements.value = { creditsBalance: e.creditsBalance, unlimitedActive: e.unlimitedActive }
    } catch {
      entitlements.value = null
    }
  }
})

async function onChoose(plan: PlanDto) {
  error.value = ''
  if (!authStore.isAuthenticated) {
    const redirect = `/tarifs${resumeId.value ? `?resumeId=${resumeId.value}` : ''}`
    await navigateTo(`/connexion?redirect=${encodeURIComponent(redirect)}`)
    return
  }
  checkingOut.value = plan.slug
  try {
    const { redirectUrl } = await paymentService.checkout(plan.slug)
    window.location.href = redirectUrl
  } catch (err) {
    const problem = err as { detail?: string; title?: string }
    error.value = problem.detail || problem.title || 'Le paiement n’a pas pu démarrer.'
    checkingOut.value = null
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-20">
    <div class="text-center mb-stack-lg">
      <h1 class="text-3xl md:text-4xl font-bold text-on-surface">Des tarifs simples et transparents</h1>
      <p class="text-on-surface-variant mt-3 max-w-2xl mx-auto">
        Créez, modifiez et prévisualisez gratuitement. Vous ne payez qu’au moment de télécharger votre dossier.
      </p>
    </div>

    <div
      v-if="fromPaywall"
      class="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-secondary-fixed text-on-secondary-fixed text-sm text-center"
    >
      Votre dossier est prêt&nbsp;! Choisissez une offre pour le débloquer et le télécharger.
    </div>

    <div
      v-if="entitlements"
      class="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-center text-on-surface"
    >
      <template v-if="entitlements.unlimitedActive">Vous avez un accès illimité actif.</template>
      <template v-else>
        Crédits disponibles : <strong>{{ entitlements.creditsBalance }}</strong>
      </template>
    </div>

    <p v-if="error" class="text-error text-center mb-6">{{ error }}</p>
    <p v-if="loading" class="text-on-surface-variant text-center">Chargement des offres…</p>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter items-stretch">
      <div
        v-for="plan in plans"
        :key="plan.slug"
        class="relative flex flex-col bg-surface border rounded-2xl p-6"
        :class="plan.popular ? 'border-secondary shadow-lg' : 'border-outline-variant'"
      >
        <span
          v-if="plan.popular"
          class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-secondary text-on-secondary text-xs font-bold"
        >
          Le plus populaire
        </span>

        <h2 class="font-bold text-on-surface text-lg">{{ plan.name }}</h2>
        <p class="text-sm text-on-surface-variant mt-1 min-h-10">{{ plan.description }}</p>

        <div class="mt-4 mb-5">
          <span class="text-3xl font-bold text-on-surface">{{ formatXof(plan.priceXof) }}</span>
          <span v-if="plan.kind === 'subscription'" class="text-on-surface-variant text-sm"> / mois</span>
        </div>

        <ul class="space-y-2 mb-6 flex-1">
          <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-2 text-sm text-on-surface">
            <UiPzIcon name="check_circle" class="text-[18px] text-secondary shrink-0 mt-0.5" />
            <span>{{ feature }}</span>
          </li>
        </ul>

        <button
          type="button"
          class="min-h-11 px-5 py-2.5 rounded-lg font-bold disabled:opacity-60"
          :class="plan.popular ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary'"
          :disabled="checkingOut === plan.slug"
          @click="onChoose(plan)"
        >
          {{ checkingOut === plan.slug ? 'Redirection…' : 'Choisir' }}
        </button>
      </div>
    </div>

    <p class="text-center text-xs text-on-surface-variant mt-10">
      Paiement sécurisé via PayTech (Carte bancaire, Orange Money, Wave, Free Money…).
    </p>
  </div>
</template>
