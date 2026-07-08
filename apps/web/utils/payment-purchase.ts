const PLAN_KEY = 'profiloz:payment-plan-slug'
const LAST_PLAN_KEY = 'profiloz:last-purchased-plan'
const ACCOUNT_GATE_KEY = 'profiloz:account-gate-skipped'

function writePlanStorage(key: string, value: string) {
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, value)
  if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
}

function readPlanStorage(key: string): string | null {
  if (typeof sessionStorage !== 'undefined') {
    const fromSession = sessionStorage.getItem(key)
    if (fromSession) return fromSession
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key)
  }
  return null
}

export function savePaymentPlanSlug(slug: string) {
  writePlanStorage(PLAN_KEY, slug)
}

export function peekPaymentPlanSlug(): string | null {
  return readPlanStorage(PLAN_KEY)
}

export function consumePaymentPlanSlug(): string | null {
  const value = peekPaymentPlanSlug()
  if (value) sessionStorage.removeItem(PLAN_KEY)
  return value
}

export function saveLastPurchasedPlan(plan: import('~/services/payment.service').PurchasedPlanSummary) {
  writePlanStorage(LAST_PLAN_KEY, JSON.stringify(plan))
}

export function peekLastPurchasedPlan(): import('~/services/payment.service').PurchasedPlanSummary | null {
  const raw = readPlanStorage(LAST_PLAN_KEY)
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
