import type { Entitlements } from '~/services/payment.service'

export type EntitlementsSummaryKind = 'unlimited' | 'credits' | 'none'

export interface EntitlementsSummary {
  kind: EntitlementsSummaryKind
  title: string
  detail: string | null
  icon: string
}

function formatExpiry(unlimitedUntil: string | null): string {
  if (!unlimitedUntil) return ''
  const date = new Date(unlimitedUntil)
  if (Number.isNaN(date.getTime())) return ''
  return ` · jusqu'au ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
}

export function summarizeEntitlements(entitlements: Entitlements | null | undefined): EntitlementsSummary | null {
  if (!entitlements) return null

  if (entitlements.unlimitedActive) {
    const planName = entitlements.activePlanSlug === 'business' ? 'Business' : 'Illimité'
    const detail =
      entitlements.creditsBalance > 0
        ? `${entitlements.creditsBalance} crédit${entitlements.creditsBalance > 1 ? 's' : ''} conservé${entitlements.creditsBalance > 1 ? 's' : ''} (non consommés tant que l'abonnement est actif).`
        : 'Dossiers illimités · retéléchargements inclus.'
    return {
      kind: 'unlimited',
      title: `Offre ${planName} active${formatExpiry(entitlements.unlimitedUntil)}`,
      detail,
      icon: 'all_inclusive',
    }
  }

  if (entitlements.creditsBalance > 0) {
    const count = entitlements.creditsBalance
    return {
      kind: 'credits',
      title: `${count} crédit${count > 1 ? 's' : ''} restant${count > 1 ? 's' : ''}`,
      detail: '1 crédit = 1 dossier complet (CV + lettre).',
      icon: 'redeem',
    }
  }

  return {
    kind: 'none',
    title: 'Aucune offre active',
    detail: 'Choisissez une offre pour télécharger vos dossiers.',
    icon: 'shopping_bag',
  }
}
