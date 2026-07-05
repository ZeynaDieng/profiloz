import type { Entitlements } from '~/services/payment.service'

export type EntitlementsSummaryKind = 'unlimited' | 'credits' | 'dossier_active' | 'none'

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

  if (entitlements.canDownloadSnapshot) {
    return {
      kind: 'dossier_active',
      title: 'Dossier en cours débloqué',
      detail: 'Votre offre couvre le dossier actuel (CV + lettre). Retéléchargements inclus.',
      icon: 'folder_open',
    }
  }

  return {
    kind: 'none',
    title: 'Aucune offre active',
    detail: 'Choisissez une offre pour télécharger vos dossiers.',
    icon: 'shopping_bag',
  }
}

/** Libellés affichables dans Paramètres / Mon offre. */
export function listOfferFeatures(entitlements: Entitlements): string[] {
  const items: string[] = []
  const f = entitlements.features

  if (entitlements.unlimitedActive) {
    items.push('Dossiers illimités')
    items.push('Retéléchargements inclus')
    if (f.historique) items.push('Historique complet de vos dossiers')
    if (f.importScan) items.push('Import et scan de documents')
    if (f.businessOrg) items.push('Espace organisation')
    if (f.multiCollaborators) items.push('Multi-collaborateurs')
    return items
  }

  if (entitlements.creditsBalance > 0) {
    const n = entitlements.creditsBalance
    items.push(`${n} dossier${n > 1 ? 's' : ''} complet${n > 1 ? 's' : ''} (CV + lettre)`)
    items.push('Retéléchargements inclus par dossier')
    return items
  }

  if (entitlements.canDownloadSnapshot) {
    items.push('Dossier actuel débloqué (CV + lettre)')
    items.push('Retéléchargements inclus')
  }

  return items
}
