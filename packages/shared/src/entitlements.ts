import type { PlanSlug } from './payment.js'

/** Abonnements mensuels (distincts des packs à crédits). */
export const SUBSCRIPTION_PLAN_SLUGS = ['illimite', 'business'] as const
export type SubscriptionPlanSlug = (typeof SUBSCRIPTION_PLAN_SLUGS)[number]

export interface PlanFeatures {
  /** Déblocage illimité sans consommer de crédits (Illimité / Business). */
  unlimitedUnlocks: boolean
  /** Historique des dossiers et documents importés (dashboard). */
  historique: boolean
  /** Import & scan depuis l'espace documents (abonnement). */
  importScan: boolean
  /** Espace organisation (Business). */
  businessOrg: boolean
  /** Multi-collaborateurs (Business). */
  multiCollaborators: boolean
  /** Peut débloquer des dossiers via crédits (packs inférieurs). */
  canUnlockWithCredits: boolean
}

export interface ResolvedEntitlements {
  creditsBalance: number
  unlimitedUntil: Date | null
  unlimitedActive: boolean
  activePlanSlug: SubscriptionPlanSlug | null
  features: PlanFeatures
}

export function isSubscriptionPlanSlug(slug: string): slug is SubscriptionPlanSlug {
  return slug === 'illimite' || slug === 'business'
}

/** Business hérite de tout Illimité ; on conserve le palier le plus élevé. */
export function mergeSubscriptionPlanSlug(
  current: SubscriptionPlanSlug | null | undefined,
  incoming: SubscriptionPlanSlug,
): SubscriptionPlanSlug {
  if (!current) return incoming
  if (current === 'business' || incoming === 'business') return 'business'
  return incoming
}

/**
 * Dérive les droits effectifs à partir de l'état compte / session.
 * Business inclut explicitement toutes les fonctionnalités Illimité + ses extras.
 */
export function resolvePlanFeatures(input: {
  unlimitedActive: boolean
  activePlanSlug: SubscriptionPlanSlug | null
  creditsBalance: number
}): PlanFeatures {
  const { unlimitedActive, activePlanSlug, creditsBalance } = input
  const hasSubscription = unlimitedActive
  const isBusiness = hasSubscription && activePlanSlug === 'business'

  return {
    unlimitedUnlocks: hasSubscription,
    historique: hasSubscription,
    importScan: hasSubscription,
    businessOrg: isBusiness,
    multiCollaborators: isBusiness,
    canUnlockWithCredits: creditsBalance > 0,
  }
}

export function resolveEntitlements(input: {
  creditsBalance: number
  unlimitedUntil: Date | null | undefined
  subscriptionPlanSlug: SubscriptionPlanSlug | null | undefined
}): ResolvedEntitlements {
  const unlimitedUntil = input.unlimitedUntil ?? null
  const unlimitedActive = Boolean(unlimitedUntil && unlimitedUntil.getTime() > Date.now())
  const storedPlanSlug = input.subscriptionPlanSlug ?? null
  const activePlanSlug = unlimitedActive
    ? storedPlanSlug && isSubscriptionPlanSlug(storedPlanSlug)
      ? storedPlanSlug
      : 'illimite'
    : null

  return {
    creditsBalance: input.creditsBalance,
    unlimitedUntil,
    unlimitedActive,
    activePlanSlug,
    features: resolvePlanFeatures({
      unlimitedActive,
      activePlanSlug,
      creditsBalance: input.creditsBalance,
    }),
  }
}

export function planSlugGrantsSubscription(slug: PlanSlug): slug is SubscriptionPlanSlug {
  return isSubscriptionPlanSlug(slug)
}
