<script setup lang="ts">
import { MSG, PLANS } from '@profiloz/shared'
import type { PlanDto } from '~/services/payment.service'
import { parseApiAuthError } from '~/utils/api-error'
import { savePaymentDraftBackup, savePaymentGuestSession } from '~/utils/payment-draft-backup'
import { savePaymentPlanSlug } from '~/utils/payment-purchase'
import { savePaymentRef } from '~/utils/payment-return'

const paymentService = usePaymentService()
const { ensureSession } = useGuestSession()

const fallbackPlans: PlanDto[] = PLANS.map((plan) => ({
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

const plans = ref<PlanDto[]>([])
const loading = ref(true)
const checkingOut = ref<string | null>(null)
const error = ref('')
const usedFallback = ref(false)
const activePlanIndex = ref(0)

onMounted(async () => {
  await ensureSession().catch(() => {})

  try {
    const { data } = await paymentService.listPlans()
    plans.value = data.length > 0 ? data : fallbackPlans
    usedFallback.value = data.length === 0
  } catch {
    plans.value = fallbackPlans
    usedFallback.value = true
    error.value = MSG.error.loadPlans
  } finally {
    loading.value = false
  }
})

async function onChoose(plan: PlanDto) {
  error.value = ''
  checkingOut.value = plan.slug
  try {
    await ensureSession()
    savePaymentDraftBackup(null)
    savePaymentPlanSlug(plan.slug)
    savePaymentGuestSession(
      import.meta.client ? localStorage.getItem('profiloz:guest-session') : null,
    )
    const { ref, redirectUrl } = await paymentService.checkout(plan.slug)
    savePaymentRef(ref)
    window.location.href = redirectUrl
  } catch (err) {
    error.value = parseApiAuthError(err, MSG.payment.error)
    checkingOut.value = null
  }
}
</script>

<template>
  <section
    id="tarifs"
    class="landing-section bg-white border-t border-outline-variant/30"
    aria-labelledby="pricing-title"
  >
    <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop overflow-x-clip pb-8 md:pb-4">
      <div class="landing-section-header landing-section-header--left">
        <p class="landing-eyebrow">Tarifs</p>
        <h2 id="pricing-title" class="landing-title">
          Des tarifs <span class="text-secondary">simples et transparents</span>
        </h2>
        <p class="landing-lead !max-w-2xl">
          Créez, modifiez et prévisualisez gratuitement. Vous ne payez qu'au moment de télécharger votre dossier.
        </p>
      </div>

      <UiMessageBanner
        v-if="error && usedFallback"
        variant="warning"
        message="Affichage des tarifs par défaut. Le paiement reste disponible."
        class="mb-6 max-w-lg"
      />
      <UiMessageBanner v-else-if="error" variant="error" :message="error" class="mb-6 max-w-lg" />

      <FeaturesLandingPricingPlansRail
        v-if="plans.length > 0 || loading"
        v-model:active-index="activePlanIndex"
        :plans="plans"
        :loading="loading"
        :checking-out="checkingOut"
        :animate-in="true"
        @choose="onChoose"
      />

      <p v-else class="text-center text-sm text-on-surface-variant py-8">
        Les offres seront bientôt disponibles.
        <NuxtLink to="/tarifs" class="text-secondary font-semibold hover:underline">Voir la page tarifs</NuxtLink>
      </p>
    </div>
  </section>
</template>
