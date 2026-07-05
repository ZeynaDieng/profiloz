<script setup lang="ts">
import { formatXof, MSG, PLANS } from '@profiloz/shared'
import type { PlanDto } from '~/services/payment.service'
import { parseApiAuthError } from '~/utils/api-error'
import { hasDossierDownloadAccess } from '~/utils/dossier-access'
import { savePaymentDraftBackup, savePaymentGuestSession } from '~/utils/payment-draft-backup'
import { withAutoDownloadQuery } from '~/utils/payment-auto-download'
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
const { fetchEntitlements } = usePaymentEntitlements()

const plans = ref<PlanDto[]>([])
const entitlements = ref<import('~/services/payment.service').Entitlements | null>(null)
const loading = ref(true)
const checkingOut = ref<string | null>(null)
const error = ref('')
const activePlanIndex = ref(0)

const resumeId = computed(() =>
  typeof route.query.resumeId === 'string' && route.query.resumeId ? route.query.resumeId : null,
)
const returnTo = computed(() =>
  typeof route.query.returnTo === 'string' && route.query.returnTo.startsWith('/')
    ? route.query.returnTo
    : null,
)
const fromPaywall = computed(() => route.query.reason === 'unlock')

const activePlan = computed(
  () => plans.value[activePlanIndex.value] ?? plans.value.find((p) => p.popular) ?? plans.value[0],
)

onMounted(async () => {
  authStore.loadFromStorage()
  await ensureSession().catch(() => {})

  try {
    const { data } = await paymentService.listPlans()
    plans.value = data
  } catch {
    error.value = MSG.error.loadPlans
    plans.value = PLANS.map((plan) => ({
      slug: plan.slug,
      name: plan.name,
      priceXof: plan.priceXof,
      kind: plan.kind,
      credits: Number.isFinite(plan.credits) ? plan.credits : null,
      durationDays: plan.durationDays,
      description: plan.description,
      features: [...plan.features],
      popular: plan.popular,
    }))
  } finally {
    loading.value = false
  }

  try {
    entitlements.value = await fetchEntitlements()
    if (
      returnTo.value
      && fromPaywall.value
      && entitlements.value
      && hasDossierDownloadAccess(entitlements.value)
    ) {
      await navigateTo(withAutoDownloadQuery(returnTo.value), { replace: true })
    }
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
  <div
    class="page-container max-w-6xl mx-auto pb-28 md:pb-12"
    :class="fromPaywall && 'tarifs-page--paywall'"
  >
    <header
      class="text-center mb-stack-lg"
      :class="fromPaywall && 'tarifs-page__header--paywall'"
    >
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-on-surface">
        <template v-if="fromPaywall">Choisissez votre offre</template>
        <template v-else>Des tarifs simples et transparents</template>
      </h1>
      <p class="text-on-surface-variant mt-3 max-w-2xl mx-auto text-sm sm:text-base">
        <template v-if="fromPaywall">
          Votre dossier est prêt. Comparez les offres et payez uniquement pour télécharger.
        </template>
        <template v-else>
          Créez, modifiez et prévisualisez gratuitement. Vous ne payez qu'au moment de télécharger votre dossier.
        </template>
      </p>
    </header>

    <div
      v-if="fromPaywall"
      class="tarifs-page__banner max-w-2xl mx-auto mb-6 md:mb-8 p-4 rounded-xl bg-secondary-fixed text-on-secondary-fixed text-sm text-center"
    >
      Votre CV est prêt ! Choisissez une offre pour le télécharger (compte facultatif).
    </div>

    <div
      v-if="entitlements"
      class="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-center text-on-surface"
    >
      <template v-if="entitlements.unlimitedActive">
        <span v-if="entitlements.activePlanSlug === 'business'">Votre offre Business est active.</span>
        <span v-else>Votre offre Illimité est active.</span>
      </template>
      <template v-else>
        Crédits disponibles : <strong>{{ entitlements.creditsBalance }}</strong>
      </template>
    </div>

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-6 max-w-lg mx-auto" />

    <FeaturesLandingPricingPlansRail
      v-model:active-index="activePlanIndex"
      :plans="plans"
      :loading="loading"
      :checking-out="checkingOut"
      :paywall-highlight="fromPaywall"
      :animate-in="!loading"
      @choose="onChoose"
    />

    <UiStickyActionBar v-if="activePlan && !loading" class="md:hidden">
      <UiButton
        variant="secondary"
        block
        :loading="checkingOut === activePlan.slug"
        @click="onChoose(activePlan)"
      >
        Choisir {{ activePlan.name }} · {{ formatXof(activePlan.priceXof) }}
      </UiButton>
    </UiStickyActionBar>
  </div>
</template>

<style scoped>
.tarifs-page--paywall .tarifs-page__header--paywall {
  animation: tarifs-header-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.tarifs-page--paywall .tarifs-page__banner {
  animation: tarifs-header-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both;
}

@keyframes tarifs-header-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tarifs-page--paywall .tarifs-page__header--paywall,
  .tarifs-page--paywall .tarifs-page__banner {
    animation: none;
  }
}
</style>
