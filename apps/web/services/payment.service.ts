import type { PlanFeatures, PlanSlug, SubscriptionPlanSlug } from '@profiloz/shared'

export interface PlanDto {
  slug: PlanSlug
  name: string
  priceXof: number
  kind: 'credits' | 'subscription'
  credits: number | null
  durationDays?: number
  description: string
  features: string[]
  popular?: boolean
}

export interface Entitlements {
  creditsBalance: number
  unlimitedUntil: string | null
  unlimitedActive: boolean
  activePlanSlug: SubscriptionPlanSlug | null
  features: PlanFeatures
  canDownloadSnapshot?: boolean
}

export function usePaymentService() {
  const { get, post } = useApiClient()

  async function listPlans() {
    return get<{ data: PlanDto[] }>('/plans')
  }

  async function getEntitlements() {
    return get<Entitlements>('/payments/me')
  }

  /** Démarre un paiement et renvoie l'URL de redirection PayTech. */
  async function checkout(planSlug: PlanSlug, returnTo?: string) {
    return post<{ ref: string; redirectUrl: string }>('/payments/checkout', { planSlug, returnTo })
  }

  /** Confirme le paiement au retour PayTech (fallback si IPN absent ou lent). */
  async function confirmReturn(ref: string) {
    return post<{
      status: string
      entitlements?: Entitlements
      guestSessionClientId?: string
    }>('/payments/confirm-return', { ref })
  }

  /** Démarre un nouveau cycle dossier (pack multi-crédits) après un dossier complet. */
  async function resetDossierCycle() {
    return post<Entitlements>('/payments/reset-dossier-cycle')
  }

  return { listPlans, getEntitlements, checkout, confirmReturn, resetDossierCycle }
}
