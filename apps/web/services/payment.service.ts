import type { PlanSlug } from '@profiloz/shared'

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
    return post<{ status: string; entitlements?: Entitlements }>('/payments/confirm-return', { ref })
  }

  return { listPlans, getEntitlements, checkout, confirmReturn }
}
