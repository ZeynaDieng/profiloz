import type { Entitlements } from '~/services/payment.service'
import { loadGuestDossierState } from '~/utils/guest-dossier-state'

/** Droit de télécharger CV ou lettre (1 crédit = dossier complet, retéléchargements inclus). */
export function hasDossierDownloadAccess(entitlements?: Entitlements | null) {
  if (!entitlements) {
    const dossier = loadGuestDossierState()
    return Boolean(dossier?.paidAt && (dossier.cvDownloaded || dossier.letterDownloaded))
  }

  return (
    Boolean(entitlements.unlimitedActive) ||
    Number(entitlements.creditsBalance) > 0 ||
    Boolean(entitlements.canDownloadSnapshot)
  )
}
