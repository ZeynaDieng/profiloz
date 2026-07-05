const PLAN_KEY = 'profiloz:payment-plan-slug'
const LAST_PLAN_KEY = 'profiloz:last-purchased-plan'
const ACCOUNT_GATE_KEY = 'profiloz:account-gate-skipped'

export function savePaymentPlanSlug(slug: string) {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(PLAN_KEY, slug)
}

export function peekPaymentPlanSlug(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage.getItem(PLAN_KEY)
}

export function consumePaymentPlanSlug(): string | null {
  const value = peekPaymentPlanSlug()
  if (value) sessionStorage.removeItem(PLAN_KEY)
  return value
}

export function saveLastPurchasedPlan(plan: import('~/services/payment.service').PurchasedPlanSummary) {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(LAST_PLAN_KEY, JSON.stringify(plan))
}

export function peekLastPurchasedPlan(): import('~/services/payment.service').PurchasedPlanSummary | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(LAST_PLAN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as import('~/services/payment.service').PurchasedPlanSummary
  } catch {
    return null
  }
}

export function markAccountGateSkipped() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(ACCOUNT_GATE_KEY, '1')
}

export function hasSkippedAccountGate(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  return sessionStorage.getItem(ACCOUNT_GATE_KEY) === '1'
}
