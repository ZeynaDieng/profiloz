import type { PlanSlug } from '@profiloz/shared'
import type { Entitlements, PurchasedPlanSummary } from '~/services/payment.service'

/** Type d'offre du point de vue parcours utilisateur. */
export type PurchaseAudience = 'single_dossier' | 'portfolio' | 'subscription'

/** Contexte d'achat : depuis la landing/tarifs ou depuis l'éditeur. */
export type PurchaseContext = 'catalog' | 'editor'

export function classifyPurchaseAudience(
  plan?: Pick<PurchasedPlanSummary, 'slug' | 'kind' | 'credits'> | null,
  entitlements?: Entitlements | null,
): PurchaseAudience {
  if (plan) {
    if (plan.slug === 'dossier_unique') return 'single_dossier'
    if (plan.slug === 'pack_10') return 'portfolio'
    if (plan.slug === 'illimite' || plan.slug === 'business') return 'subscription'
    if (plan.kind === 'subscription') return 'subscription'
    if (plan.credits > 1) return 'portfolio'
    return 'single_dossier'
  }

  if (entitlements?.unlimitedActive) return 'subscription'
  if (entitlements && entitlements.creditsBalance > 1) return 'portfolio'
  return 'single_dossier'
}

export function resolvePurchaseContext(hasEditorReturn: boolean): PurchaseContext {
  return hasEditorReturn ? 'editor' : 'catalog'
}

export type EditorDestination = 'cv' | 'letter'

export function editorPathFor(destination: EditorDestination): string {
  return destination === 'letter' ? '/creer/lettre/editeur' : '/creer/editeur'
}

export function accountGatePath(destination: EditorDestination): string {
  return `/paiement/commencer?to=${destination}`
}

export function isSingleDossierService(audience: PurchaseAudience): boolean {
  return audience === 'single_dossier'
}

export function isWalletOffer(audience: PurchaseAudience): boolean {
  return audience === 'portfolio' || audience === 'subscription'
}

export function planSlugLabel(slug: PlanSlug | string): string {
  switch (slug) {
    case 'dossier_unique':
      return 'Dossier unique'
    case 'pack_10':
      return 'Pack 10 dossiers'
    case 'illimite':
      return 'Illimité'
    case 'business':
      return 'Business'
    default:
      return 'Votre offre'
  }
}
