<script setup lang="ts">
import { formatXof } from '@profiloz/shared'
import type { Entitlements, PurchasedPlanSummary } from '~/services/payment.service'
import { summarizeEntitlements } from '~/utils/entitlements-summary'

const props = withDefaults(
  defineProps<{
    plan: PurchasedPlanSummary
    entitlements?: Entitlements | null
    /** service = dossier unique (pas de jargon crédits) ; wallet = crédits / abonnement */
    variant?: 'service' | 'wallet'
  }>(),
  { variant: 'wallet' },
)

const status = computed(() => summarizeEntitlements(props.entitlements))

const statusBadge = computed(() => {
  if (props.variant === 'service') return 'Offre active'
  if (props.entitlements?.unlimitedActive) {
    return props.entitlements.activePlanSlug === 'business' ? 'Business actif' : 'Illimité actif'
  }
  if (props.entitlements && props.entitlements.creditsBalance > 0) {
    return `${props.entitlements.creditsBalance} crédit${props.entitlements.creditsBalance > 1 ? 's' : ''} disponible${props.entitlements.creditsBalance > 1 ? 's' : ''}`
  }
  return 'Offre activée'
})

const showWalletDetail = computed(() => props.variant === 'wallet' && status.value)
</script>

<template>
  <UiCard
    variant="glass"
    padding="lg"
    class="text-left border-secondary/30 bg-gradient-to-br from-secondary/8 to-surface-container-lowest"
  >
    <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div class="flex items-start gap-3 min-w-0">
        <div
          class="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary shrink-0"
        >
          <UiPzIcon :name="plan.kind === 'subscription' ? 'all_inclusive' : 'redeem'" class="text-2xl" />
        </div>
        <div class="min-w-0">
          <p class="text-xs uppercase tracking-wide text-secondary font-semibold">Votre offre</p>
          <h2 class="text-xl sm:text-2xl font-bold text-on-surface">{{ plan.name }}</h2>
          <p class="text-sm text-on-surface-variant mt-0.5">{{ formatXof(plan.amountXof) }}</p>
        </div>
      </div>
      <span
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-semibold shrink-0"
      >
        <UiPzIcon name="check_circle" class="text-[16px]" />
        {{ statusBadge }}
      </span>
    </div>

    <p v-if="plan.description" class="text-sm text-on-surface-variant mb-4">{{ plan.description }}</p>

    <ul class="space-y-2 mb-4">
      <li
        v-for="feature in plan.features"
        :key="feature"
        class="flex items-start gap-2 text-sm text-on-surface"
      >
        <UiPzIcon name="check_circle" class="text-secondary shrink-0 mt-0.5 text-[18px]" />
        <span>{{ feature }}</span>
      </li>
    </ul>

    <div
      v-if="showWalletDetail"
      class="rounded-xl border border-outline-variant/25 bg-white/70 px-3 py-2.5 text-sm"
    >
      <p class="font-semibold text-on-surface">{{ status.title }}</p>
      <p v-if="status.detail" class="text-on-surface-variant mt-0.5">{{ status.detail }}</p>
    </div>
  </UiCard>
</template>
