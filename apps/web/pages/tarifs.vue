<script setup lang="ts">
import { formatXof, MSG } from '@profiloz/shared'
import type { PlanDto } from '~/services/payment.service'
import { parseApiAuthError } from '~/utils/api-error'
import { savePaymentDraftBackup, savePaymentGuestSession } from '~/utils/payment-draft-backup'
import { savePaymentRef, savePaymentReturnTo } from '~/utils/payment-return'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: "Tarifs | Profilo'Z",
  description: "Choisissez l'offre qui vous correspond. Paiement uniquement au téléchargement de votre dossier.",
})

const route = useRoute()
const authStore = useAuthStore()
const paymentService = usePaymentService()
const { ensureSession } = useGuestSession()

const plans = ref<PlanDto[]>([])
const entitlements = ref<{ creditsBalance: number; unlimitedActive: boolean } | null>(null)
const loading = ref(true)
const checkingOut = ref<string | null>(null)
const error = ref('')

const resumeId = computed(() =>
  typeof route.query.resumeId === 'string' && route.query.resumeId ? route.query.resumeId : null,
)
const returnTo = computed(() =>
  typeof route.query.returnTo === 'string' && route.query.returnTo.startsWith('/')
    ? route.query.returnTo
    : null,
)
const fromPaywall = computed(() => route.query.reason === 'unlock')

const popularPlan = computed(() => plans.value.find((p) => p.popular) ?? plans.value[0])

onMounted(async () => {
  authStore.loadFromStorage()
  await ensureSession().catch(() => {})

  try {
    const { data } = await paymentService.listPlans()
    plans.value = data
  } catch {
    error.value = MSG.error.loadPlans
  } finally {
    loading.value = false
  }

  try {
    const e = await paymentService.getEntitlements()
    entitlements.value = { creditsBalance: e.creditsBalance, unlimitedActive: e.unlimitedActive }
  } catch {
    entitlements.value = null
  }
})

async function onChoose(plan: PlanDto) {
  error.value = ''
  checkingOut.value = plan.slug
  try {
    await ensureSession()
    if (returnTo.value) savePaymentReturnTo(returnTo.value)
    savePaymentDraftBackup(returnTo.value)
    savePaymentGuestSession(
      import.meta.client ? localStorage.getItem('profiloz:guest-session') : null,
    )
    const { ref, redirectUrl } = await paymentService.checkout(plan.slug, returnTo.value ?? undefined)
    savePaymentRef(ref)
    window.location.href = redirectUrl
  } catch (err) {
    error.value = parseApiAuthError(err, MSG.payment.error)
    checkingOut.value = null
  }
}
</script>

<template>
  <div class="page-container max-w-6xl mx-auto pb-28 md:pb-12">
    <header class="text-center mb-stack-lg">
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-on-surface">Des tarifs simples et transparents</h1>
      <p class="text-on-surface-variant mt-3 max-w-2xl mx-auto text-sm sm:text-base">
        Créez, modifiez et prévisualisez gratuitement. Vous ne payez qu'au moment de télécharger votre dossier.
      </p>
    </header>

    <div
      v-if="fromPaywall"
      class="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-secondary-fixed text-on-secondary-fixed text-sm text-center"
    >
      Votre CV est prêt ! Choisissez une offre pour le télécharger — compte facultatif.
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

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-6 max-w-lg mx-auto" />

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter">
      <UiSkeleton v-for="i in 4" :key="i" variant="rect" height="22rem" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter items-stretch">
      <UiCard
        v-for="plan in plans"
        :key="plan.slug"
        :variant="plan.popular ? 'glass' : 'default'"
        padding="lg"
        class="relative flex flex-col"
        :class="plan.popular ? 'border-secondary shadow-lg ring-1 ring-secondary/20' : ''"
      >
        <span
          v-if="plan.popular"
          class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-secondary text-on-secondary text-xs font-bold"
        >
          Le plus populaire
        </span>

        <h2 class="font-bold text-on-surface text-lg">{{ plan.name }}</h2>
        <p class="text-sm text-on-surface-variant mt-1 min-h-[2.5rem]">{{ plan.description }}</p>

        <div class="mt-4 mb-5">
          <span class="text-3xl font-bold text-on-surface">{{ formatXof(plan.priceXof) }}</span>
          <span v-if="plan.kind === 'subscription'" class="text-on-surface-variant text-sm"> / mois</span>
        </div>

        <ul class="space-y-3 mb-6 flex-1">
          <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-2 text-sm text-on-surface">
            <UiPzIcon name="check_circle" class="text-[18px] text-secondary shrink-0 mt-0.5" />
            <span>{{ feature }}</span>
          </li>
        </ul>

        <UiButton
          block
          :variant="plan.popular ? 'secondary' : 'primary'"
          :loading="checkingOut === plan.slug"
          @click="onChoose(plan)"
        >
          Choisir
        </UiButton>
      </UiCard>
    </div>

    <p class="text-center text-xs text-on-surface-variant mt-10">
      Paiement sécurisé via PayTech (Carte bancaire, Orange Money, Wave, Free Money…).
    </p>

    <!-- Mobile : raccourci vers l'offre populaire -->
    <UiStickyActionBar v-if="popularPlan && !loading" class="md:hidden">
      <UiButton
        variant="secondary"
        block
        :loading="checkingOut === popularPlan.slug"
        @click="onChoose(popularPlan)"
      >
        Choisir {{ popularPlan.name }} — {{ formatXof(popularPlan.priceXof) }}
      </UiButton>
    </UiStickyActionBar>
  </div>
</template>
