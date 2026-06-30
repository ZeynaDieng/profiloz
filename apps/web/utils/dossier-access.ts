import type { Entitlements } from '~/services/payment.service'

/** Droit de télécharger CV ou lettre (1 crédit = dossier complet, retéléchargements inclus). */
export function hasDossierDownloadAccess(entitlements?: Entitlements | null) {
  if (!entitlements) return false
  return entitlements.unlimitedActive
    || entitlements.creditsBalance > 0
    || entitlements.canDownloadSnapshot === true
}
